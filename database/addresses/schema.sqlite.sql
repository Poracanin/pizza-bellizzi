PRAGMA foreign_keys = ON;

CREATE TABLE delivery_zones (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    fee_czk INTEGER NOT NULL CHECK (fee_czk >= 0),
    min_pizzas INTEGER NOT NULL DEFAULT 0 CHECK (min_pizzas >= 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE zone_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    priority INTEGER NOT NULL DEFAULT 100,
    zone_id INTEGER NOT NULL REFERENCES delivery_zones(id),
    municipality_code INTEGER NOT NULL,
    municipality_name TEXT NOT NULL,
    city_part TEXT,
    street TEXT,
    label TEXT NOT NULL,
    CHECK (city_part IS NULL OR street IS NULL)
);

CREATE INDEX zone_rules_match_idx
    ON zone_rules (municipality_code, priority DESC);

CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ruian_address_id INTEGER NOT NULL UNIQUE,
    municipality_code INTEGER NOT NULL,
    municipality_name TEXT NOT NULL,
    city_part_code INTEGER,
    city_part TEXT NOT NULL,
    street_code INTEGER,
    street TEXT,
    building_type TEXT NOT NULL,
    house_number TEXT NOT NULL,
    orientation_number TEXT,
    orientation_letter TEXT,
    postal_code TEXT NOT NULL,
    sjtsk_y REAL,
    sjtsk_x REAL,
    valid_from TEXT,
    display_address TEXT NOT NULL,
    search_text TEXT NOT NULL,
    zone_id INTEGER NOT NULL REFERENCES delivery_zones(id),
    zone_rule_id INTEGER NOT NULL REFERENCES zone_rules(id),
    source_updated_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX addresses_zone_idx ON addresses (zone_id);
CREATE INDEX addresses_municipality_idx
    ON addresses (municipality_code, city_part, street);
CREATE INDEX addresses_search_idx ON addresses (search_text);

CREATE VIRTUAL TABLE addresses_fts USING fts5(
    display_address,
    search_text,
    content='addresses',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER addresses_ai AFTER INSERT ON addresses BEGIN
    INSERT INTO addresses_fts(rowid, display_address, search_text)
    VALUES (new.id, new.display_address, new.search_text);
END;

CREATE TRIGGER addresses_ad AFTER DELETE ON addresses BEGIN
    INSERT INTO addresses_fts(addresses_fts, rowid, display_address, search_text)
    VALUES ('delete', old.id, old.display_address, old.search_text);
END;

CREATE TRIGGER addresses_au AFTER UPDATE ON addresses BEGIN
    INSERT INTO addresses_fts(addresses_fts, rowid, display_address, search_text)
    VALUES ('delete', old.id, old.display_address, old.search_text);
    INSERT INTO addresses_fts(rowid, display_address, search_text)
    VALUES (new.id, new.display_address, new.search_text);
END;

CREATE VIEW address_suggestions AS
SELECT
    a.id,
    a.ruian_address_id,
    a.display_address,
    a.search_text,
    a.municipality_name,
    a.city_part,
    a.street,
    a.house_number,
    a.orientation_number,
    a.postal_code,
    z.id AS zone_id,
    z.code AS zone_code,
    z.name AS zone_name,
    z.fee_czk,
    z.min_pizzas
FROM addresses a
JOIN delivery_zones z ON z.id = a.zone_id
WHERE z.active = 1;
