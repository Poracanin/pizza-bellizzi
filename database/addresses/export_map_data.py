#!/usr/bin/env python3
"""Export compact browser data and municipality boundaries for the admin map."""

import argparse
import json
import sqlite3
import time
import urllib.parse
import urllib.request
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent.parent
DEFAULT_DATABASE = BASE_DIR / "pizza_bellizzi_addresses.sqlite"
DEFAULT_CONFIG = BASE_DIR / "zones.json"
DEFAULT_OUTPUT_DIR = PROJECT_DIR / "admin" / "data"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "PizzaBellizziZoneMap/1.0 (contact: contact@pizzabelizzi.cz)"

ZONE_COLORS = {
    "beroun-free": "#2F855A",
    "zone-20": "#1593A1",
    "zone-40": "#3E6DA8",
    "zone-50": "#7656A8",
    "zone-60": "#C58A2D",
    "zone-80": "#D06A32",
    "zone-100": "#C34242",
    "zone-120": "#343434",
}


def load_json(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def fetch_json(url, params):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": USER_AGENT, "Accept-Language": "cs"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.load(response)


def find_boundary(municipality):
    data = fetch_json(
        NOMINATIM_URL,
        {
            "q": f"{municipality['name']}, okres Beroun, Středočeský kraj, Česko",
            "format": "geojson",
            "polygon_geojson": 1,
            "addressdetails": 1,
            "limit": 5,
        },
    )
    candidates = []
    for feature in data.get("features", []):
        properties = feature.get("properties", {})
        address = properties.get("address", {})
        geometry_type = feature.get("geometry", {}).get("type")
        if geometry_type not in ("Polygon", "MultiPolygon"):
            continue
        district = address.get("district", address.get("county", ""))
        if "Beroun" not in district:
            continue
        candidates.append(feature)
    if not candidates:
        raise RuntimeError(f"Boundary not found for {municipality['name']}")
    candidates.sort(
        key=lambda feature: (
            feature.get("properties", {}).get("category") != "boundary",
            feature.get("properties", {}).get("type") != "administrative",
        )
    )
    return candidates[0]


def export_boundaries(config, output_path, refresh):
    if output_path.exists() and not refresh:
        return
    zones = {zone["code"]: zone for zone in config["zones"]}
    features = []
    for index, municipality in enumerate(config["municipalities"], start=1):
        print(f"[{index}/{len(config['municipalities'])}] boundary: {municipality['name']}")
        feature = find_boundary(municipality)
        zone = zones[municipality["default_zone"]]
        feature["properties"] = {
            "municipality_code": municipality["code"],
            "name": municipality["name"],
            "zone_code": zone["code"],
            "fee_czk": zone["fee_czk"],
            "color": ZONE_COLORS[zone["code"]],
        }
        features.append(feature)
        if index < len(config["municipalities"]):
            time.sleep(1.05)
    payload = {
        "type": "FeatureCollection",
        "attribution": "Boundaries: OpenStreetMap contributors",
        "features": features,
    }
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def export_addresses(database_path, output_path):
    connection = sqlite3.connect(str(database_path))
    connection.row_factory = sqlite3.Row
    zones = []
    for row in connection.execute(
        "SELECT id, code, name, fee_czk, min_pizzas FROM delivery_zones ORDER BY fee_czk"
    ):
        places = [
            place[0]
            for place in connection.execute(
                "SELECT label FROM zone_rules WHERE zone_id = ? ORDER BY priority DESC, label",
                (row["id"],),
            )
        ]
        zones.append(
            {
                "id": row["id"],
                "code": row["code"],
                "name": row["name"],
                "fee": row["fee_czk"],
                "minPizzas": row["min_pizzas"],
                "color": ZONE_COLORS[row["code"]],
                "places": places,
            }
        )
    address_rows = []
    query = """
        SELECT a.id, a.display_address, a.search_text, z.fee_czk, z.code,
               a.sjtsk_y, a.sjtsk_x, r.label, r.priority, a.municipality_name
        FROM addresses a
        JOIN delivery_zones z ON z.id = a.zone_id
        JOIN zone_rules r ON r.id = a.zone_rule_id
        ORDER BY a.id
    """
    for row in connection.execute(query):
        address_rows.append(
            [
                row["id"],
                row["display_address"],
                row["search_text"],
                row["fee_czk"],
                row["code"],
                row["sjtsk_y"],
                row["sjtsk_x"],
                row["label"],
                row["priority"],
                row["municipality_name"],
            ]
        )
    source_date = connection.execute(
        "SELECT MAX(source_updated_date) FROM addresses"
    ).fetchone()[0]
    connection.close()
    payload = {
        "meta": {
            "count": len(address_rows),
            "source": "RUIAN CUZK",
            "sourceDate": source_date,
            "format": [
                "id",
                "displayAddress",
                "searchText",
                "feeCzk",
                "zoneCode",
                "sjtskY",
                "sjtskX",
                "ruleLabel",
                "rulePriority",
                "municipality",
            ],
        },
        "zones": zones,
        "addresses": address_rows,
    }
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--refresh-boundaries", action="store_true")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    config = load_json(args.config)
    address_output = args.output_dir / "address-search.json"
    boundary_output = args.output_dir / "delivery-zones.geojson"
    export_addresses(args.database, address_output)
    export_boundaries(config, boundary_output, args.refresh_boundaries)
    print(f"Created {address_output}")
    print(f"Created {boundary_output}")


if __name__ == "__main__":
    main()
