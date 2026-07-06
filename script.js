/* ============================================================
   Pizza Bellizzi - data
   ============================================================ */

const PIZZAS = [
  { id: 1,  name: "Margherita",        price: 206, base: "tomato", desc: "mozzarella, bazalka", img: "01-margherita.webp", tags: ["veg", "classic"], allergens: [1, 7] },
  { id: 2,  name: "Šunková",           price: 206, base: "tomato", desc: "mozzarella, šunka", img: "02-sunkova.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 3,  name: "Salámová",          price: 206, base: "tomato", desc: "mozzarella, salám", img: "03-salamova.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 4,  name: "Houbová",           price: 206, base: "tomato", desc: "mozzarella, žampiony", img: "04-houbova.webp", tags: ["veg"], allergens: [1, 7] },
  { id: 5,  name: "Vegetariana",       price: 206, base: "tomato", desc: "mozzarella, brokolice, kukuřice", img: "05-vegetariana.webp", tags: ["veg"], allergens: [1, 7] },
  { id: 6,  name: "Olivová",           price: 206, base: "tomato", desc: "mozzarella, olivy, niva", img: "06-olivova.webp", tags: ["veg"], allergens: [1, 7] },
  { id: 7,  name: "Slaninová",         price: 206, base: "tomato", desc: "mozzarella, slanina", img: "07-slaninova.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 8,  name: "Americana",         price: 218, base: "tomato", desc: "mozzarella, šunka, kukuřice", img: "08-americana.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 9,  name: "Hawai",             price: 218, base: "tomato", desc: "mozzarella, šunka, ananas", img: "09-hawai.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 10, name: "Capricciosa",       price: 218, base: "tomato", desc: "mozzarella, šunka, žampiony", img: "10-capricciosa.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 11, name: "Špenátová",         price: 218, base: "tomato", desc: "mozzarella, slanina, špenát, česnek", img: "11-spenatova.webp", tags: ["hit"], allergens: [1, 7] },
  { id: 12, name: "Kuřecí",            price: 218, base: "tomato", desc: "mozzarella, kuřecí maso, kukuřice, parmazán", img: "12-kureci.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 13, name: "Picante",           price: 218, base: "tomato", desc: "mozzarella, pikantní salám, kozí rohy, feferonky", img: "13-picante.webp", tags: ["spicy"], allergens: [1, 7] },
  { id: 14, name: "Vegetariana extra", price: 218, base: "tomato", desc: "mozzarella, kukuřice, brokolice, špenát, žampiony", img: "14-vegetariana-extra.webp", tags: ["veg"], allergens: [1, 7] },
  { id: 15, name: "Nivová",            price: 218, base: "cream",  desc: "mozzarella, niva", img: "15-nivova.webp", tags: ["veg", "cream"], allergens: [1, 7] },
  { id: 16, name: "Kari kuřecí",       price: 218, base: "cream",  desc: "mozzarella, kuřecí na kari, pórek, parmazán", img: "16-kari-kureci.webp", tags: ["cream", "hit"], allergens: [1, 7, 10] },
  { id: 17, name: "Selská",            price: 230, base: "tomato", desc: "mozzarella, slanina, klobása, zelí", img: "17-selska.webp", tags: ["classic"], allergens: [1, 7] },
  { id: 18, name: "Tuňáková",          price: 230, base: "tomato", desc: "mozzarella, tuňák, olivy, cibule", img: "18-tunakova.webp", tags: [], allergens: [1, 4, 7] },
  { id: 19, name: "Quattro formaggi",  price: 230, base: "cream",  desc: "mozzarella, hermelín, niva, parmazán", img: "19-quattro-formaggi.webp", tags: ["veg", "cream"], allergens: [1, 7] },
  { id: 20, name: "Bellizzi",          price: 230, base: "tomato", desc: "mozzarella, šunka, salám, slanina, kozí rohy", img: "20-bellizzi.webp", tags: ["hit"], allergens: [1, 7] }
];

const DRINKS = [
  { id: "d1", name: "Mirinda",   volume: "330 ml", price: 25, img: "01-mirinda-330ml.png" },
  { id: "d2", name: "PEPSI",     volume: "330 ml", price: 25, img: "02-pepsi-330ml.png" },
  { id: "d3", name: "PEPSI zero", volume: "330 ml", price: 25, img: "03-pepsi-zero-330ml.png" },
  { id: "d4", name: "7UP zero",  volume: "330 ml", price: 25, img: "04-7up-zero-330ml.png" },
  { id: "d5", name: "Capri-Sun", volume: "200 ml", price: 15, img: "05-capri-sun-200ml.png" },
  { id: "d6", name: "Džus Relax", volume: "200 ml", price: 30, img: "06-dzus-relax-200ml.png" }
];

// Suroviny navíc — všechny po 15 Kč (dle požadavku)
const EXTRAS = [
  { id: "x1",  name: "Mozzarella" },
  { id: "x2",  name: "Parmazán" },
  { id: "x3",  name: "Niva" },
  { id: "x4",  name: "Hermelín" },
  { id: "x5",  name: "Šunka" },
  { id: "x6",  name: "Salám" },
  { id: "x7",  name: "Slanina" },
  { id: "x8",  name: "Klobása" },
  { id: "x9",  name: "Kuřecí maso" },
  { id: "x10", name: "Tuňák" },
  { id: "x11", name: "Žampiony" },
  { id: "x12", name: "Olivy" },
  { id: "x13", name: "Kukuřice" },
  { id: "x14", name: "Ananas" },
  { id: "x15", name: "Feferonky" },
  { id: "x16", name: "Cibule" },
  { id: "x17", name: "Česnek" },
  { id: "x18", name: "Bazalka čerstvá" }
];

const EXTRA_PRICE = 15;     // každá surovina navíc
const BASE_CHANGE_PRICE = 20; // změna základu rajčatový <-> smetanový

// Oficiální seznam alergenů EU 1169/2011
const ALLERGENS = [
  "Obiloviny obsahující lepek (pšenice, žito, ječmen, oves, špalda, kamut)",
  "Korýši a výrobky z nich",
  "Vejce a výrobky z nich",
  "Ryby a výrobky z nich",
  "Podzemnice olejná (arašídy) a výrobky z ní",
  "Sójové boby a výrobky z nich",
  "Mléko a výrobky z něj (laktóza)",
  "Skořápkové plody (mandle, lískové ořechy, vlašské ořechy aj.)",
  "Celer a výrobky z něj",
  "Hořčice a výrobky z ní",
  "Sezamová semena a výrobky z nich",
  "Oxid siřičitý a siřičitany (E220–E228) v koncentraci > 10 mg/kg",
  "Vlčí bob (lupina) a výrobky z něj",
  "Měkkýši a výrobky z nich"
];

/* ============================================================
   Helpers
   ============================================================ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n) => `${Math.round(n)} Kč`;
const uid = () => Math.random().toString(36).slice(2, 9);
const findPizza = (id) => PIZZAS.find((p) => p.id === id);

/* Spolehlivý scroll lock i pro iOS Safari */
let savedScrollY = 0;
let lockCount = 0;
function lockScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY || document.documentElement.scrollTop;
    document.body.classList.add("no-scroll");
    document.body.style.top = `-${savedScrollY}px`;
  }
  lockCount++;
}
function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove("no-scroll");
    document.body.style.top = "";
    window.scrollTo(0, savedScrollY);
  }
}

/* Otevírací doba — Po-Čt 9:30-19:00, Pá 9:30-21:00, So 10:30-21:00, Ne zavřeno */
function getHoursForDay(day) {
  if (day === 0) return null;
  if (day === 5) return [9 * 60 + 30, 21 * 60];
  if (day === 6) return [10 * 60 + 30, 21 * 60];
  return [9 * 60 + 30, 19 * 60];
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function updateOpenStatus() {
  const els = $$(".pill-open");
  if (!els.length) return;
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const secs = now.getSeconds();
  const hours = getHoursForDay(day);

  let text, closed = false;
  if (!hours) {
    text = "Dnes zavřeno";
    closed = true;
  } else if (mins < hours[0]) {
    text = `Dnes otevřeno od ${fmtTime(hours[0])}`;
    closed = true;
  } else if (mins >= hours[1]) {
    text = "Dnes zavřeno";
    closed = true;
  } else {
    // Odpočet do zavírací doby
    const remainingSec = (hours[1] - mins) * 60 - secs;
    const h = Math.floor(remainingSec / 3600);
    const m = Math.floor((remainingSec % 3600) / 60);
    const s = remainingSec % 60;
    const cd = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    text = `Objednávky přijímáme ještě ${cd}`;
  }
  els.forEach((el) => {
    el.textContent = text;
    el.classList.toggle("closed", closed);
  });
}

function badgeLabel(tag) {
  if (tag === "veg") return "Veg";
  if (tag === "spicy") return "Pikantní";
  if (tag === "cream") return "Smetanová";
  if (tag === "hit") return "Tip";
  return null;
}

function basePrice(pizza) {
  // average of left/right halves if half/half, else just pizza.price
  return pizza.price;
}

function calcItemUnit(item) {
  // item: { leftId, rightId, base, extras: [ids], dealPrice? }
  const left = findPizza(item.leftId);
  const right = findPizza(item.rightId);
  const isHalfHalf = item.leftId !== item.rightId;
  const naturalBase = isHalfHalf
    ? (left.base === right.base ? left.base : "tomato")
    : left.base;
  const baseCharge = item.base !== naturalBase ? BASE_CHANGE_PRICE : 0;
  const extrasCharge = item.extras.length * EXTRA_PRICE;
  // Akční pizzy z polední nabídky mají pevnou cenu, jinak vychází z dražší poloviny
  const halfPrice = item.dealPrice != null
    ? item.dealPrice
    : Math.max(left.price, right.price);
  return halfPrice + baseCharge + extrasCharge;
}

function calcDrinkUnit(item) {
  return item.price;
}

function itemTotal(item) {
  const unit = item.kind === "pizza" ? calcItemUnit(item) : calcDrinkUnit(item);
  return unit * item.qty;
}

/* ============================================================
   Pizza grid + drinks
   ============================================================ */

const pizzaGrid = $("#pizzaGrid");
const drinkGrid = $("#drinkGrid");
const chips = $$(".chip");
const viewButtons = $$(".view-btn");
const navLinks = $$(".nav a");
const topButton = $(".to-top");

let currentFilter = "all";
// Dlaždice jako výchozí zobrazení (na mobilu 2 sloupce), seznam je volitelný přes přepínač
let currentView = "grid";

function renderPizzas(filter = currentFilter) {
  currentFilter = filter;
  const list = filter === "all"
    ? PIZZAS
    : filter === "cream"
      ? PIZZAS.filter((p) => p.base === "cream")
      : PIZZAS.filter((p) => p.tags.includes(filter));

  pizzaGrid.classList.toggle("view-list", currentView === "list");

  pizzaGrid.innerHTML = list.map((pizza) => {
    const badges = pizza.tags
      .map((tag) => badgeLabel(tag) ? `<span class="pizza-badge ${tag}">${badgeLabel(tag)}</span>` : "")
      .join("");
    const baseLabel = pizza.base === "cream" ? "Smetanový základ" : "Rajčatový základ";
    return `
      <article class="pizza-card">
        <div class="pizza-img">
          <div class="pizza-badges">${badges}</div>
          <img src="jidla-pizza-vylepsene-webp/${pizza.img}" alt="Pizza ${pizza.name}" loading="lazy" width="900" height="900">
        </div>
        <div class="pizza-body">
          <h3>${pizza.name}</h3>
          <p class="pizza-desc">${baseLabel}, ${pizza.desc}</p>
          <p class="pizza-allerg">Alergeny: ${pizza.allergens.join(", ")}</p>
          <div class="pizza-price-row">
            <span class="price">${pizza.price}<small> Kč</small></span>
          </div>
          <div class="pizza-actions">
            <button class="btn-edit" data-open-pizza="${pizza.id}" aria-label="Upravit pizzu ${pizza.name}">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 17.5V21h3.5L17 10.5 13.5 7 3 17.5zM20.7 7.3c.4-.4.4-1 0-1.4l-2.6-2.6c-.4-.4-1-.4-1.4 0L15 5l3.5 3.5 2.2-2.2z" fill="currentColor"/></svg>
              Upravit
            </button>
            <button class="btn-quick-add" data-quick-add="${pizza.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21.5 8H6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.6" fill="currentColor"/><circle cx="17" cy="20" r="1.6" fill="currentColor"/></svg>
              Do košíku
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderDrinks() {
  drinkGrid.innerHTML = DRINKS.map((drink) => `
    <article class="drink-card">
      <div class="drink-img">
        <img src="jidla-napoje/${drink.img}" alt="${drink.name} ${drink.volume}" loading="lazy" width="300" height="300">
      </div>
      <h3>${drink.name}</h3>
      <p>${drink.volume}</p>
      <div class="drink-foot">
        <span class="price">${drink.price}<small>Kč</small></span>
        <button class="drink-add" data-add-drink="${drink.id}" aria-label="Přidat ${drink.name} do košíku">+</button>
      </div>
    </article>
  `).join("");
}

function renderAllergens() {
  const list = $("#allergensList");
  if (!list) return;
  list.innerHTML = ALLERGENS.map((label, i) => `
    <li><span class="num">${i + 1}</span><span>${label}</span></li>
  `).join("");
}

/* ============================================================
   Pizza customizer modal
   ============================================================ */

const modal = $("#pizzaModal");
const modalHero = $(".modal-hero", modal);
const modalBody = $(".modal-body", modal);
const modalImgWrap = $("#modalImgWrap");
const modalImgLeft = $("#modalImgLeft");
const modalImgRight = $("#modalImgRight");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalAdd = $("#modalAdd");
const modalTotalEl = $("#modalTotal");
const modalTagBase = $("#modalTagBase");
const baseRow = $("#baseRow");
const halfLeft = $("#halfLeft");
const halfRight = $("#halfRight");
const extrasListEl = $("#extrasList");
const qtyVal = $("#qtyVal");
const qtyPlus = $("#qtyPlus");
const qtyMinus = $("#qtyMinus");
const modalClose = $("#modalClose");

let modalState = null;

function fillHalfSelect(select) {
  select.innerHTML = PIZZAS.map((p) => `<option value="${p.id}">${p.id}. ${p.name} (${p.price} Kč)</option>`).join("");
}

function fillExtras() {
  extrasListEl.innerHTML = EXTRAS.map((e) => `
    <button type="button" class="extra-opt" data-extra="${e.id}">
      <span class="check">✓</span>
      <span class="name">${e.name}</span>
      <span class="px">+${EXTRA_PRICE} Kč</span>
    </button>
  `).join("");
}

function openPizzaModal(pizzaId) {
  const pizza = findPizza(pizzaId);
  if (!pizza) return;

  modalState = {
    leftId: pizza.id,
    rightId: pizza.id,
    base: pizza.base,
    extras: [],
    qty: 1
  };

  halfLeft.value = String(pizza.id);
  halfRight.value = String(pizza.id);

  $$(".extra-opt", extrasListEl).forEach((el) => el.classList.remove("sel"));

  syncHeroHalves();
  syncBasePills();
  syncQty();
  updateModalTotal();

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  lockScroll();

  // Reset a změření výšky fotky pro efekt překrytí oknem při rolování
  modalBody.scrollTop = 0;
  modalHero.style.height = "";
  modalHero.style.setProperty("--collapse", "0");
  requestAnimationFrame(measureHero);
}

function closePizzaModal() {
  if (!modal.classList.contains("open")) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  unlockScroll();
  modalHero.style.height = "";
  modalHero.style.setProperty("--collapse", "0");
  modalState = null;
}

/* Vykreslení fotky podle vybraných půlek — když jsou půlky jiné, fotka se rozpůlí */
function syncHeroHalves() {
  if (!modalState) return;
  const left = findPizza(modalState.leftId);
  const right = findPizza(modalState.rightId);
  const split = modalState.leftId !== modalState.rightId;
  const baseLabel = modalState.base === "cream" ? "Smetanový základ" : "Rajčatový základ";

  modalImgLeft.src = `jidla-pizza-vylepsene-webp/${left.img}`;
  modalImgLeft.alt = `Pizza ${left.name}`;

  if (split) {
    modalImgRight.src = `jidla-pizza-vylepsene-webp/${right.img}`;
    modalImgRight.alt = `Pizza ${right.name}`;
    modalImgWrap.classList.add("is-split");
    modalTitle.textContent = `${left.name} & ${right.name}`;
    modalDesc.textContent = `${baseLabel} · vlevo ${left.name}, vpravo ${right.name}`;
  } else {
    modalImgWrap.classList.remove("is-split");
    modalImgRight.removeAttribute("src");
    modalTitle.textContent = left.name;
    modalDesc.textContent = `${baseLabel}, ${left.desc}`;
  }
}

/* Fotka zůstává v plné velikosti, okno přes ni jen vyjíždí (necháme viditelnou ~1/3) */
const HERO_MIN_RATIO = 1 / 3;
let heroFullH = 0;

function measureHero() {
  modalHero.style.height = "";
  heroFullH = modalHero.getBoundingClientRect().height;
  modalHero.style.setProperty("--hero-full-h", `${heroFullH}px`);
}

function applyHeroCollapse() {
  if (!modal.classList.contains("open")) return;
  if (!heroFullH) measureHero();
  if (!heroFullH) return;
  const minH = heroFullH * HERO_MIN_RATIO;
  const maxShrink = heroFullH - minH;
  const s = Math.min(Math.max(modalBody.scrollTop, 0), maxShrink);
  modalHero.style.height = s <= 0 ? "" : `${heroFullH - s}px`;
  const fade = Math.min(1, s / (maxShrink * 0.6 || 1));
  modalHero.style.setProperty("--collapse", fade.toFixed(3));
}

modalBody.addEventListener("scroll", applyHeroCollapse, { passive: true });
window.addEventListener("resize", () => {
  if (!modal.classList.contains("open")) return;
  measureHero();
  applyHeroCollapse();
});

function syncBasePills() {
  $$(".base-pill", baseRow).forEach((el) => {
    el.classList.toggle("sel", el.dataset.base === modalState.base);
  });
  if (modalTagBase) {
    modalTagBase.textContent = modalState.base === "cream" ? "Smetanový základ" : "Rajčatový základ";
  }
}

function syncQty() { qtyVal.textContent = modalState.qty; }

function updateModalTotal() {
  if (!modalState) return;
  const tmp = { kind: "pizza", ...modalState };
  modalTotalEl.textContent = fmt(calcItemUnit(tmp) * modalState.qty);
}

baseRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".base-pill");
  if (!btn || !modalState) return;
  modalState.base = btn.dataset.base;
  syncBasePills();
  syncHeroHalves();
  updateModalTotal();
});

halfLeft.addEventListener("change", () => {
  if (!modalState) return;
  modalState.leftId = Number(halfLeft.value);
  syncHeroHalves();
  updateModalTotal();
});
halfRight.addEventListener("change", () => {
  if (!modalState) return;
  modalState.rightId = Number(halfRight.value);
  syncHeroHalves();
  updateModalTotal();
});

extrasListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".extra-opt");
  if (!btn || !modalState) return;
  const id = btn.dataset.extra;
  btn.classList.toggle("sel");
  if (modalState.extras.includes(id)) {
    modalState.extras = modalState.extras.filter((x) => x !== id);
  } else {
    modalState.extras.push(id);
  }
  updateModalTotal();
});

qtyPlus.addEventListener("click", () => { modalState.qty++; syncQty(); updateModalTotal(); });
qtyMinus.addEventListener("click", () => {
  if (modalState.qty > 1) { modalState.qty--; syncQty(); updateModalTotal(); }
});

modalClose.addEventListener("click", closePizzaModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closePizzaModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closePizzaModal(); });

modalAdd.addEventListener("click", () => {
  if (!modalState) return;
  addToCart({
    id: uid(),
    kind: "pizza",
    leftId: modalState.leftId,
    rightId: modalState.rightId,
    base: modalState.base,
    extras: [...modalState.extras],
    qty: modalState.qty
  });
  openCart();
  closePizzaModal();
});

/* ============================================================
   Polední akce – modální okno (3 pizzy za 179 Kč)
   ============================================================ */

const lunchModal = $("#lunchModal");
if (lunchModal) {
  const lunchClose = $("#lunchModalClose");

  const openLunchModal = () => {
    lunchModal.classList.add("open");
    lunchModal.setAttribute("aria-hidden", "false");
    lockScroll();
  };
  const closeLunchModal = () => {
    if (!lunchModal.classList.contains("open")) return;
    lunchModal.classList.remove("open");
    lunchModal.setAttribute("aria-hidden", "true");
    unlockScroll();
  };

  // Otevření z karet akce (klik i klávesnice) – volitelné, pokud existují
  $$("[data-lunch-open]").forEach((card) => {
    card.addEventListener("click", openLunchModal);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLunchModal(); }
    });
  });

  lunchClose.addEventListener("click", closeLunchModal);
  lunchModal.addEventListener("click", (e) => { if (e.target === lunchModal) closeLunchModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lunchModal.classList.contains("open")) closeLunchModal();
  });

  // Automatické zobrazení akce ihned po načtení stránky
  openLunchModal();
}

/* ============================================================
   Cart
   ============================================================ */

const cart = [];
const cartBtn = $("#cartBtn");
const cartDrawer = $("#cartDrawer");
const cartBackdrop = $("#cartBackdrop");
const cartCloseBtn = $("#cartClose");
const cartBody = $("#cartBody");
const cartFoot = $("#cartFoot");
const cartCountEl = $("#cartCount");
const subtotalEl = $("#subtotal");
const grandTotalEl = $("#grandTotal");
const checkoutTotalEl = $("#checkoutTotal");
const checkoutBtn = $("#checkoutBtn");

function openCart() {
  if (cartDrawer.classList.contains("open")) return;
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("open");
  lockScroll();
}
function closeCart() {
  if (!cartDrawer.classList.contains("open")) return;
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("open");
  unlockScroll();
}

cartBtn.addEventListener("click", openCart);
cartCloseBtn.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

function addToCart(item) {
  cart.push(item);
  renderCart();
}
function removeFromCart(id) {
  const idx = cart.findIndex((i) => i.id === id);
  if (idx > -1) cart.splice(idx, 1);
  renderCart();
}
function updateQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart();
}

function describeItem(item) {
  if (item.kind === "drink") return item.volume;
  const left = findPizza(item.leftId);
  const right = findPizza(item.rightId);
  const isHalfHalf = item.leftId !== item.rightId;
  const baseLabel = item.base === "cream" ? "Smetanový základ" : "Rajčatový základ";
  const halves = isHalfHalf ? `1/2 ${left.name} + 1/2 ${right.name}` : left.name;
  const extras = item.extras.length
    ? " · " + item.extras.map((id) => EXTRAS.find((e) => e.id === id)?.name).filter(Boolean).join(", ")
    : "";
  return `${halves} · ${baseLabel}${extras}`;
}

function itemTitle(item) {
  if (item.kind === "drink") return item.name;
  const left = findPizza(item.leftId);
  const right = findPizza(item.rightId);
  return item.leftId === item.rightId ? left.name : `Pizza 1/2 ${left.name} & ${right.name}`;
}

function itemImg(item) {
  if (item.kind === "drink") return `jidla-napoje/${item.img}`;
  const left = findPizza(item.leftId);
  return `jidla-pizza-vylepsene-webp/${left.img}`;
}

function renderCart() {
  cartCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Váš košík je prázdný.</p>
        <a class="btn-primary" href="#pizzy" id="cartEmptyCta">Vybrat pizzu</a>
      </div>`;
    $("#cartEmptyCta")?.addEventListener("click", closeCart);
    cartFoot.hidden = true;
    return;
  }

  cartBody.innerHTML = cart.map((item) => {
    const unit = item.kind === "pizza" ? calcItemUnit(item) : calcDrinkUnit(item);
    return `
      <div class="cart-item">
        <img src="${itemImg(item)}" alt="">
        <div class="cart-item-info">
          <strong>${itemTitle(item)}${item.dealLabel ? ` <span class="cart-item-deal">${item.dealLabel}</span>` : ""}</strong>
          <span class="meta">${describeItem(item)}</span>
          <span class="meta">${fmt(unit)} / ks</span>
        </div>
        <div class="cart-item-side">
          <span class="price-row">${fmt(unit * item.qty)}</span>
          <div class="cart-qty">
            <button data-qty="-1" data-id="${item.id}">−</button>
            <span class="v">${item.qty}</span>
            <button data-qty="1" data-id="${item.id}">+</button>
          </div>
          <button class="cart-remove" data-remove="${item.id}">Odebrat</button>
        </div>
      </div>`;
  }).join("");

  const subtotal = cart.reduce((s, i) => s + itemTotal(i), 0);
  subtotalEl.textContent = fmt(subtotal);
  grandTotalEl.textContent = fmt(subtotal);
  checkoutTotalEl.textContent = fmt(subtotal);
  cartFoot.hidden = false;
}

cartBody.addEventListener("click", (e) => {
  const qBtn = e.target.closest("[data-qty]");
  if (qBtn) updateQty(qBtn.dataset.id, Number(qBtn.dataset.qty));
  const rBtn = e.target.closest("[data-remove]");
  if (rBtn) removeFromCart(rBtn.dataset.remove);
});

/* ============================================================
   Checkout (multi-step simulace)
   ============================================================ */

const checkoutModal = $("#checkoutModal");
const checkoutClose = $("#checkoutClose");
const checkoutForm = $("#checkoutForm");
const checkoutNext = $("#checkoutNext");
const checkoutBack = $("#checkoutBack");
const stepEls = $$(".checkout-steps .step");
const stepPanels = $$(".step-panel");
const cardForm = $("#cardForm");
const checkoutTotalLg = $("#checkoutTotalLg");
const thanksMsg = $("#thanksMsg");
const thanksSummary = $("#thanksSummary");

let currentStep = 1;
const TOTAL_STEPS = 3;

function openCheckout() {
  if (cart.length === 0) return;
  currentStep = 1;
  showStep();
  checkoutTotalLg.textContent = fmt(cart.reduce((s, i) => s + itemTotal(i), 0));
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  lockScroll();
}

function closeCheckout() {
  if (!checkoutModal.classList.contains("open")) return;
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  unlockScroll();
}

function showStep() {
  stepEls.forEach((el) => {
    const step = Number(el.dataset.step);
    el.classList.toggle("active", step === currentStep);
    el.classList.toggle("done", step < currentStep);
  });
  stepPanels.forEach((p) => {
    p.classList.toggle("active", Number(p.dataset.step) === currentStep);
  });
  checkoutBack.hidden = currentStep === 1 || currentStep === 3;
  if (currentStep === 1) checkoutNext.textContent = "Pokračovat k platbě";
  else if (currentStep === 2) checkoutNext.textContent = "Zaplatit a dokončit";
  else checkoutNext.textContent = "Zavřít";
}

function validateStep1() {
  const required = ["name", "phone", "email", "street", "city", "zip"];
  let valid = true;
  required.forEach((n) => {
    const input = checkoutForm.elements[n];
    if (!input.value.trim()) {
      input.classList.add("invalid");
      valid = false;
    } else {
      input.classList.remove("invalid");
    }
  });
  return valid;
}

function validateStep2() {
  const pay = checkoutForm.elements["pay"].value;
  if (pay !== "card-online") return true;
  const fields = ["cardNumber", "cardExp", "cardCvc", "cardName"];
  let valid = true;
  fields.forEach((n) => {
    const input = checkoutForm.elements[n];
    if (!input.value.trim()) {
      input.classList.add("invalid");
      valid = false;
    } else {
      input.classList.remove("invalid");
    }
  });
  return valid;
}

function buildThanks() {
  const data = new FormData(checkoutForm);
  const pay = data.get("pay");
  const payLabel = pay === "cash" ? "Hotově při převzetí"
    : pay === "card-on" ? "Kartou při převzetí"
    : "Online kartou (DEMO)";
  const total = cart.reduce((s, i) => s + itemTotal(i), 0);
  const orderNo = "PB-" + Math.floor(100000 + Math.random() * 900000);
  thanksMsg.textContent = `Brzy vás zkontaktujeme na čísle ${data.get("phone") || ""} a potvrdíme čas doručení.`;
  thanksSummary.innerHTML = `
    <div><strong>Číslo objednávky:</strong> ${orderNo}</div>
    <div><strong>Doručit na:</strong> ${data.get("street")}, ${data.get("zip")} ${data.get("city")}</div>
    <div><strong>Platba:</strong> ${payLabel}</div>
    <div><strong>Celkem:</strong> ${fmt(total)}</div>
  `;
}

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) return;
  openCheckout();
  closeCart();
});

checkoutClose.addEventListener("click", closeCheckout);
checkoutModal.addEventListener("click", (e) => { if (e.target === checkoutModal) closeCheckout(); });

checkoutBack.addEventListener("click", () => {
  if (currentStep > 1) { currentStep--; showStep(); }
});

checkoutNext.addEventListener("click", () => {
  if (currentStep === 1) {
    if (!validateStep1()) return;
    currentStep = 2;
    showStep();
    return;
  }
  if (currentStep === 2) {
    if (!validateStep2()) return;
    buildThanks();
    currentStep = 3;
    showStep();
    // Vyprázdnit košík po úspěšné objednávce
    cart.length = 0;
    renderCart();
    return;
  }
  // step 3 - zavřít
  closeCheckout();
});

checkoutForm.addEventListener("change", (e) => {
  if (e.target.name === "pay") {
    cardForm.hidden = e.target.value !== "card-online";
  }
});

// Pomocné formátování karty
checkoutForm.addEventListener("input", (e) => {
  const t = e.target;
  if (t.name === "cardNumber") {
    t.value = t.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  if (t.name === "cardExp") {
    t.value = t.value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
  }
  if (t.name === "cardCvc") {
    t.value = t.value.replace(/\D/g, "").slice(0, 4);
  }
  if (t.classList.contains("invalid") && t.value.trim()) {
    t.classList.remove("invalid");
  }
});

/* ============================================================
   Card actions + drink add
   ============================================================ */

pizzaGrid.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-open-pizza]");
  if (editBtn) {
    openPizzaModal(Number(editBtn.dataset.openPizza));
    return;
  }
  const quickBtn = e.target.closest("[data-quick-add]");
  if (quickBtn) {
    const pizza = findPizza(Number(quickBtn.dataset.quickAdd));
    if (!pizza) return;
    addToCart({
      id: uid(),
      kind: "pizza",
      leftId: pizza.id,
      rightId: pizza.id,
      base: pizza.base,
      extras: [],
      qty: 1
    });
    openCart();
  }
});

drinkGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-drink]");
  if (!btn) return;
  const drink = DRINKS.find((d) => d.id === btn.dataset.addDrink);
  if (!drink) return;
  addToCart({
    id: uid(),
    kind: "drink",
    drinkId: drink.id,
    name: `${drink.name} ${drink.volume}`,
    img: drink.img,
    volume: drink.volume,
    price: drink.price,
    qty: 1
  });
  openCart();
});

/* Karty polední akce – přidání pizzy za akční cenu (179 Kč) rovnou do košíku */
$$("[data-deal-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pizza = findPizza(Number(btn.dataset.dealAdd));
    if (!pizza) return;
    addToCart({
      id: uid(),
      kind: "pizza",
      leftId: pizza.id,
      rightId: pizza.id,
      base: pizza.base,
      extras: [],
      qty: 1,
      dealPrice: Number(btn.dataset.dealPrice),
      dealLabel: "Polední akce"
    });
    openCart();
  });
});

/* ============================================================
   Filters + nav highlight + back-to-top
   ============================================================ */

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    renderPizzas(chip.dataset.filter);
  });
});

viewButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    viewButtons.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    currentView = btn.dataset.view;
    renderPizzas();
  });
});

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function updateActiveNav() {
  const scrollY = window.scrollY + 160;
  const active = [...sections].reverse().find((section) => section.offsetTop <= scrollY);
  navLinks.forEach((link) => {
    link.classList.toggle("active", active && link.getAttribute("href") === `#${active.id}`);
  });
  topButton.classList.toggle("show", window.scrollY > 700);
}

/* Header: nahoře průhledný nad hero fotkou, po rolování se zabarví */
const siteHeader = $(".header");

function setHeaderHeight() {
  document.documentElement.style.setProperty("--header-h", `${siteHeader.offsetHeight}px`);
}

function updateHeaderState() {
  siteHeader.classList.toggle("at-top", window.scrollY < 10);
}

window.addEventListener("resize", setHeaderHeight);
window.addEventListener("scroll", updateHeaderState, { passive: true });

topButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", updateActiveNav, { passive: true });

/* ============================================================
   Init
   ============================================================ */

fillHalfSelect(halfLeft);
fillHalfSelect(halfRight);
fillExtras();

// Synchronizace přepínače zobrazení podle počátečního currentView
viewButtons.forEach((btn) => {
  const isActive = btn.dataset.view === currentView;
  btn.classList.toggle("active", isActive);
  btn.setAttribute("aria-selected", isActive ? "true" : "false");
});

renderPizzas();
renderDrinks();
renderAllergens();
renderCart();
setHeaderHeight();
updateHeaderState();
updateActiveNav();
updateOpenStatus();
setInterval(updateOpenStatus, 1000);
