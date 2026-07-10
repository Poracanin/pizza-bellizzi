(function () {
  "use strict";

  const DATA_URL = "data/address-search.json";
  const BOUNDARIES_URL = "data/delivery-zones.geojson";
  const BEROUN_CENTER = [49.9638, 14.0720];
  const ROW = {
    id: 0,
    address: 1,
    search: 2,
    fee: 3,
    zone: 4,
    y: 5,
    x: 6,
    rule: 7,
    priority: 8,
    municipality: 9,
  };

  const state = {
    map: null,
    data: null,
    boundaries: null,
    municipalityLayer: null,
    overrideLayer: null,
    marker: null,
    mapEntries: [],
    activeFee: null,
    resultRows: [],
    activeResult: -1,
  };

  const elements = {};

  function cacheElements() {
    elements.search = document.getElementById("address-search");
    elements.clear = document.getElementById("clear-search");
    elements.results = document.getElementById("search-results");
    elements.legend = document.getElementById("zone-legend");
    elements.showAll = document.getElementById("show-all-zones");
    elements.selection = document.getElementById("selection-panel");
    elements.addressCount = document.getElementById("address-count");
    elements.sourceDate = document.getElementById("source-date");
    elements.error = document.getElementById("map-error");
    elements.toggleMunicipalities = document.getElementById("toggle-municipalities");
    elements.toggleOverrides = document.getElementById("toggle-overrides");
  }

  function normalize(value) {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function feeText(fee) {
    return fee === 0 ? "Zdarma" : `${fee} Kč`;
  }

  function softColor(hex, alpha) {
    const value = hex.replace("#", "");
    const number = parseInt(value, 16);
    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function zoneByCode(code) {
    return state.data.zones.find((zone) => zone.code === code);
  }

  function zoneByFee(fee) {
    return state.data.zones.find((zone) => zone.fee === fee);
  }

  function projectAddress(row) {
    const y = row[ROW.y];
    const x = row[ROW.x];
    if (!Number.isFinite(y) || !Number.isFinite(x)) return null;
    const result = window.proj4("EPSG:5514", "EPSG:4326", [-y, -x]);
    const point = [result[1], result[0]];
    if (point[0] < 48 || point[0] > 51.5 || point[1] < 11 || point[1] > 20) return null;
    return point;
  }

  function convexHull(latLngs) {
    const points = latLngs
      .map(([lat, lng]) => [lng, lat])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (points.length <= 2) return latLngs;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [];
    points.forEach((point) => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
      lower.push(point);
    });
    const upper = [];
    for (let index = points.length - 1; index >= 0; index -= 1) {
      const point = points[index];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
      upper.push(point);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper).map(([lng, lat]) => [lat, lng]);
  }

  function initProjection() {
    window.proj4.defs(
      "EPSG:5514",
      "+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813975277778 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs"
    );
  }

  function initMap() {
    // Chromium on macOS can drop GPU-composited Leaflet tiles. Force stable
    // left/top positioning so the base map and SVG polygons render as one layer.
    window.L.Browser.any3d = false;
    state.map = window.L.map("delivery-map", {
      center: BEROUN_CENTER,
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false,
      preferCanvas: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    window.L.control.zoom({ position: "bottomleft" }).addTo(state.map);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      updateWhenIdle: true,
      keepBuffer: 2,
      attribution: "&copy; OpenStreetMap",
    }).addTo(state.map);
    state.map.attributionControl.addAttribution(
      'Hranice &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    );

    addMunicipalityBoundaries();
    addOverrideAreas();
    const bounds = state.municipalityLayer.getBounds();
    if (bounds.isValid()) {
      state.map.fitBounds(bounds, { padding: [28, 28] });
    }
    state.map.on("zoomend moveend", scheduleLabelLayout);
    scheduleLabelLayout();
  }

  function scheduleLabelLayout() {
    window.requestAnimationFrame(() => window.requestAnimationFrame(declutterLabels));
  }

  function declutterLabels() {
    const labels = Array.from(document.querySelectorAll(".zone-map-marker"));
    labels.sort((a, b) => Number(b.classList.contains("zone-map-marker--local")) - Number(a.classList.contains("zone-map-marker--local")));
    const accepted = [];
    labels.forEach((label) => {
      label.style.opacity = "1";
      label.style.pointerEvents = "auto";
      const rect = label.getBoundingClientRect();
      const collision = accepted.some((other) =>
        rect.left < other.right + 3 && rect.right + 3 > other.left && rect.top < other.bottom + 3 && rect.bottom + 3 > other.top
      );
      if (collision) {
        label.style.opacity = "0";
        label.style.pointerEvents = "none";
      } else {
        accepted.push(rect);
      }
    });
  }

  function areaStyle(fee, color, local) {
    const visible = state.activeFee === null || state.activeFee === fee;
    return {
      color,
      weight: local ? 3.5 : 2.2,
      opacity: visible ? 1 : 0.14,
      fill: true,
      fillColor: color,
      fillOpacity: visible ? (local ? 0.46 : 0.28) : 0.035,
      dashArray: local ? "7 5" : null,
    };
  }

  function addMunicipalityBoundaries() {
    state.municipalityLayer = window.L.featureGroup().addTo(state.map);
    window.L.geoJSON(state.boundaries, {
      style: (feature) => areaStyle(feature.properties.fee_czk, feature.properties.color, false),
      onEachFeature: (feature, layer) => {
        const properties = feature.properties;
        layer.on("click", () => showArea(properties.name, properties.zone_code, false));
        state.mapEntries.push({ layer, fee: properties.fee_czk, color: properties.color, local: false });
        createZoneLabel(layer, properties.name, properties.fee_czk, properties.color, false).addTo(state.municipalityLayer);
      },
    }).addTo(state.municipalityLayer);
  }

  function createZoneLabel(layer, name, fee, color, local) {
    const width = local ? 104 : 92;
    const height = 38;
    return window.L.marker(layer.getBounds().getCenter(), {
      interactive: false,
      keyboard: false,
      zIndexOffset: local ? 700 : 500,
      icon: window.L.divIcon({
        className: `zone-map-marker${local ? " zone-map-marker--local" : ""}`,
        html: `<span style="--zone:${color}"><small>${name}</small><strong>${feeText(fee)}</strong></span>`,
        iconSize: [width, height],
        iconAnchor: [width / 2, height / 2],
      }),
    });
  }

  function addOverrideAreas() {
    state.overrideLayer = window.L.layerGroup().addTo(state.map);
    const groups = new Map();
    state.data.addresses.forEach((row) => {
      if (row[ROW.priority] <= 100) return;
      const key = `${row[ROW.rule]}|${row[ROW.zone]}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    groups.forEach((rows) => {
      const first = rows[0];
      const zone = zoneByCode(first[ROW.zone]);
      const points = rows.map(projectAddress).filter(Boolean);
      const hull = convexHull(points);
      let layer;
      if (hull.length >= 3) {
        layer = window.L.polygon(hull, areaStyle(zone.fee, zone.color, true));
      } else {
        const center = points[0] || BEROUN_CENTER;
        layer = window.L.circle(center, { ...areaStyle(zone.fee, zone.color, true), radius: 450 });
      }
      layer.on("click", () => showArea(first[ROW.rule], zone.code, true));
      layer.addTo(state.overrideLayer);
      createZoneLabel(layer, first[ROW.rule], zone.fee, zone.color, true).addTo(state.overrideLayer);
      state.mapEntries.push({ layer, fee: zone.fee, color: zone.color, local: true });
    });
  }

  function showArea(name, zoneCode, local) {
    const zone = zoneByCode(zoneCode);
    elements.selection.innerHTML = `
      <div class="side-eyebrow">${local ? "Místní výjimka" : "Rozvozová oblast"}</div>
      <div class="selection-title">${name}</div>
      <div class="selection-fee" style="--zone-color:${zone.color}">
        <strong>${feeText(zone.fee)}</strong><span>rozvoz</span>
      </div>
      <div class="selection-rule">${zone.name}${zone.minPizzas ? ` · minimálně ${zone.minPizzas} pizza` : ""}</div>
    `;
  }

  function renderLegend() {
    const counts = new Map();
    state.data.addresses.forEach((row) => counts.set(row[ROW.fee], (counts.get(row[ROW.fee]) || 0) + 1));
    elements.legend.innerHTML = state.data.zones
      .map((zone) => `
        <button class="legend-row" type="button" data-fee="${zone.fee}" style="--zone-color:${zone.color};--zone-soft:${softColor(zone.color, .10)}">
          <span class="legend-swatch"></span>
          <span>
            <span class="legend-label">${zone.fee === 0 ? "Beroun" : `Zóna ${zone.fee}`}</span>
            <span class="legend-count">${(counts.get(zone.fee) || 0).toLocaleString("cs-CZ")} adres</span>
          </span>
          <span class="legend-fee">${feeText(zone.fee)}</span>
        </button>
      `)
      .join("");
    elements.legend.querySelectorAll(".legend-row").forEach((button) => {
      button.addEventListener("click", () => filterByFee(Number(button.dataset.fee)));
    });
  }

  function filterByFee(fee) {
    state.activeFee = fee;
    elements.showAll.classList.toggle("is-active", fee === null);
    elements.legend.querySelectorAll(".legend-row").forEach((button) => {
      button.classList.toggle("is-active", fee !== null && Number(button.dataset.fee) === fee);
    });
    state.mapEntries.forEach((entry) => entry.layer.setStyle(areaStyle(entry.fee, entry.color, entry.local)));
    if (fee === null) {
      elements.selection.innerHTML = `
        <div class="side-eyebrow">Rozvozová oblast</div>
        <div class="selection-title">Beroun a okolí</div>
        <div class="selection-meta"><span>23 obcí</span><span>8 cenových pásem</span></div>
      `;
      return;
    }
    const zone = zoneByFee(fee);
    const places = zone.places.join(", ");
    elements.selection.innerHTML = `
      <div class="side-eyebrow">Cenové pásmo</div>
      <div class="selection-title">${fee === 0 ? "Beroun" : `Zóna ${fee}`}</div>
      <div class="selection-fee" style="--zone-color:${zone.color}">
        <strong>${feeText(fee)}</strong><span>rozvoz</span>
      </div>
      <div class="selection-address">${places}</div>
    `;
  }

  function resultScore(row, query, tokens) {
    const haystack = row[ROW.search];
    if (!tokens.every((token) => haystack.includes(token))) return null;
    let score = haystack.startsWith(query) ? 0 : 20;
    const position = haystack.indexOf(query);
    score += position === -1 ? 50 : position;
    score += haystack.length / 1000;
    return score;
  }

  function findAddresses(query) {
    const normalized = normalize(query);
    if (normalized.length < 2) return [];
    const tokens = normalized.split(" ");
    const scored = [];
    for (const row of state.data.addresses) {
      const score = resultScore(row, normalized, tokens);
      if (score === null) continue;
      scored.push({ row, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 8).map((entry) => entry.row);
  }

  function renderResults(rows) {
    state.resultRows = rows;
    state.activeResult = -1;
    if (!elements.search.value.trim()) {
      elements.results.hidden = true;
      elements.results.innerHTML = "";
      return;
    }
    if (!rows.length) {
      elements.results.innerHTML = '<div class="search-empty">Adresa nebyla nalezena</div>';
      elements.results.hidden = false;
      return;
    }
    elements.results.innerHTML = rows
      .map((row, index) => {
        const zone = zoneByCode(row[ROW.zone]);
        return `
          <button class="search-result" type="button" role="option" data-index="${index}" style="--pin:${zone.color};--pin-soft:${softColor(zone.color, .11)}">
            <span class="result-pin"><i data-lucide="map-pin"></i></span>
            <span><span class="result-address">${row[ROW.address]}</span><span class="result-place">${row[ROW.rule]}</span></span>
            <span class="result-fee">${feeText(row[ROW.fee])}</span>
          </button>
        `;
      })
      .join("");
    elements.results.hidden = false;
    elements.results.querySelectorAll(".search-result").forEach((button) => {
      button.addEventListener("click", () => selectAddress(rows[Number(button.dataset.index)]));
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function selectAddress(row) {
    const point = projectAddress(row);
    if (!point) return;
    const zone = zoneByCode(row[ROW.zone]);
    if (state.marker) state.map.removeLayer(state.marker);
    const icon = window.L.divIcon({
      className: "",
      html: `<div class="address-marker" style="--marker:${zone.color}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    state.marker = window.L.marker(point, { icon, zIndexOffset: 1000 }).addTo(state.map);
    state.marker.bindPopup(`
      <div class="popup-address">${row[ROW.address]}</div>
      <div class="popup-fee" style="color:${zone.color}">${feeText(row[ROW.fee])} rozvoz</div>
    `).openPopup();
    state.map.flyTo(point, 16, { duration: 0.7 });
    elements.search.value = row[ROW.address];
    elements.clear.hidden = false;
    elements.results.hidden = true;
    elements.selection.innerHTML = `
      <div class="side-eyebrow">Nalezená adresa</div>
      <div class="selection-title">${row[ROW.rule]}</div>
      <div class="selection-address">${row[ROW.address]}</div>
      <div class="selection-fee" style="--zone-color:${zone.color}">
        <strong>${feeText(row[ROW.fee])}</strong><span>rozvoz</span>
      </div>
      <div class="selection-rule">${zone.name} · RÚIAN</div>
    `;
  }

  function bindSearch() {
    let timer;
    elements.search.addEventListener("input", () => {
      elements.clear.hidden = !elements.search.value;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => renderResults(findAddresses(elements.search.value)), 90);
    });
    elements.search.addEventListener("keydown", (event) => {
      if (elements.results.hidden || !state.resultRows.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        state.activeResult = Math.min(state.activeResult + 1, state.resultRows.length - 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.activeResult = Math.max(state.activeResult - 1, 0);
      } else if (event.key === "Enter" && state.activeResult >= 0) {
        event.preventDefault();
        selectAddress(state.resultRows[state.activeResult]);
        return;
      } else if (event.key === "Escape") {
        elements.results.hidden = true;
        return;
      } else {
        return;
      }
      elements.results.querySelectorAll(".search-result").forEach((button, index) => {
        button.classList.toggle("is-active", index === state.activeResult);
      });
    });
    elements.clear.addEventListener("click", () => {
      elements.search.value = "";
      elements.clear.hidden = true;
      elements.results.hidden = true;
      elements.search.focus();
      if (state.marker) {
        state.map.removeLayer(state.marker);
        state.marker = null;
      }
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".address-search-box")) elements.results.hidden = true;
    });
  }

  function bindControls() {
    elements.showAll.addEventListener("click", () => filterByFee(null));
    elements.toggleMunicipalities.addEventListener("change", () => {
      if (elements.toggleMunicipalities.checked) state.municipalityLayer.addTo(state.map);
      else state.map.removeLayer(state.municipalityLayer);
    });
    elements.toggleOverrides.addEventListener("change", () => {
      if (elements.toggleOverrides.checked) state.overrideLayer.addTo(state.map);
      else state.map.removeLayer(state.overrideLayer);
    });
  }

  async function init() {
    cacheElements();
    if (window.lucide) window.lucide.createIcons();
    try {
      const [dataResponse, boundariesResponse] = await Promise.all([fetch(DATA_URL), fetch(BOUNDARIES_URL)]);
      if (!dataResponse.ok || !boundariesResponse.ok) throw new Error("Data request failed");
      state.data = await dataResponse.json();
      state.boundaries = await boundariesResponse.json();
      initProjection();
      initMap();
      renderLegend();
      bindSearch();
      bindControls();
      elements.addressCount.textContent = `${state.data.meta.count.toLocaleString("cs-CZ")} adres`;
      elements.sourceDate.textContent = `RÚIAN · ${new Date(state.data.meta.sourceDate).toLocaleDateString("cs-CZ")}`;
    } catch (error) {
      console.error(error);
      elements.error.hidden = false;
      elements.addressCount.textContent = "Data nejsou dostupná";
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
