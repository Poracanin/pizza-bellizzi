#!/usr/bin/env python3
"""Build the Pizza Bellizzi address database from official RUIAN CSV files."""

import argparse
import csv
import io
import json
import re
import sqlite3
import sys
import tempfile
import unicodedata
import urllib.request
import zipfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INDEX_URL = "https://services.cuzk.cz/atom-index/RUIAN-CSV-ADR-OB/5513"
USER_AGENT = "PizzaBellizziAddressImporter/1.0 (+https://pizzabelizzi.cz)"

CSV_FIELDS = {
    "ruian_address_id": "Kód ADM",
    "municipality_code": "Kód obce",
    "municipality_name": "Název obce",
    "city_part_code": "Kód části obce",
    "city_part": "Název části obce",
    "street_code": "Kód ulice",
    "street": "Název ulice",
    "building_type": "Typ SO",
    "house_number": "Číslo domovní",
    "orientation_number": "Číslo orientační",
    "orientation_letter": "Znak čísla orientačního",
    "postal_code": "PSČ",
    "sjtsk_y": "Souřadnice Y",
    "sjtsk_x": "Souřadnice X",
    "valid_from": "Platí Od",
}


class DirectoryListingParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self._in_row = False
        self._in_cell = False
        self._cell_parts = []
        self._cells = []
        self._link = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "tr":
            self._in_row = True
            self._cells = []
            self._link = None
        elif self._in_row and tag in ("td", "th"):
            self._in_cell = True
            self._cell_parts = []
        elif self._in_row and tag == "a":
            href = attrs.get("href", "")
            if href.endswith("_ADR.csv.zip"):
                self._link = href

    def handle_data(self, data):
        if self._in_cell:
            self._cell_parts.append(data)

    def handle_endtag(self, tag):
        if self._in_row and tag in ("td", "th") and self._in_cell:
            self._cells.append("".join(self._cell_parts).strip())
            self._in_cell = False
        elif tag == "tr" and self._in_row:
            if self._link:
                self.rows.append((self._cells, self._link))
            self._in_row = False


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def normalize(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.lower().replace("-", " ")
    return " ".join(value.split())


def to_int(value):
    value = (value or "").strip()
    return int(value) if value else None


def to_float(value):
    value = (value or "").strip().replace(",", ".")
    return float(value) if value else None


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def house_designation(row):
    house = row[CSV_FIELDS["house_number"]].strip()
    building_type = row[CSV_FIELDS["building_type"]].strip()
    if building_type == "č.ev.":
        house = "ev. " + house
    orientation = row[CSV_FIELDS["orientation_number"]].strip()
    orientation_letter = row[CSV_FIELDS["orientation_letter"]].strip()
    if orientation:
        house += "/" + orientation + orientation_letter
    return house


def display_address(row):
    municipality = row[CSV_FIELDS["municipality_name"]].strip()
    city_part = row[CSV_FIELDS["city_part"]].strip()
    street = row[CSV_FIELDS["street"]].strip()
    location = street or city_part
    parts = [f"{location} {house_designation(row)}"]
    if street and city_part and normalize(city_part) != normalize(municipality):
        parts.append(city_part)
    parts.append(f"{row[CSV_FIELDS['postal_code']].strip()} {municipality}")
    return ", ".join(parts)


def discover_downloads(index_url):
    parser = DirectoryListingParser()
    parser.feed(fetch(index_url).decode("utf-8-sig"))
    downloads = {}
    pattern = re.compile(r"^(.+) \[(\d+)\]$")
    for cells, link in parser.rows:
        for cell in reversed(cells):
            match = pattern.match(cell)
            if match:
                downloads[int(match.group(2))] = {
                    "name": match.group(1),
                    "url": link,
                }
                break
    return downloads


def load_config(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def create_rule_rows(config):
    zones_by_code = {zone["code"]: zone for zone in config["zones"]}
    municipalities = {item["code"]: item for item in config["municipalities"]}
    rows = []
    for municipality in config["municipalities"]:
        rows.append({
            "priority": 100,
            "zone_id": zones_by_code[municipality["default_zone"]]["id"],
            "municipality_code": municipality["code"],
            "municipality_name": municipality["name"],
            "city_part": None,
            "street": None,
            "label": municipality["name"],
        })
    for override in config["overrides"]:
        municipality = municipalities[override["municipality_code"]]
        rows.append({
            "priority": override["priority"],
            "zone_id": zones_by_code[override["zone"]]["id"],
            "municipality_code": municipality["code"],
            "municipality_name": municipality["name"],
            "city_part": override.get("city_part"),
            "street": override.get("street"),
            "label": override["label"],
        })
    return sorted(rows, key=lambda row: row["priority"], reverse=True)


def matching_rule(row, rules_by_municipality):
    municipality_code = int(row[CSV_FIELDS["municipality_code"]])
    city_part = normalize(row[CSV_FIELDS["city_part"]])
    street = normalize(row[CSV_FIELDS["street"]])
    for rule in rules_by_municipality[municipality_code]:
        if rule["city_part"] and normalize(rule["city_part"]) != city_part:
            continue
        if rule["street"] and normalize(rule["street"]) != street:
            continue
        return rule
    raise RuntimeError(f"No zone rule matched RUIAN address {row[CSV_FIELDS['ruian_address_id']]}")


def read_ruian_rows(archive_bytes):
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        csv_names = [name for name in archive.namelist() if name.lower().endswith(".csv")]
        if len(csv_names) != 1:
            raise RuntimeError(f"Expected one CSV in archive, found {len(csv_names)}")
        content = archive.read(csv_names[0]).decode("cp1250")
        yield from csv.DictReader(io.StringIO(content), delimiter=";")


def source_date_from_url(url):
    match = re.search(r"/(\d{8})_OB_", url)
    if not match:
        return datetime.now(timezone.utc).date().isoformat()
    value = match.group(1)
    return f"{value[:4]}-{value[4:6]}-{value[6:]}"


def prepare_database(db_path, schema_path, config, rules):
    if db_path.exists():
        db_path.unlink()
    connection = sqlite3.connect(str(db_path))
    connection.executescript(schema_path.read_text(encoding="utf-8"))
    connection.executemany(
        "INSERT INTO delivery_zones (id, code, name, fee_czk, min_pizzas) VALUES (?, ?, ?, ?, ?)",
        [(z["id"], z["code"], z["name"], z["fee_czk"], z["min_pizzas"]) for z in config["zones"]],
    )
    for rule in rules:
        cursor = connection.execute(
            """
            INSERT INTO zone_rules
                (priority, zone_id, municipality_code, municipality_name, city_part, street, label)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rule["priority"], rule["zone_id"], rule["municipality_code"],
                rule["municipality_name"], rule["city_part"], rule["street"], rule["label"],
            ),
        )
        rule["id"] = cursor.lastrowid
    connection.commit()
    return connection


def build_record(row, rule, source_date):
    display = display_address(row)
    search = normalize(" ".join([
        display,
        row[CSV_FIELDS["city_part"]],
        row[CSV_FIELDS["street"]],
        row[CSV_FIELDS["postal_code"]],
    ]))
    return (
        int(row[CSV_FIELDS["ruian_address_id"]]),
        int(row[CSV_FIELDS["municipality_code"]]),
        row[CSV_FIELDS["municipality_name"]].strip(),
        to_int(row[CSV_FIELDS["city_part_code"]]),
        row[CSV_FIELDS["city_part"]].strip(),
        to_int(row[CSV_FIELDS["street_code"]]),
        row[CSV_FIELDS["street"]].strip() or None,
        row[CSV_FIELDS["building_type"]].strip(),
        row[CSV_FIELDS["house_number"]].strip(),
        row[CSV_FIELDS["orientation_number"]].strip() or None,
        row[CSV_FIELDS["orientation_letter"]].strip() or None,
        row[CSV_FIELDS["postal_code"]].strip(),
        to_float(row[CSV_FIELDS["sjtsk_y"]]),
        to_float(row[CSV_FIELDS["sjtsk_x"]]),
        row[CSV_FIELDS["valid_from"]].strip().replace("T", " ") or None,
        display,
        search,
        rule["zone_id"],
        rule["id"],
        source_date,
    )


ADDRESS_COLUMNS = (
    "ruian_address_id", "municipality_code", "municipality_name", "city_part_code",
    "city_part", "street_code", "street", "building_type", "house_number",
    "orientation_number", "orientation_letter", "postal_code", "sjtsk_y", "sjtsk_x",
    "valid_from", "display_address", "search_text", "zone_id", "zone_rule_id",
    "source_updated_date",
)


def export_csv(connection, csv_path):
    query = """
        SELECT a.ruian_address_id, a.display_address, a.municipality_name, a.city_part,
               a.street, a.house_number, a.orientation_number, a.postal_code,
               z.code, z.fee_czk, r.label
        FROM addresses a
        JOIN delivery_zones z ON z.id = a.zone_id
        JOIN zone_rules r ON r.id = a.zone_rule_id
        ORDER BY a.search_text
    """
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle, delimiter=";")
        writer.writerow([
            "ruian_address_id", "adresa", "obec", "cast_obce", "ulice", "cislo_domovni",
            "cislo_orientacni", "psc", "zona", "cena_rozvozu_czk", "pravidlo",
        ])
        writer.writerows(connection.execute(query))


def export_mariadb(connection, sql_path):
    zones = list(connection.execute(
        "SELECT id, code, name, fee_czk, min_pizzas, active FROM delivery_zones ORDER BY id"
    ))
    rules = list(connection.execute(
        """SELECT id, priority, zone_id, municipality_code, municipality_name,
                  city_part, street, label FROM zone_rules ORDER BY id"""
    ))
    addresses = connection.execute(
        "SELECT " + ", ".join(ADDRESS_COLUMNS) + " FROM addresses ORDER BY id"
    )
    with sql_path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("-- Generated from official RUIAN data by import_ruian.py\n")
        handle.write("SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n")
        handle.write("DROP TABLE IF EXISTS addresses;\nDROP TABLE IF EXISTS zone_rules;\nDROP TABLE IF EXISTS delivery_zones;\n")
        handle.write("""
CREATE TABLE delivery_zones (
  id INT UNSIGNED PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  fee_czk INT UNSIGNED NOT NULL,
  min_pizzas INT UNSIGNED NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;
CREATE TABLE zone_rules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  priority INT NOT NULL,
  zone_id INT UNSIGNED NOT NULL,
  municipality_code INT UNSIGNED NOT NULL,
  municipality_name VARCHAR(100) NOT NULL,
  city_part VARCHAR(100) NULL,
  street VARCHAR(100) NULL,
  label VARCHAR(100) NOT NULL,
  KEY zone_rules_match_idx (municipality_code, priority),
  CONSTRAINT zone_rules_zone_fk FOREIGN KEY (zone_id) REFERENCES delivery_zones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;
CREATE TABLE addresses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ruian_address_id INT UNSIGNED NOT NULL UNIQUE,
  municipality_code INT UNSIGNED NOT NULL,
  municipality_name VARCHAR(100) NOT NULL,
  city_part_code INT UNSIGNED NULL,
  city_part VARCHAR(100) NOT NULL,
  street_code INT UNSIGNED NULL,
  street VARCHAR(150) NULL,
  building_type VARCHAR(10) NOT NULL,
  house_number VARCHAR(10) NOT NULL,
  orientation_number VARCHAR(10) NULL,
  orientation_letter VARCHAR(3) NULL,
  postal_code CHAR(5) NOT NULL,
  sjtsk_y DECIMAL(12,2) NULL,
  sjtsk_x DECIMAL(12,2) NULL,
  valid_from DATETIME NULL,
  display_address VARCHAR(400) NOT NULL,
  search_text VARCHAR(500) NOT NULL,
  zone_id INT UNSIGNED NOT NULL,
  zone_rule_id INT UNSIGNED NOT NULL,
  source_updated_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY addresses_zone_idx (zone_id),
  KEY addresses_municipality_idx (municipality_code, city_part, street),
  FULLTEXT KEY addresses_search_ft (display_address, search_text),
  CONSTRAINT addresses_zone_fk FOREIGN KEY (zone_id) REFERENCES delivery_zones(id),
  CONSTRAINT addresses_rule_fk FOREIGN KEY (zone_rule_id) REFERENCES zone_rules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;
""")
        handle.write("INSERT INTO delivery_zones (id,code,name,fee_czk,min_pizzas,active) VALUES\n")
        handle.write(",\n".join("(" + ",".join(sql_value(v) for v in row) + ")" for row in zones) + ";\n")
        handle.write("INSERT INTO zone_rules (id,priority,zone_id,municipality_code,municipality_name,city_part,street,label) VALUES\n")
        handle.write(",\n".join("(" + ",".join(sql_value(v) for v in row) + ")" for row in rules) + ";\n")
        columns = ",".join(ADDRESS_COLUMNS)
        batch = []
        for row in addresses:
            batch.append("(" + ",".join(sql_value(v) for v in row) + ")")
            if len(batch) == 500:
                handle.write(f"INSERT INTO addresses ({columns}) VALUES\n" + ",\n".join(batch) + ";\n")
                batch = []
        if batch:
            handle.write(f"INSERT INTO addresses ({columns}) VALUES\n" + ",\n".join(batch) + ";\n")
        handle.write("SET FOREIGN_KEY_CHECKS=1;\n")


def validate(connection, expected_municipalities):
    problems = []
    count = connection.execute("SELECT COUNT(*) FROM addresses").fetchone()[0]
    if count == 0:
        problems.append("No addresses were imported")
    missing = set(expected_municipalities) - {
        row[0] for row in connection.execute("SELECT DISTINCT municipality_code FROM addresses")
    }
    if missing:
        problems.append("Municipalities without addresses: " + ", ".join(map(str, sorted(missing))))
    orphaned = connection.execute(
        "SELECT COUNT(*) FROM addresses WHERE zone_id IS NULL OR zone_rule_id IS NULL"
    ).fetchone()[0]
    if orphaned:
        problems.append(f"Addresses without a zone: {orphaned}")
    unused_overrides = [
        row[0] for row in connection.execute(
            """
            SELECT r.label
            FROM zone_rules r
            LEFT JOIN addresses a ON a.zone_rule_id = r.id
            WHERE r.priority > 100
            GROUP BY r.id
            HAVING COUNT(a.id) = 0
            """
        )
    ]
    if unused_overrides:
        problems.append("Zone overrides without addresses: " + ", ".join(unused_overrides))
    if problems:
        raise RuntimeError("; ".join(problems))
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=BASE_DIR / "zones.json")
    parser.add_argument("--schema", type=Path, default=BASE_DIR / "schema.sqlite.sql")
    parser.add_argument("--database", type=Path, default=BASE_DIR / "pizza_bellizzi_addresses.sqlite")
    parser.add_argument("--csv", type=Path, default=BASE_DIR / "pizza_bellizzi_addresses.csv")
    parser.add_argument("--mariadb", type=Path, default=BASE_DIR / "pizza_bellizzi_addresses.mariadb.sql")
    parser.add_argument("--index-url", default=DEFAULT_INDEX_URL)
    args = parser.parse_args()

    config = load_config(args.config)
    rules = create_rule_rows(config)
    rules_by_municipality = {}
    for rule in rules:
        rules_by_municipality.setdefault(rule["municipality_code"], []).append(rule)

    downloads = discover_downloads(args.index_url)
    municipality_codes = [item["code"] for item in config["municipalities"]]
    missing_downloads = set(municipality_codes) - set(downloads)
    if missing_downloads:
        raise RuntimeError("RUIAN files not found for codes: " + ", ".join(map(str, sorted(missing_downloads))))

    args.database.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=str(args.database.parent)) as temp_dir:
        temp_db = Path(temp_dir) / args.database.name
        connection = prepare_database(temp_db, args.schema, config, rules)
        insert_sql = (
            "INSERT INTO addresses (" + ", ".join(ADDRESS_COLUMNS) + ") VALUES (" +
            ", ".join("?" for _ in ADDRESS_COLUMNS) + ")"
        )
        for position, municipality_code in enumerate(municipality_codes, start=1):
            download = downloads[municipality_code]
            expected_name = next(item["name"] for item in config["municipalities"] if item["code"] == municipality_code)
            if normalize(download["name"]) != normalize(expected_name):
                raise RuntimeError(
                    f"RUIAN code {municipality_code} is {download['name']}, expected {expected_name}"
                )
            print(f"[{position}/{len(municipality_codes)}] {expected_name}", file=sys.stderr)
            archive = fetch(download["url"])
            source_date = source_date_from_url(download["url"])
            records = []
            for row in read_ruian_rows(archive):
                rule = matching_rule(row, rules_by_municipality)
                records.append(build_record(row, rule, source_date))
            connection.executemany(insert_sql, records)
            connection.commit()

        count = validate(connection, municipality_codes)
        connection.execute("INSERT INTO addresses_fts(addresses_fts) VALUES ('optimize')")
        connection.commit()
        export_csv(connection, args.csv)
        export_mariadb(connection, args.mariadb)
        connection.close()
        temp_db.replace(args.database)

    print(f"Created {args.database} with {count} addresses")
    print(f"Created {args.csv}")
    print(f"Created {args.mariadb}")


if __name__ == "__main__":
    main()
