/* ==========================================================================
   Pizza Bellizzi – Rozvoz (kurýr)
   Samostatná logika: drží data, vykresluje DOM a řeší interakce.
   HTML je jen prázdná schránka (#app), vzhled žije v rozvoz.css.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- konfigurace provozovny (pro QR platbu) -------------------------- */
  var SHOP = {
    name: 'Pizza Bellizzi',
    // IBAN pro QR platbu (bez mezer se použije do QR řetězce)
    iban: 'CZ6508000000192000145399',
    ibanPretty: 'CZ65 0800 0000 1920 0014 5399',
  };

  /* ---- ikony (inline SVG) ---------------------------------------------- */
  var ICON = {
    pin:   '<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    phone: '<svg width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    chevron: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    user:  '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    map:   '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
    nav:   '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
    route: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h3"/></svg>',
    check: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    checkBig: '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    qr:    '<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>',
    clock: '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    note:  '<svg width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    close: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    copy:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  };

  /* ---- data ------------------------------------------------------------ */
  // Aktivní rozvozy (status 'route') + doručené (historie).
  var state = {
    qrId: null, // id objednávky, jejíž QR modal je otevřený
    tip: { mode: 'none', pct: 0, custom: 0 }, // spropitné pro otevřený QR modal
    mapOpen: {}, // id objednávky -> rozbalená mapa
    orders: [
      {
        id: 246, num: 246, status: 'route',
        name: 'Marie Dvořáková', phone: '+420 777 340 112',
        address: 'Košťálkova 8', city: 'Beroun', zone: 'Zóna 2',
        payment: 'cash', placedAt: '14:05', etaMin: 8,
        note: 'Nechat u sousedů, byt č. 4.',
        items: [
          { qty: 1, name: 'Quattro formaggi', desc: 'smetanový základ · hermelín, niva, parmazán', price: 230, kind: 'pizza', special: false },
          { qty: 2, name: 'Bellizzi', desc: 'šunka, salám, slanina · navíc: Feferonky', price: 245, kind: 'pizza', special: true },
          { qty: 1, name: 'Capri-Sun 200ml', desc: 'ovocný nápoj', price: 15, kind: 'drink', special: false },
        ],
      },
      {
        id: 249, num: 249, status: 'route',
        name: 'Petr Svoboda', phone: '+420 720 118 244',
        address: 'Tyršova 445', city: 'Beroun', zone: 'Zóna 1',
        payment: 'cash', placedAt: '14:19', etaMin: 16,
        note: '',
        items: [
          { qty: 1, name: '½ Margherita + ½ Bellizzi', desc: 'rajčatový základ · navíc: Niva, Slanina', price: 245, kind: 'pizza', special: true },
          { qty: 3, name: 'Salámová', desc: 'mozzarella, salám', price: 206, kind: 'pizza', special: false },
        ],
      },
      {
        id: 251, num: 251, status: 'route',
        name: 'Klára Veselá', phone: '+420 775 140 901',
        address: 'Wagnerovo náměstí 12', city: 'Beroun', zone: 'Zóna 1',
        payment: 'online', placedAt: '14:22', etaMin: 24,
        note: 'Zvonek nefunguje, prosím zavolat.',
        items: [
          { qty: 1, name: 'Selská', desc: 'slanina, klobása, zelí', price: 230, kind: 'pizza', special: false },
          { qty: 1, name: 'Vegetariana extra', desc: 'kukuřice, brokolice, špenát, žampiony', price: 218, kind: 'pizza', special: false },
          { qty: 1, name: 'Pepsi 330ml', desc: 'sycený nápoj', price: 25, kind: 'drink', special: false },
        ],
      },
      {
        id: 252, num: 252, status: 'route',
        name: 'Jan Horák', phone: '+420 608 552 019',
        address: 'Havlíčkova 22', city: 'Beroun', zone: 'Zóna 2',
        payment: 'cash', placedAt: '14:28', etaMin: 31,
        note: '3. patro, výtah mimo provoz.',
        items: [
          { qty: 2, name: 'Diavola', desc: 'pikantní salám, feferonky, cibule', price: 235, kind: 'pizza', special: false },
          { qty: 1, name: 'Kofola 500ml', desc: 'sycený nápoj', price: 35, kind: 'drink', special: false },
        ],
      },
      {
        id: 254, num: 254, status: 'route',
        name: 'Lucie Nováková', phone: '+420 732 447 806',
        address: 'Plzeňská 120', city: 'Beroun', zone: 'Zóna 3',
        payment: 'online', placedAt: '14:35', etaMin: 42,
        note: '',
        items: [
          { qty: 1, name: 'Margherita', desc: 'rajčatový základ, mozzarella, bazalka', price: 195, kind: 'pizza', special: false },
          { qty: 1, name: 'Prosciutto e funghi', desc: 'šunka, žampiony', price: 225, kind: 'pizza', special: false },
          { qty: 2, name: 'Mattoni 330ml', desc: 'jemně perlivá voda', price: 25, kind: 'drink', special: false },
        ],
      },
    ],
    history: [
      { id: 244, num: 244, name: 'Tomáš Marek', address: 'Plzeňská 120', city: 'Beroun', payment: 'cash', total: 436, deliveredAt: '14:02' },
      { id: 243, num: 243, name: 'Eva Králová', address: 'Havlíčkova 22', city: 'Beroun', payment: 'online', total: 206, deliveredAt: '13:48' },
    ],
  };

  /* ---- helpery --------------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function total(o) { return o.items.reduce(function (a, i) { return a + i.qty * i.price; }, 0); }
  function kc(n) { return n.toLocaleString('cs-CZ') + ' Kč'; }
  function nowTime() { return new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }); }
  function orderById(id) { return state.orders.find(function (o) { return o.id === id; }) || null; }

  // Pizzy/jídlo nahoru, nápoje dolů; v rámci skupiny podle názvu.
  function sortedItems(items) {
    var order = { pizza: 0, food: 1, drink: 2 };
    return items.slice().sort(function (a, b) {
      var ka = order[a.kind] != null ? order[a.kind] : 1;
      var kb = order[b.kind] != null ? order[b.kind] : 1;
      if (ka !== kb) return ka - kb;
      return a.name.localeCompare(b.name, 'cs');
    });
  }

  // QR platba – řetězec ve formátu SPD (Short Payment Descriptor).
  function spdString(o, amount) {
    var am = (amount != null ? amount : total(o)).toFixed(2);
    var msg = ('PIZZA BELLIZZI OBJ ' + o.num).toUpperCase();
    return 'SPD*1.0*ACC:' + SHOP.iban + '*AM:' + am + '*CC:CZK*X-VS:' + o.num + '*MSG:' + msg;
  }

  /* ---- spropitné ------------------------------------------------------- */
  function roundUpTo(n, step) { return Math.ceil(n / step) * step; }
  function tipAmount(base) {
    var t = state.tip;
    if (t.mode === 'pct') return Math.round(base * t.pct / 100);
    if (t.mode === 'round50') return roundUpTo(base, 50) - base;
    if (t.mode === 'round100') return roundUpTo(base, 100) - base;
    if (t.mode === 'custom') return Math.max(0, Math.round(t.custom || 0));
    return 0;
  }

  function mapsUrl(o) {
    var dest = encodeURIComponent(o.address + ', ' + o.city);
    return 'https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=driving';
  }
  function mapEmbed(o) {
    var q = encodeURIComponent(o.address + ', ' + o.city);
    return 'https://www.google.com/maps?q=' + q + '&z=16&output=embed';
  }
  function routeUrl(stops) {
    if (!stops.length) return 'https://www.google.com/maps';
    var pts = stops.map(function (o) { return encodeURIComponent(o.address + ', ' + o.city); });
    var dest = pts[pts.length - 1];
    var mids = pts.slice(0, -1).join('|');
    var url = 'https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=driving';
    if (mids) url += '&waypoints=' + mids;
    return url;
  }

  /* ---- QR renderer (knihovna s fallbackem na obrázkové API) ------------ */
  function renderQR(el, text, size) {
    if (!el) return;
    el.innerHTML = '';
    if (window.QRCode) {
      try {
        new window.QRCode(el, {
          text: text, width: size, height: size,
          colorDark: '#1d1d1f', colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
        return;
      } catch (e) { /* fallback níže */ }
    }
    var img = document.createElement('img');
    img.alt = 'QR platba';
    img.width = size; img.height = size;
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size +
      '&margin=0&qzone=1&data=' + encodeURIComponent(text);
    el.appendChild(img);
  }

  /* ---- toast ----------------------------------------------------------- */
  var toastTimer = null;
  function toast(msg) {
    var old = document.querySelector('.rz-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'rz-toast';
    t.innerHTML = ICON.check + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2200);
  }

  /* ---- šablony (HTML řetězce) ------------------------------------------ */
  function tplItem(it) {
    var line = it.qty * it.price;
    return '' +
      '<li class="rz-item ' + (it.kind === 'drink' ? 'is-drink' : '') + (it.special ? ' is-special' : '') + '">' +
        '<span class="rz-qty">' + it.qty + '×</span>' +
        '<div class="rz-item-txt">' +
          '<span class="rz-item-name">' + esc(it.name) +
            (it.special ? '<span class="rz-item-tag">úprava</span>' : '') +
          '</span>' +
          '<span class="rz-item-desc">' + esc(it.desc) + '</span>' +
        '</div>' +
        '<span class="rz-item-price">' + kc(line) + '</span>' +
      '</li>';
  }

  function tplOrderCard(o, idx) {
    var late = o.etaMin <= 0;
    var paid = o.payment === 'online';
    var amount = total(o);
    var items = sortedItems(o.items).map(tplItem).join('');
    var count = o.items.reduce(function (a, i) { return a + i.qty; }, 0);
    var noteHtml = o.note ? '' +
      '<div class="rz-note">' + ICON.note +
        '<div><span class="rz-note-label">Poznámka zákazníka</span>' +
        '<span class="rz-note-text">' + esc(o.note) + '</span></div>' +
      '</div>' : '';

    var payChip = paid
      ? '<span class="rz-paychip pay-online">Zaplaceno online</span>'
      : '<span class="rz-paychip pay-cash">Hotově ' + amount.toLocaleString('cs-CZ') + ' Kč</span>';

    var payAction = paid
      ? '<div class="rz-paid-inline">' + ICON.check + ' Zaplaceno online</div>'
      : '<button class="rz-qr-btn" data-action="openQR" data-id="' + o.id + '">' +
          ICON.qr + '<span>QR platba · ' + amount.toLocaleString('cs-CZ') + ' Kč</span></button>';

    return '' +
      '<section class="rz-card' + (idx === 0 ? ' is-next' : '') + '" data-id="' + o.id + '">' +
        (idx === 0 ? '<div class="rz-next-flag">Další zastávka</div>' : '') +
        '<div class="rz-card-head">' +
          '<span class="rz-status">Na cestě</span>' +
          '<span class="rz-eta' + (late ? ' is-late' : '') + '">' + ICON.clock + ' ' +
            (late ? 'zpoždění' : 'do ' + o.etaMin + ' min') + '</span>' +
          '<span class="rz-num">#' + o.num + '</span>' +
        '</div>' +

        '<div class="rz-cust">' +
          '<button class="rz-addr-main" data-action="navigate" data-id="' + o.id + '">' +
            '<span class="rz-addr-icon">' + ICON.pin + '</span>' +
            '<span class="rz-addr-lines">' +
              '<span class="rz-addr-street">' + esc(o.address) +
                '<span class="rz-zone">' + esc(o.zone) + '</span></span>' +
              '<span class="rz-addr-city">' + esc(o.city) + '</span>' +
            '</span>' +
            '<span class="rz-addr-go">' + ICON.nav + '</span>' +
          '</button>' +
          '<div class="rz-name-sub">' + ICON.user + '<span>' + esc(o.name) + '</span></div>' +
        '</div>' +

        '<button class="rz-call" data-action="call" data-phone="' + esc(o.phone) + '">' +
          '<span class="rz-call-ic">' + ICON.phone + '</span>' +
          '<span class="rz-call-txt">' +
            '<span class="rz-call-label">Zavolat zákazníkovi</span>' +
            '<span class="rz-call-num">' + esc(o.phone) + '</span>' +
          '</span>' +
          '<span class="rz-call-arrow">' + ICON.chevron + '</span>' +
        '</button>' +

        '<button class="rz-map-toggle' + (state.mapOpen[o.id] ? ' is-open' : '') + '" data-action="toggleMap" data-id="' + o.id + '">' +
          ICON.map + '<span>' + (state.mapOpen[o.id] ? 'Skrýt mapu' : 'Zobrazit na mapě') + '</span>' +
          '<span class="rz-map-chev">' + ICON.chevron + '</span>' +
        '</button>' +
        (state.mapOpen[o.id]
          ? '<div class="rz-map"><iframe title="Mapa – ' + esc(o.address) + '" loading="lazy" ' +
            'referrerpolicy="no-referrer-when-downgrade" src="' + mapEmbed(o) + '"></iframe></div>'
          : '') +

        '<div class="rz-section-label">Objednávka <span>· ' + count + ' položek</span>' + payChip + '</div>' +
        '<ul class="rz-items">' + items + '</ul>' +
        '<div class="rz-total"><span>Celkem k předání</span><b>' + kc(amount) + '</b></div>' +

        noteHtml +

        '<div class="rz-card-actions">' +
          payAction +
          '<button class="rz-done-btn" data-action="delivered" data-id="' + o.id + '">' +
            ICON.check + ' Doručeno</button>' +
        '</div>' +
      '</section>';
  }

  function tplEmpty() {
    return '' +
      '<div class="rz-empty">' +
        '<div class="rz-empty-ic">' + ICON.checkBig + '</div>' +
        '<div class="rz-empty-title">Hotovo, žádné zastávky</div>' +
        '<div class="rz-empty-sub">Všechny objednávky jsou doručené. Nové rozvozy se objeví tady nahoře.</div>' +
      '</div>';
  }

  function tplHistory() {
    var h = state.history;
    var sum = h.reduce(function (a, o) { return a + o.total; }, 0);
    var rows = h.length ? h.map(function (o) {
      return '' +
        '<li class="rz-hist-row">' +
          '<span class="rz-hist-dot"></span>' +
          '<div class="rz-hist-main">' +
            '<div class="rz-hist-name">#' + o.num + ' · ' + esc(o.name) + '</div>' +
            '<div class="rz-hist-line">' + esc(o.address) + ', ' + esc(o.city) + '</div>' +
          '</div>' +
          '<span class="rz-hist-pay pay-' + o.payment + '">' + (o.payment === 'online' ? 'Online' : 'Hotově') + '</span>' +
          '<div class="rz-hist-right">' +
            '<div class="rz-hist-price">' + kc(o.total) + '</div>' +
            '<div class="rz-hist-time">' + esc(o.deliveredAt) + '</div>' +
          '</div>' +
        '</li>';
    }).join('') : '<li class="rz-hist-empty">Zatím žádné doručené objednávky.</li>';

    return '' +
      '<section class="rz-history">' +
        '<div class="rz-hist-head"><span>Historie · dnes</span>' +
          '<span class="rz-hist-sum">' + h.length + ' × · ' + kc(sum) + '</span></div>' +
        '<ul class="rz-hist-list">' + rows + '</ul>' +
      '</section>';
  }

  function tplTipChip(mode, val, label) {
    var t = state.tip;
    var on = (mode === t.mode) && (mode !== 'pct' || parseInt(val, 10) === t.pct);
    return '<button class="rz-tip-chip' + (on ? ' is-on' : '') + '" data-action="tip" data-mode="' + mode + '"' +
      (val != null ? ' data-val="' + val + '"' : '') + '>' + label + '</button>';
  }

  // Celoobrazovkový QR modal se spropitným.
  function tplQRModal(o) {
    var base = total(o);
    var tip = tipAmount(base);
    var pay = base + tip;
    var breakdown = tip > 0
      ? 'Základ ' + base.toLocaleString('cs-CZ') + ' Kč + spropitné ' + tip.toLocaleString('cs-CZ') + ' Kč'
      : 'Bez spropitného';
    var customOn = state.tip.mode === 'custom';
    var customVal = state.tip.custom ? state.tip.custom : '';

    return '' +
      '<div class="rz-modal-overlay" data-action="closeQR">' +
        '<div class="rz-modal" data-action="noop" role="dialog" aria-label="QR platba">' +
          '<button class="rz-modal-close" data-action="closeQR" aria-label="Zavřít">' + ICON.close + '</button>' +
          '<div class="rz-modal-eyebrow">' + ICON.qr + ' QR platba</div>' +
          '<div class="rz-modal-cust">#' + o.num + ' · ' + esc(o.name) + '</div>' +
          '<div class="rz-modal-amount" id="rz-amount">' + pay.toLocaleString('cs-CZ') + '<small>Kč</small></div>' +
          '<div class="rz-tip-breakdown" id="rz-breakdown">' + breakdown + '</div>' +

          '<div class="rz-tip">' +
            '<div class="rz-tip-label">Spropitné</div>' +
            '<div class="rz-tip-chips">' +
              tplTipChip('none', null, 'Bez') +
              tplTipChip('pct', 5, '5 %') +
              tplTipChip('pct', 10, '10 %') +
              tplTipChip('pct', 20, '20 %') +
            '</div>' +
            '<div class="rz-tip-chips">' +
              tplTipChip('round50', null, 'Zaokr. 50') +
              tplTipChip('round100', null, 'Zaokr. 100') +
              '<div class="rz-tip-custom' + (customOn ? ' is-on' : '') + '">' +
                '<span>Vlastní</span>' +
                '<input type="number" inputmode="numeric" min="0" step="1" placeholder="0" ' +
                  'data-action="tipCustomInput" value="' + customVal + '">' +
                '<span>Kč</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="rz-modal-qr" id="rz-qr-modal"></div>' +
          '<div class="rz-modal-meta">' +
            '<div class="rz-modal-meta-row"><span>Účet</span><b>' + esc(SHOP.ibanPretty) + '</b></div>' +
            '<div class="rz-modal-meta-row"><span>Variabilní symbol</span><b>' + o.num + '</b></div>' +
          '</div>' +
          '<button class="rz-modal-copy" data-action="copyIban">' + ICON.copy + ' Zkopírovat číslo účtu</button>' +
          '<div class="rz-modal-hint">Naskenujte kód v bankovní aplikaci zákazníka pro platbu převodem.</div>' +
        '</div>' +
      '</div>';
  }

  // Přepočet spropitného bez plného překreslení (zachová fokus v inputu).
  function refreshTip() {
    var o = orderById(state.qrId);
    if (!o) return;
    var base = total(o);
    var tip = tipAmount(base);
    var pay = base + tip;

    var amtEl = document.getElementById('rz-amount');
    if (amtEl) amtEl.innerHTML = pay.toLocaleString('cs-CZ') + '<small>Kč</small>';
    var brk = document.getElementById('rz-breakdown');
    if (brk) brk.textContent = tip > 0
      ? 'Základ ' + base.toLocaleString('cs-CZ') + ' Kč + spropitné ' + tip.toLocaleString('cs-CZ') + ' Kč'
      : 'Bez spropitného';

    var chips = document.querySelectorAll('.rz-tip-chip');
    chips.forEach(function (btn) {
      var m = btn.getAttribute('data-mode');
      var v = btn.getAttribute('data-val');
      var on = (m === state.tip.mode) && (m !== 'pct' || parseInt(v, 10) === state.tip.pct);
      btn.classList.toggle('is-on', on);
    });
    var cu = document.querySelector('.rz-tip-custom');
    if (cu) cu.classList.toggle('is-on', state.tip.mode === 'custom');

    var size = Math.min(320, Math.max(220, window.innerWidth - 96));
    renderQR(document.getElementById('rz-qr-modal'), spdString(o, pay), size);
  }

  /* ---- render ---------------------------------------------------------- */
  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    var remaining = state.orders.length;
    var canNav = remaining > 0;

    var listHtml = remaining
      ? state.orders.map(tplOrderCard).join('')
      : tplEmpty();

    var qrOrder = state.qrId != null ? orderById(state.qrId) : null;
    var modalHtml = qrOrder ? tplQRModal(qrOrder) : '';

    app.innerHTML = '' +
      '<div class="rz">' +
        '<header class="rz-top">' +
          '<div class="rz-brand">' +
            '<span class="rz-logo"><img src="assets/logo.png" alt="Pizza Bellizzi"></span>' +
            '<span class="rz-brand-txt">' +
              '<span class="rz-word"><span>Pizza</span><span>Bellizzi</span></span>' +
              '<span class="rz-sub">Rozvoz · kurýr</span>' +
            '</span>' +
          '</div>' +
          '<div class="rz-top-right">' +
            '<span class="rz-remaining"><b>' + remaining + '</b> ' +
              (remaining === 1 ? 'zastávka' : (remaining >= 2 && remaining <= 4 ? 'zastávky' : 'zastávek')) +
            '</span>' +
          '</div>' +
        '</header>' +
        '<div class="rz-tricolor"></div>' +

        '<main class="rz-main">' +
          '<div class="rz-list-head"><span>Objednávky k rozvozu</span>' +
            '<span class="rz-list-count">' + remaining + '</span></div>' +
          listHtml +
          tplHistory() +
        '</main>' +

        '<div class="rz-actions">' +
          '<button class="rz-btn rz-btn-nav" data-action="navigate"' + (canNav ? '' : ' disabled') + '>' +
            ICON.nav + ' Navigovat</button>' +
          '<button class="rz-btn rz-btn-route" data-action="route"' + (canNav ? '' : ' disabled') + '>' +
            ICON.route + ' Nejrychlejší trasa</button>' +
        '</div>' +

        modalHtml +
      '</div>';

    document.body.style.overflow = qrOrder ? 'hidden' : '';

    // QR se vykresluje až po vložení HTML (jen pokud je modal otevřený).
    if (qrOrder) {
      var pay = total(qrOrder) + tipAmount(total(qrOrder));
      var size = Math.min(320, Math.max(220, window.innerWidth - 96));
      renderQR(document.getElementById('rz-qr-modal'), spdString(qrOrder, pay), size);
    }
  }

  /* ---- interakce (event delegation) ------------------------------------ */
  function onClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');

    if (action === 'noop') return;

    if (action === 'openQR') {
      state.qrId = parseInt(el.getAttribute('data-id'), 10);
      state.tip = { mode: 'none', pct: 0, custom: 0 };
      render();
      return;
    }
    if (action === 'tip') {
      var mode = el.getAttribute('data-mode');
      if (mode === 'pct') {
        state.tip = { mode: 'pct', pct: parseInt(el.getAttribute('data-val'), 10), custom: state.tip.custom };
      } else if (mode === 'none') {
        state.tip = { mode: 'none', pct: 0, custom: state.tip.custom };
      } else {
        state.tip = { mode: mode, pct: 0, custom: state.tip.custom };
      }
      refreshTip();
      return;
    }
    if (action === 'closeQR') {
      state.qrId = null;
      render();
      return;
    }
    if (action === 'copyIban') {
      copyText(SHOP.iban, 'Číslo účtu zkopírováno');
      return;
    }
    if (action === 'navigate') {
      var navId = el.getAttribute('data-id');
      var o = navId ? orderById(parseInt(navId, 10)) : state.orders[0];
      if (o) window.open(mapsUrl(o), '_blank');
      return;
    }
    if (action === 'route') {
      window.open(routeUrl(state.orders), '_blank');
      return;
    }
    if (action === 'toggleMap') {
      var mid = parseInt(el.getAttribute('data-id'), 10);
      if (state.mapOpen[mid]) delete state.mapOpen[mid]; else state.mapOpen[mid] = true;
      render();
      return;
    }
    if (action === 'call') {
      var phone = el.getAttribute('data-phone');
      if (phone) window.location.href = 'tel:' + phone.replace(/\s+/g, '');
      return;
    }
    if (action === 'delivered') {
      markDelivered(parseInt(el.getAttribute('data-id'), 10));
      return;
    }
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { fallbackCopy(text, okMsg); });
    } else {
      fallbackCopy(text, okMsg);
    }
  }
  function fallbackCopy(text, okMsg) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      toast(okMsg);
    } catch (e) { /* tiché selhání */ }
  }

  function markDelivered(id) {
    var idx = state.orders.findIndex(function (o) { return o.id === id; });
    if (idx < 0) return;
    var o = state.orders[idx];
    state.orders.splice(idx, 1);
    state.history.unshift({
      id: o.id, num: o.num, name: o.name, address: o.address, city: o.city,
      payment: o.payment, total: total(o), deliveredAt: nowTime(),
    });
    if (state.qrId === id) state.qrId = null;
    render();
    toast('Objednávka #' + o.num + ' doručena');
  }

  /* ---- start ----------------------------------------------------------- */
  function onInput(e) {
    var el = e.target.closest && e.target.closest('[data-action="tipCustomInput"]');
    if (!el) return;
    var v = parseInt(el.value, 10);
    if (isNaN(v) || v < 0) v = 0;
    state.tip = { mode: 'custom', pct: 0, custom: v };
    refreshTip();
  }

  function init() {
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.qrId != null) { state.qrId = null; render(); }
    });
    render();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
