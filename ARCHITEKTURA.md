# Pizza Bellizzi - navrh systemu

Tento dokument kresli doporucenou architekturu pro objednavkovy system Pizza Bellizzi:

- verejny web s kosikem
- PHP backend API
- MariaDB databaze
- admin panel
- rozhrani pro ridice
- zakaznicke ucty
- verejne sledovani stavu objednavky pres bezpecny odkaz
- finalni cislo objednavky podle prihlaseneho admina
- logy prihlaseni a audit akci
- databaze zakazniku pro naseptavac
- rozvozove zony a ceny rozvozu
- online platby pres Comgate
- e-mailove a interni notifikace

## Celkova architektura

```mermaid
flowchart LR
  customer[Zakaznik<br>mobil / desktop]
  publicWeb[Verejny web<br>HTML + CSS + JS]
  trackingPage[Stranka sledovani objednavky<br>/sledovat-objednavku]
  api[PHP backend API]
  db[(MariaDB)]
  comgate[Comgate<br>platebni brana]
  mailer[SMTP / e-mail sluzba]
  admin[Admin panel]
  driver[Ridic panel]
  owner[Majitel / owner]

  customer --> publicWeb
  customer --> trackingPage
  publicWeb --> api
  trackingPage --> api

  api --> db
  api --> comgate
  api --> mailer

  comgate -- callback / webhook --> api

  owner --> admin
  admin --> api
  driver --> driver
  driver --> api

  api -- nove objednavky / statusy --> admin
  api -- rozvozove objednavky --> driver
```

## Tok objednavky pri platbe hotove

```mermaid
sequenceDiagram
  participant Z as Zakaznik
  participant W as Web
  participant API as PHP API
  participant DB as MariaDB
  participant A as Admin panel
  participant M as E-mail

  Z->>W: Vybere pizzu a vyplni objednavku
  W->>API: POST /api/orders/create payment_method=cash
  API->>DB: Ulozi objednavku se stavem new + tracking token
  API->>M: Posle potvrzeni prijeti + odkaz na sledovani
  API->>A: Objednavka se zobrazi v adminu
  API-->>W: Vrati tracking URL + docasne interni id
  W-->>Z: Zobrazi potvrzeni + odkaz na sledovani
```

## Tok objednavky pri online platbe Comgate

Objednavka se v adminu zobrazi az po potvrzeni zaplaceni z Comgate callbacku.

```mermaid
sequenceDiagram
  participant Z as Zakaznik
  participant W as Web
  participant API as PHP API
  participant DB as MariaDB
  participant CG as Comgate
  participant A as Admin panel
  participant M as E-mail

  Z->>W: Vybere pizzu a zvoli online platbu
  W->>API: POST /api/orders/create payment_method=comgate
  API->>DB: Ulozi objednavku jako pending_payment + tracking token
  API->>CG: Vytvori platbu u Comgate
  CG-->>API: Vrati payment_id a URL platby
  API->>DB: Ulozi comgate_transaction_id
  API-->>W: Vrati URL platebni brany
  W-->>Z: Presmeruje zakaznika na Comgate

  Z->>CG: Zaplati kartou / bankou
  CG-->>API: Server callback se stavem platby
  API->>CG: Volitelne overi stav platby

  alt Platba potvrzena
    API->>DB: payment_status=paid, order_status=new
    API->>M: Posle potvrzeni platby + odkaz na sledovani
    API->>A: Objednavka se zobrazi v adminu
  else Platba zrusena nebo selhala
    API->>DB: payment_status=failed/cancelled, order_status=cancelled
  end

  CG-->>Z: Vrati zakaznika na dekovaci / chybovou stranku s odkazem na sledovani
```

## Pravidlo pro zobrazeni objednavky v adminu

```mermaid
flowchart TD
  orderCreated[Objednavka vytvorena]
  method{Zpusob platby?}
  cash[Hotove]
  online[Comgate online]
  showNow[Zobrazit v adminu hned]
  waitPayment[Cekat na platbu]
  callback{Comgate callback}
  paid[Platba potvrzena]
  failed[Platba selhala / zrusena]
  showPaid[Zobrazit v adminu]
  hideCancel[Nezobrazovat jako aktivni objednavku]

  orderCreated --> method
  method --> cash
  method --> online
  cash --> showNow
  online --> waitPayment
  waitPayment --> callback
  callback --> paid
  callback --> failed
  paid --> showPaid
  failed --> hideCancel
```

Prakticky filtr pro admin:

```sql
SELECT *
FROM orders
WHERE payment_method = 'cash'
   OR payment_status = 'paid';
```

## Sledovani objednavky pro zakaznika

Kazda objednavka dostane verejny tracking odkaz, ktery se:

- zobrazi na webu po dokonceni objednavky
- posle zakaznikovi v potvrzovacim e-mailu
- pouzije pro sledovani stavu bez prihlaseni

Odkaz nesmi obsahovat jednoduche ID objednavky. Ma obsahovat dlouhy nahodny token, napr.:

```txt
https://pizzabellizzi.cz/sledovat-objednavku/tk_8b4c9f7a...dlouhy-token
```

V databazi je lepsi ulozit jen hash tokenu, ne samotny token.

```mermaid
flowchart TD
  created[Objednavka vytvorena]
  token[Backend vygeneruje tracking token]
  hash[Do DB ulozi tracking_token_hash]
  url[Backend sestavi tracking URL]
  web[Web zobrazi odkaz po objednavce]
  email[E-mail obsahuje stejny odkaz]
  open[Zakaznik otevre odkaz]
  api[GET /api/orders/track/:token]
  timeline[Stranka ukaze stav objednavky]

  created --> token
  token --> hash
  token --> url
  url --> web
  url --> email
  web --> open
  email --> open
  open --> api
  api --> timeline
```

### Timeline pro zakaznika

```mermaid
flowchart LR
  accepted[Prijato]
  preparing[Priprava]
  route[Predano ridici]
  done[Doruceno]

  accepted --> preparing
  preparing --> route
  route --> done
```

Mapovani internich stavu na text pro zakaznika:

```txt
new       -> Cekame na prijeti objednavky
accepted  -> Prijato
preparing -> Priprava
route     -> Predano ridici
done      -> Doruceno
```

Pokud je objednavka online a platba jeste neni potvrzena, tracking stranka muze ukazat:

```txt
Cekame na potvrzeni platby
```

## E-mail s odkazem na sledovani

Potvrzovaci e-mail zakaznikovi ma obsahovat cislo objednavky, souhrn objednavky a tlacitko/odkaz:

```txt
Predmet: Pizza Bellizzi - prijali jsme vasi objednavku

Dekujeme za objednavku.
Finalni cislo objednavky uvidite po prijeti provozovnou.

Stav objednavky muzete sledovat zde:
https://pizzabellizzi.cz/sledovat-objednavku/tk_8b4c9f7a...dlouhy-token
```

Po kliknuti admina na `Prijmout objednavku` se zakaznikovi muze poslat aktualizace:

```txt
Predmet: Pizza Bellizzi - objednavka 260710FP142533 prijata

Objednavka byla prijata provozovnou.
Cislo objednavky: 260710FP142533

Stav objednavky muzete sledovat zde:
https://pizzabellizzi.cz/sledovat-objednavku/tk_8b4c9f7a...dlouhy-token
```

## Role a prihlaseni

Aplikace se do databaze nepripojuje jako databazovy `root`. Pouzije se samostatny databazovy uzivatel, napr. `pizza_app`.

Uzivatelska data se ukladaji do tabulky `users`. Hesla se nikdy neukladaji jako text, pouze jako hash.

```mermaid
flowchart TD
  login[Prihlaseni]
  users[(users<br>password_hash)]
  role{Role uzivatele}

  owner[owner<br>vsechna prava]
  admin[admin<br>objednavky, menu, zakaznici]
  driver[driver<br>rozvozove objednavky]
  customer[customer<br>vlastni ucet a historie]

  login --> users
  users --> role
  role --> owner
  role --> admin
  role --> driver
  role --> customer
```

## Cislo objednavky

Finalni cislo objednavky se vygeneruje ve chvili, kdy ji v adminu prijme konkretni prihlaseny uzivatel.

Format:

```txt
RRMMDD + INICIALY_ADMINA + HHMMSS
```

Priklad:

```txt
260710FP142533
```

Vysvetleni:

```txt
26      = rok 2026
07      = mesic cervenec
10      = den
FP      = inicialy prihlaseneho admina, ktery objednavku prijal
142533  = cas prijeti 14:25:33
```

Poznamka: objednavka z webu existuje uz pred prijetim adminem. Do te doby ma interni `id`, tracking token a stav `new`, ale finalni `public_number` se doplni az pri akci `admin prijal`.

```mermaid
sequenceDiagram
  participant A as Admin
  participant API as PHP API
  participant DB as MariaDB
  participant M as E-mail
  participant T as Tracking stranka

  A->>API: POST /api/admin/orders/accept
  API->>DB: Nacte prihlaseneho admina
  API->>API: Sestavi cislo RRMMDD + inicialy + HHMMSS
  API->>DB: Ulozi public_number, accepted_by_user_id, accepted_at
  API->>DB: Zapise audit log akce
  API->>M: Posle / aktualizuje e-mail se stavem Prijato
  API->>T: Tracking ukazuje Prijato a cislo objednavky
```

Pro jistotu ma byt na `orders.public_number` unikatni index. Pokud by dva admini se stejnymi inicialami prijali objednavku ve stejne sekunde, backend prida kratkou koncovku, napr. `-2`.

## Logy prihlaseni a audit

System ma ukladat:

- kdo se prihlasil
- kdy se prihlasil
- kdy se odhlasil
- jestli byl pokus uspesny nebo neuspesny
- IP adresu a user-agent
- zmeny stavu objednavky a kdo je udelal

```mermaid
flowchart TD
  loginAttempt[Pokus o prihlaseni]
  auth{Overeni hesla}
  success[Uspesne prihlaseni]
  failed[Neuspesne prihlaseni]
  session[Vytvoreni session]
  loginLog[(user_login_events)]
  audit[(audit_logs)]

  loginAttempt --> auth
  auth --> success
  auth --> failed
  success --> session
  success --> loginLog
  failed --> loginLog
  session --> audit
```

## Databaze zakazniku a naseptavac

Zakaznici se muzou vytvaret automaticky z objednavek. Hlavni identifikator je telefon, pripadne e-mail.

Kdyz prijde nova objednavka:

```mermaid
flowchart TD
  order[Prijata objednavka]
  phone{Existuje zakaznik<br>se stejnym telefonem?}
  update[Aktualizovat zakaznika<br>jmeno, e-mail, posledni objednavka]
  create[Vytvorit noveho zakaznika]
  address{Existuje stejna adresa?}
  updateAddress[Aktualizovat adresu<br>posledni pouziti]
  createAddress[Pridat novou adresu]
  autocomplete[Naseptavac v adminu]

  order --> phone
  phone -->|ano| update
  phone -->|ne| create
  update --> address
  create --> address
  address -->|ano| updateAddress
  address -->|ne| createAddress
  updateAddress --> autocomplete
  createAddress --> autocomplete
```

Naseptavac v adminu muze hledat podle:

- telefonu
- jmena
- e-mailu
- ulice
- mesta / casti obce

Vysledek naseptavace:

```txt
Jana Novakova
+420 777 123 456
Kraluv Dvur, Listice
12 objednavek, naposledy vcera
```

## Rozvozove zony

Zony jsou opsane z dodane fotky. Rucne dopsane a hur citelne obce jsou oznacene poznamkou `overit`.

```mermaid
flowchart TD
  address[Adresa zakaznika]
  normalize[Normalizace obce / casti obce]
  match{Nalezena zona?}
  fee[Cena rozvozu]
  addAddress[Doplnit chybejici adresu<br>do databaze]
  orderTotal[Prepocet celkove ceny]

  address --> normalize
  normalize --> match
  match -->|ano| fee
  match -->|ne| addAddress
  addAddress --> normalize
  fee --> orderTotal
```

| Cena rozvozu | Obce / casti obce |
| ---: | --- |
| 0 Kc | Beroun |
| 20 Kc (1x pizza) | Kraluv Dvur, Listice |
| 40 Kc | Trubin |
| 50 Kc | Hyskov, Tetin, Krizatky, Zdejcina, Trubska |
| 60 Kc | Koneprusy, Zelezna, Cernin, Hostim |
| 80 Kc | Nizbor, Lodenice, Hudlice, Zdice, Srbsko, Male Prilepy, Chynava |
| 100 Kc | Chrustenice, Otrocinoves, Tman, Stradonice, Bubovice, Svata, Skuhrov, Skripel, Zloukovice, Svaty Jan pod Skalou |
| 120 Kc | Novy Jachymov |

Rozhodujici je upresneny seznam provozovatele z 10. 7. 2026. Databazova pravidla jsou v `database/addresses/zones.json`.

## Databaze adres a automaticka zona

Cil: admin ani ridic nevybira zonu rucne u objednavky. Zakaznik nebo admin vybere adresu z naseptavace a system sam doplni:

- obec / cast obce
- ulici
- cislo popisne / orientacni
- PSC
- rozvozovou zonu
- cenu rozvozu

Oficialni zdroj adres pro CR je RUIAN od CUZK. Pro produkci jsou vhodne dve varianty:

- adresni mista RUIAN ve formatu CSV
- vymenny format RUIAN VFR

Pro tento projekt je nejpragmatictejsi importovat adresni mista z RUIAN a omezit je jen na obce / casti obci, kam Pizza Bellizzi rozvazi.

Zdroje:

- https://cuzk.gov.cz/ruian/RUIAN.aspx
- https://cuzk.gov.cz/ruian/Poskytovani-udaju-ISUI-RUIAN-VDP/Vymenny-format-RUIAN-%28VFR%29.aspx
- https://geoportal.cuzk.cz/Default.aspx?lng=EN&metadataID=CZ-00025712-CUZK_SERIES-MD_RUIAN-CSV-ADR-ST&metadataXSL=Full&mode=TextMeta&side=dsady_RUIAN_vse

```mermaid
flowchart TD
  ruian[RUIAN CSV / VFR<br>oficialni adresni data]
  import[Import skript]
  filter[Vybrat jen obce a casti obci<br>z rozvozovych zon]
  normalize[Normalizovat texty<br>bez diakritiky, lowercase]
  matchZone[Priradit delivery_zone_id<br>podle obce / casti obce]
  addresses[(addresses)]
  autocomplete[Naseptavac adresy]
  order[Objednavka]
  fee[Automaticka cena rozvozu]

  ruian --> import
  import --> filter
  filter --> normalize
  normalize --> matchZone
  matchZone --> addresses
  addresses --> autocomplete
  autocomplete --> order
  order --> fee
```

### Naseptavac adresy

Zakaznik i admin vyplnuji adresu pres naseptavac. Zapis objednavky ma idealne vzdy odkaz na `address_id`.

```mermaid
sequenceDiagram
  participant U as Uzivatel
  participant W as Web / admin
  participant API as PHP API
  participant DB as MariaDB

  U->>W: Zacne psat ulici / obec / cislo
  W->>API: GET /api/addresses/suggest?q=...
  API->>DB: Hleda v addresses
  DB-->>API: Vrati shody vcetne zony
  API-->>W: Adresy + cena rozvozu
  U->>W: Vybere adresu ze seznamu
  W->>API: POST /api/orders/create address_id=...
  API->>DB: Ulozi objednavku s delivery_zone_id
```

Priklad naseptavace:

```txt
Plzenska 86, Beroun-Mesto, 266 01 Beroun
Zona: Beroun / zakladni rozvoz

Listice 120, 266 01 Beroun
Zona: 20 Kc

Trubin 25, 267 01
Zona: 40 Kc
```

### Kdyz adresa v databazi chybi

Bez rucniho vyberu zony u objednavky. Admin pouze doplni adresu do databaze. Zona se dopocita podle obce / casti obce; pokud to nejde urcit, adresa se ulozi jako `needs_review`.

```mermaid
flowchart TD
  typed[Uzivatel zada adresu]
  found{Je v databazi?}
  select[Vybrat existujici adresu]
  notFound[Adresa nenalezena]
  add[Admin: Doplnit adresu do databaze]
  match{Lze urcit zonu<br>podle obce / casti?}
  autoZone[Ulozit adresu se zonou]
  review[Ulozit jako needs_review<br>vyzaduje kontrolu]
  future[Priste uz se adresa nabidne v naseptavaci]

  typed --> found
  found -->|ano| select
  found -->|ne| notFound
  notFound --> add
  add --> match
  match -->|ano| autoZone
  match -->|ne| review
  autoZone --> future
  review --> future
```

### Pravidlo prirazeni zony

Zony se neprirazuji ručně na objednavce. Prirazuji se automaticky podle tabulek:

```txt
addresses.delivery_zone_id
delivery_zone_places.normalized_place_name
delivery_zones.delivery_fee
```

Logika:

```txt
1. Zakaznik vybere adresu z addresses.
2. Objednavka prevezme address_id a delivery_zone_id.
3. Cena rozvozu se vezme z delivery_zones.delivery_fee.
4. Pokud adresa chybi, admin ji jednou doplni do addresses.
5. Dalsi objednavky uz pouziji ulozenou adresu automaticky.
```

## Navrh databaze

```mermaid
erDiagram
  USERS ||--o{ CUSTOMER_ADDRESSES : has
  USERS ||--o{ ORDERS : creates
  USERS ||--o{ USER_LOGIN_EVENTS : logs
  USERS ||--o{ AUDIT_LOGS : performs
  ORDERS ||--o{ ORDER_ITEMS : contains
  ORDERS ||--o{ ORDER_STATUS_HISTORY : tracks
  ORDERS ||--o| PAYMENTS : has
  ORDERS ||--o{ AUDIT_LOGS : audited
  DELIVERY_ZONES ||--o{ DELIVERY_ZONE_PLACES : contains
  DELIVERY_ZONES ||--o{ ADDRESSES : prices
  ADDRESSES ||--o{ ORDERS : used_by
  DELIVERY_ZONES ||--o{ ORDERS : priced_by
  USERS ||--o{ SESSIONS : has
  USERS ||--o{ NOTIFICATION_SUBSCRIPTIONS : has

  USERS {
    int id PK
    string email
    string phone
    string password_hash
    string role
    string status
    string initials
    datetime created_at
    datetime last_login_at
  }

  CUSTOMER_ADDRESSES {
    int id PK
    int user_id FK
    string street
    string city
    string zip
    string note
    bool is_default
    datetime last_used_at
    int orders_count
  }

  DELIVERY_ZONES {
    int id PK
    string name
    decimal delivery_fee
    int min_pizzas
    bool active
  }

  DELIVERY_ZONE_PLACES {
    int id PK
    int delivery_zone_id FK
    string place_name
    string normalized_place_name
    bool needs_review
  }

  ADDRESSES {
    int id PK
    int delivery_zone_id FK
    string ruian_address_id
    string street
    string house_number
    string orientation_number
    string city
    string city_part
    string zip
    string full_text
    string normalized_full_text
    decimal lat
    decimal lng
    bool source_ruian
    bool needs_review
    datetime created_at
    datetime updated_at
  }

  ORDERS {
    int id PK
    string public_number
    int customer_id FK
    int accepted_by_user_id FK
    int address_id FK
    int delivery_zone_id FK
    string customer_name
    string customer_phone
    string customer_email
    string delivery_street
    string delivery_city
    string delivery_zip
    string order_status
    string payment_method
    string payment_status
    string tracking_token_hash
    decimal total_amount
    string currency
    datetime paid_at
    datetime accepted_at
    datetime tracking_sent_at
    datetime created_at
  }

  ORDER_ITEMS {
    int id PK
    int order_id FK
    string item_type
    string name
    int quantity
    decimal unit_price
    decimal total_price
    string note
  }

  PAYMENTS {
    int id PK
    int order_id FK
    string provider
    string provider_transaction_id
    string status
    decimal amount
    string currency
    datetime created_at
    datetime paid_at
  }

  USER_LOGIN_EVENTS {
    int id PK
    int user_id FK
    string email_attempted
    string result
    string ip_address
    string user_agent
    datetime logged_in_at
    datetime logged_out_at
  }

  AUDIT_LOGS {
    int id PK
    int user_id FK
    int order_id FK
    string action
    string entity_type
    int entity_id
    text old_value_json
    text new_value_json
    string ip_address
    datetime created_at
  }

  ORDER_STATUS_HISTORY {
    int id PK
    int order_id FK
    int changed_by_user_id FK
    string old_status
    string new_status
    bool customer_visible
    datetime created_at
  }

  SESSIONS {
    int id PK
    int user_id FK
    string session_token_hash
    datetime expires_at
    datetime created_at
  }

  NOTIFICATION_SUBSCRIPTIONS {
    int id PK
    int user_id FK
    string channel
    text endpoint
    bool is_active
    datetime created_at
  }
```

## Stavy objednavky

```mermaid
stateDiagram-v2
  [*] --> pending_payment: online platba vytvorena
  [*] --> new: hotovostni objednavka

  pending_payment --> new: Comgate paid
  pending_payment --> cancelled: Comgate failed/cancelled

  new --> accepted: admin prijal / vygeneruje cislo objednavky / zakaznik vidi Prijato
  accepted --> preparing: zakaznik vidi Priprava
  preparing --> ready: hotovo
  ready --> route: zakaznik vidi Predano ridici
  route --> done: zakaznik vidi Doruceno

  new --> cancelled
  accepted --> cancelled
  preparing --> cancelled

  done --> [*]
  cancelled --> [*]
```

## API endpointy

```mermaid
flowchart LR
  web[Verejny web]
  admin[Admin panel]
  driver[Ridic panel]
  customer[Zakaznicky ucet]
  api[PHP API]

  web --> createOrder[POST /api/orders/create]
  web --> trackOrder[GET /api/orders/track/:token]
  web --> addressSuggest[GET /api/addresses/suggest]
  web --> zones[GET /api/delivery-zones/match]
  web --> createPayment[POST /api/payments/comgate/create]
  web --> customerLogin[POST /api/auth/login]

  admin --> adminOrders[GET /api/admin/orders]
  admin --> acceptOrder[POST /api/admin/orders/accept]
  admin --> updateOrder[POST /api/admin/orders/update-status]
  admin --> customerSuggest[GET /api/admin/customers/suggest]
  admin --> addressCreate[POST /api/admin/addresses/create]
  admin --> addressImport[POST /api/admin/addresses/import-ruian]
  admin --> loginLogs[GET /api/admin/logs/login]
  admin --> menuEdit[POST /api/admin/menu/update]

  driver --> driverOrders[GET /api/driver/orders]
  driver --> driverStatus[POST /api/driver/orders/update-status]

  customer --> myOrders[GET /api/customer/orders]
  customer --> addresses[GET/POST /api/customer/addresses]

  createOrder --> api
  trackOrder --> api
  addressSuggest --> api
  zones --> api
  createPayment --> api
  customerLogin --> api
  adminOrders --> api
  acceptOrder --> api
  updateOrder --> api
  customerSuggest --> api
  addressCreate --> api
  addressImport --> api
  loginLogs --> api
  menuEdit --> api
  driverOrders --> api
  driverStatus --> api
  myOrders --> api
  addresses --> api
```

## Notifikace

```mermaid
flowchart TD
  event[Udalost v systemu]
  type{Typ udalosti}

  newOrder[Nova zaplacena objednavka]
  statusChanged[Zmena stavu objednavky]
  paymentFailed[Neuspesna platba]

  adminSound[Zvuk / badge v adminu]
  driverPush[Notifikace ridici]
  customerEmail[E-mail zakaznikovi<br>vcetne odkazu na sledovani]
  ownerEmail[E-mail provozovne]
  trackingPage[Stranka sledovani<br>ukaze novy stav]

  event --> type
  type --> newOrder
  type --> statusChanged
  type --> paymentFailed

  newOrder --> adminSound
  newOrder --> ownerEmail
  newOrder --> customerEmail

  statusChanged --> driverPush
  statusChanged --> customerEmail
  statusChanged --> trackingPage

  paymentFailed --> customerEmail
```

## Doporuceny stack

```txt
Frontend:
  HTML + CSS + JavaScript

Backend:
  PHP 8.2/8.3

Databaze:
  MariaDB

Platby:
  Comgate API + server callback

E-maily:
  SMTP / MailerSend / Postmark / SendGrid

Prihlaseni:
  PHP sessions nebo vlastni session tabulka
  password_hash()
  password_verify()

Hosting:
  PHP hosting nebo male VPS
```
