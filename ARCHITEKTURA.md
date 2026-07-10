# Pizza Bellizzi - navrh systemu

Tento dokument kresli doporucenou architekturu pro objednavkovy system Pizza Bellizzi:

- verejny web s kosikem
- PHP backend API
- MariaDB databaze
- admin panel
- rozhrani pro ridice
- zakaznicke ucty
- verejne sledovani stavu objednavky pres bezpecny odkaz
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
  API->>M: Posle potvrzeni + odkaz na sledovani
  API->>A: Objednavka se zobrazi v adminu
  API-->>W: Vrati cislo objednavky + tracking URL
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
    API->>M: Posle potvrzeni + odkaz na sledovani
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
Predmet: Pizza Bellizzi - objednavka PB-10245

Dekujeme za objednavku.
Cislo objednavky: PB-10245

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

## Navrh databaze

```mermaid
erDiagram
  USERS ||--o{ CUSTOMER_ADDRESSES : has
  USERS ||--o{ ORDERS : creates
  ORDERS ||--o{ ORDER_ITEMS : contains
  ORDERS ||--o{ ORDER_STATUS_HISTORY : tracks
  ORDERS ||--o| PAYMENTS : has
  USERS ||--o{ SESSIONS : has
  USERS ||--o{ NOTIFICATION_SUBSCRIPTIONS : has

  USERS {
    int id PK
    string email
    string phone
    string password_hash
    string role
    string status
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
  }

  ORDERS {
    int id PK
    string public_number
    int customer_id FK
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

  new --> accepted: admin prijal / zakaznik vidi Prijato
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
  web --> createPayment[POST /api/payments/comgate/create]
  web --> customerLogin[POST /api/auth/login]

  admin --> adminOrders[GET /api/admin/orders]
  admin --> updateOrder[POST /api/admin/orders/update-status]
  admin --> menuEdit[POST /api/admin/menu/update]

  driver --> driverOrders[GET /api/driver/orders]
  driver --> driverStatus[POST /api/driver/orders/update-status]

  customer --> myOrders[GET /api/customer/orders]
  customer --> addresses[GET/POST /api/customer/addresses]

  createOrder --> api
  trackOrder --> api
  createPayment --> api
  customerLogin --> api
  adminOrders --> api
  updateOrder --> api
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
