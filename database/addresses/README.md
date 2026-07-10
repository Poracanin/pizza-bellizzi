# Databaze adres Pizza Bellizzi

Adresy jsou importovane z oficialnich dat RUIAN od CUZK a maji predem prirazenou
rozvozovou zonu i cenu. Admin u objednavky zonu nevybira.

## Hotove soubory

- `pizza_bellizzi_addresses.sqlite` - hotova databaze pro vyvoj a testovani
- `pizza_bellizzi_addresses.csv` - stejna data pro kontrolu v tabulce
- `pizza_bellizzi_addresses.mariadb.sql` - import do produkcni MariaDB
- `zones.json` - jedine misto, kde se spravuji obce, vyjimky a ceny

## Aktualizace z RUIAN

Import stahne posledni mesicni soubory jednotlivych obci a vsechny vystupy
vytvori znovu:

```bash
python3 database/addresses/import_ruian.py
```

Zdroj dat:

- https://atom.cuzk.gov.cz/
- https://services.cuzk.cz/atom-index/RUIAN-CSV-ADR-OB/5513

Data CUZK jsou poskytovana pod licenci CC BY 4.0.

Import navic kontroluje, ze kazda obec i kazda mistni vyjimka obsahuje adresy.
Pokud CUZK zmeni nazev nebo strukturu dat, aktualizace se zastavi a puvodni
databaze zustane zachovana.

## Priklad naseptavace v SQLite

Dotaz uzivatele se pred vyhledanim prevede na mala pismena bez diakritiky.

```sql
SELECT display_address, fee_czk, zone_name
FROM address_suggestions
WHERE search_text LIKE 'plzenska 86%'
LIMIT 10;
```

Pro vetsi provoz se pouzije FTS index `addresses_fts`, v MariaDB je pripraveny
`FULLTEXT` index. Objednavka ma ukladat `address_id`, `zone_id` a vypoctenou cenu
rozvozu. Cena se vzdy overi na serveru, neprebira se z prohlizece.

## Pridani nove adresy v administraci

Rucne pridana adresa musi projit stejnymi pravidly ze `zone_rules`. Pokud se
nenajde obec ani vyjimka, objednavku nelze odeslat do kuchyne, dokud adresu
neschvali admin. Tim se zamezi rozvozu s chybnou cenou.
