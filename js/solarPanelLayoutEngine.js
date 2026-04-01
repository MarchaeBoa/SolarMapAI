/* ============================================================
   SOLAR PANEL LAYOUT ENGINE v1.0
   Módulo isolado para posicionamento realista de placas solares
   NÃO modifica nenhuma função existente — apenas EXTENDE
   ============================================================ */

const SolarLayoutEngine = (function () {

  // ── PANEL MODELS DATABASE ──
  const PANEL_MODELS = {
    'mono-400':  { name: 'Monocristalino 400W',  watt: 400, width: 1.04, height: 2.10, price: 850,  color: '#0e2545', stroke: '#1FD8A4', efficiency: 0.204 },
    'bi-450':    { name: 'Bifacial 450W',         watt: 450, width: 1.04, height: 2.10, price: 1100, color: '#0a1e3a', stroke: '#5AAFFF', efficiency: 0.215 },
    'poly-350':  { name: 'Policristalino 350W',   watt: 350, width: 0.99, height: 1.96, price: 650,  color: '#102040', stroke: '#7B8CDE', efficiency: 0.178 },
    'mono-550':  { name: 'Premium 550W',          watt: 550, width: 1.13, height: 2.28, price: 1350, color: '#0b1a30', stroke: '#FFD96A', efficiency: 0.225 },
    'mono-600':  { name: 'Ultra 600W',            watt: 600, width: 1.20, height: 2.30, price: 1600, color: '#08152a', stroke: '#FF9F43', efficiency: 0.232 },
    'compact-400':{ name: 'Compacto 400W',        watt: 400, width: 1.00, height: 1.72, price: 780,  color: '#0d2040', stroke: '#5AFAC8', efficiency: 0.210 }
  };

  // ── CONFIG ──
  const CONFIG = {
    SAFETY_MARGIN: 0.30,     // 30cm margin from roof edges
    GAP_HORIZONTAL: 0.04,    // 4cm between panels horizontal
    GAP_VERTICAL: 0.06,      // 6cm between panels vertical
    PERFORMANCE_RATIO: 0.78, // System performance ratio
    PANEL_OPACITY: 0.88,
    ANIMATION_DELAY: 30,     // ms between each panel animation
    METERS_PER_LAT: 110540,
    MIN_PANELS: 0,
    MAX_PANELS: 2000
  };

  // ── HELPER: meters to lat/lng degrees ──
  function metersToLatDeg(meters) {
    return meters / CONFIG.METERS_PER_LAT;
  }

  function metersToLngDeg(meters, atLat) {
    return meters / (111320 * Math.cos(atLat * Math.PI / 180));
  }

  // ── HELPER: point in polygon ──
  function pointInPolygon(pt, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const yi = polygon[i].lng, xi = polygon[i].lat;
      const yj = polygon[j].lng, xj = polygon[j].lat;
      if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // ── HELPER: shrink polygon inward by margin ──
  function shrinkPolygon(latlngs, marginMeters) {
    if (!latlngs || latlngs.length < 3 || marginMeters <= 0) return latlngs;

    // Calculate centroid
    let cLat = 0, cLng = 0;
    latlngs.forEach(p => { cLat += p.lat; cLng += p.lng; });
    cLat /= latlngs.length;
    cLng /= latlngs.length;

    const marginLat = metersToLatDeg(marginMeters);
    const marginLng = metersToLngDeg(marginMeters, cLat);

    // Shrink each point toward centroid
    return latlngs.map(p => {
      const dLat = p.lat - cLat;
      const dLng = p.lng - cLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist === 0) return { lat: p.lat, lng: p.lng };

      const shrinkRatio = Math.max(0, 1 - Math.sqrt(marginLat * marginLat + marginLng * marginLng) / dist);
      return {
        lat: cLat + dLat * shrinkRatio,
        lng: cLng + dLng * shrinkRatio
      };
    });
  }

  // ── HELPER: calculate roof angle from polygon ──
  function estimateRoofAngle(latlngs) {
    if (!latlngs || latlngs.length < 2) return 0;

    // Find longest edge to estimate roof orientation
    let maxDist = 0, angle = 0;
    for (let i = 0; i < latlngs.length; i++) {
      const j = (i + 1) % latlngs.length;
      const dx = (latlngs[j].lng - latlngs[i].lng) * 111320 * Math.cos(latlngs[i].lat * Math.PI / 180);
      const dy = (latlngs[j].lat - latlngs[i].lat) * 110540;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) {
        maxDist = dist;
        angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }
    return angle;
  }

  // ── CORE: Generate optimized panel layout ──
  function generateLayout(roofPolygon, panelModelKey, options = {}) {
    const model = PANEL_MODELS[panelModelKey];
    if (!model || !roofPolygon) return { panels: [], count: 0 };

    const latlngs = roofPolygon.getLatLngs()[0];
    const bounds = roofPolygon.getBounds();
    const cLat = bounds.getCenter().lat;

    // Apply safety margin
    const margin = options.margin !== undefined ? options.margin : CONFIG.SAFETY_MARGIN;
    const safePolygon = shrinkPolygon(latlngs, margin);

    // Estimate roof orientation
    const roofAngle = estimateRoofAngle(latlngs);

    // Panel dimensions with gaps
    const pw = model.width + CONFIG.GAP_HORIZONTAL;
    const ph = model.height + CONFIG.GAP_VERTICAL;

    // Convert to lat/lng
    const dLat = metersToLatDeg(ph);
    const dLng = metersToLngDeg(pw, cLat);

    // Also try rotated 90° layout
    const dLatR = metersToLatDeg(pw + CONFIG.GAP_VERTICAL);
    const dLngR = metersToLngDeg(ph + CONFIG.GAP_HORIZONTAL, cLat);

    // Generate panels for normal orientation
    const panelsNormal = _fillGrid(bounds, safePolygon, dLat, dLng, model, cLat, false);
    // Generate panels for rotated orientation
    const panelsRotated = _fillGrid(bounds, safePolygon, dLatR, dLngR, model, cLat, true);

    // Pick the orientation that fits more panels
    const panels = panelsRotated.length > panelsNormal.length ? panelsRotated : panelsNormal;
    const isRotated = panelsRotated.length > panelsNormal.length;

    return {
      panels: panels,
      count: panels.length,
      model: model,
      modelKey: panelModelKey,
      isRotated: isRotated,
      roofAngle: roofAngle,
      totalKwp: (panels.length * model.watt) / 1000,
      areaUsed: panels.length * model.width * model.height,
      efficiency: model.efficiency
    };
  }

  function _fillGrid(bounds, safePolygon, dLat, dLng, model, cLat, rotated) {
    const panels = [];
    const halfDLat = dLat * 0.46;
    const halfDLng = dLng * 0.46;

    for (let lat = bounds.getSouth() + dLat * 0.5; lat < bounds.getNorth(); lat += dLat) {
      for (let lng = bounds.getWest() + dLng * 0.5; lng < bounds.getEast(); lng += dLng) {
        // Check all 4 corners of the panel are inside the safe polygon
        const corners = [
          [lat - halfDLat, lng - halfDLng],
          [lat - halfDLat, lng + halfDLng],
          [lat + halfDLat, lng - halfDLng],
          [lat + halfDLat, lng + halfDLng]
        ];

        const allInside = corners.every(c => pointInPolygon(c, safePolygon));
        if (allInside) {
          panels.push({
            center: [lat, lng],
            bounds: [
              [lat - halfDLat, lng - halfDLng],
              [lat + halfDLat, lng + halfDLng]
            ],
            rotated: rotated
          });

          if (panels.length >= CONFIG.MAX_PANELS) return panels;
        }
      }
    }
    return panels;
  }

  // ── RENDER: Create SVG panel with realistic look ──
  function createPanelSVG(model, widthPx, heightPx) {
    const cellsX = 3;
    const cellsY = 5;
    const cellW = widthPx / cellsX;
    const cellH = heightPx / cellsY;
    const gap = 0.8;

    let svg = `<svg width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}" xmlns="http://www.w3.org/2000/svg">`;

    // Panel background with gradient
    svg += `<defs>
      <linearGradient id="panelGrad_${model.watt}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="${model.color}" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="${model.color}"/>
        <stop offset="100%" stop-color="#040e1c" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="cellShine_${model.watt}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>`;

    // Frame
    svg += `<rect x="0" y="0" width="${widthPx}" height="${heightPx}" rx="1.5"
      fill="url(#panelGrad_${model.watt})" stroke="${model.stroke}" stroke-width="1" stroke-opacity="0.7"/>`;

    // Solar cells grid
    for (let cy = 0; cy < cellsY; cy++) {
      for (let cx = 0; cx < cellsX; cx++) {
        const x = cx * cellW + gap;
        const y = cy * cellH + gap;
        const w = cellW - gap * 2;
        const h = cellH - gap * 2;

        // Cell
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.5"
          fill="${model.color}" stroke="${model.stroke}" stroke-width="0.3" stroke-opacity="0.3"/>`;

        // Cell shine overlay
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.4}" rx="0.5"
          fill="url(#cellShine_${model.watt})"/>`;
      }
    }

    // Busbar lines (horizontal silver lines)
    const busbarY1 = heightPx * 0.33;
    const busbarY2 = heightPx * 0.66;
    svg += `<line x1="0" y1="${busbarY1}" x2="${widthPx}" y2="${busbarY1}"
      stroke="#C0C0C0" stroke-width="0.6" stroke-opacity="0.25"/>`;
    svg += `<line x1="0" y1="${busbarY2}" x2="${widthPx}" y2="${busbarY2}"
      stroke="#C0C0C0" stroke-width="0.6" stroke-opacity="0.25"/>`;

    // Center busbar (vertical)
    svg += `<line x1="${widthPx * 0.5}" y1="0" x2="${widthPx * 0.5}" y2="${heightPx}"
      stroke="#C0C0C0" stroke-width="0.4" stroke-opacity="0.2"/>`;

    svg += '</svg>';
    return svg;
  }

  // ── RENDER: Place panels on Leaflet map with animation ──
  function renderOnMap(map, layout, options = {}) {
    const markers = [];
    const animate = options.animate !== false;
    const model = layout.model;

    layout.panels.forEach((panel, index) => {
      const delay = animate ? index * CONFIG.ANIMATION_DELAY : 0;

      setTimeout(() => {
        // Calculate pixel size for SVG (approximate at current zoom)
        const zoom = map.getZoom();
        const metersPerPixel = 156543.03392 * Math.cos(panel.center[0] * Math.PI / 180) / Math.pow(2, zoom);
        const pxW = model.width / metersPerPixel;
        const pxH = model.height / metersPerPixel;

        // Use rectangle for proper geo-referenced sizing
        const rect = L.rectangle(panel.bounds, {
          color: model.stroke,
          weight: 0.8,
          fillColor: model.color,
          fillOpacity: CONFIG.PANEL_OPACITY,
          interactive: false,
          className: 'solar-panel-rect'
        });

        // Add custom SVG overlay for detailed look at high zoom
        if (zoom >= 19) {
          const svgHtml = createPanelSVG(model, Math.max(pxW, 12), Math.max(pxH, 18));
          const iconSize = layout.isRotated ? [Math.max(pxH, 18), Math.max(pxW, 12)] : [Math.max(pxW, 12), Math.max(pxH, 18)];

          const icon = L.divIcon({
            className: 'solar-panel-svg',
            html: `<div style="opacity:0;animation:panelFadeIn 0.4s ease-out forwards;animation-delay:${delay * 0.5}ms;">${svgHtml}</div>`,
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
          });

          const marker = L.marker(panel.center, {
            icon: icon,
            interactive: false,
            zIndexOffset: 500
          }).addTo(map);

          markers.push(marker);
        } else {
          // At lower zoom, use simple rectangles (better performance)
          rect.addTo(map);
          markers.push(rect);
        }
      }, delay);
    });

    return markers;
  }

  // ── STATS: Calculate full system stats ──
  function calculateStats(layout, stateUF, irradianceData, tariffData) {
    const irr = (irradianceData && irradianceData[stateUF]) || 4.8;
    const tar = (tariffData && tariffData[stateUF]) || 0.78;
    const model = layout.model;
    const count = layout.count;

    const kWp = layout.totalKwp;
    const monthlyGen = kWp * irr * 30 * CONFIG.PERFORMANCE_RATIO;
    const annualGen = monthlyGen * 12;
    const monthlySavings = monthlyGen * tar;
    const annualSavings = monthlySavings * 12;
    const investment = count * model.price + kWp * 800;
    const payback = annualSavings > 0 ? investment / annualSavings : 0;
    const co2Avoided = (annualGen * 0.075) / 1000;
    const areaUsed = layout.areaUsed;

    return {
      count, kWp, monthlyGen, annualGen,
      monthlySavings, annualSavings,
      investment, payback, co2Avoided,
      areaUsed, irradiance: irr, tariff: tar,
      modelName: model.name
    };
  }

  // ── FORMAT HELPERS ──
  function formatNumber(n) {
    return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatCurrency(n) {
    return 'R$ ' + formatNumber(n);
  }

  // ── PUBLIC API ──
  return {
    PANEL_MODELS,
    CONFIG,
    generateLayout,
    renderOnMap,
    calculateStats,
    createPanelSVG,
    formatNumber,
    formatCurrency,
    estimateRoofAngle,
    pointInPolygon
  };

})();
