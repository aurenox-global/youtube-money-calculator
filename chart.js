/* Proyección de ingresos (SVG puro, sin dependencias) + selector de nicho.
   Lee los mismos inputs que la calculadora principal. */
(function () {
  "use strict";

  var nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
  var NS = "http://www.w3.org/2000/svg";

  function $(id) { return document.getElementById(id); }
  function num(id, d) { var e = $(id); var v = e ? parseFloat(e.value) : NaN; return isNaN(v) ? (d || 0) : v; }
  function money(n) { return "$" + nf0.format(Math.round(n)); }
  function moneyCompact(n) {
    n = n || 0;
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1).replace(".", ",") + " M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1).replace(".", ",") + " mil";
    return "$" + nf0.format(Math.round(n));
  }
  function boost(pct) { return 1 + Math.min(Math.max(pct, 0), 20) / 20 * 0.35; }
  function mk(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / p;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return m * p;
  }
  function setFill(el) {
    if (!el) return;
    var min = parseFloat(el.min), max = parseFloat(el.max), val = parseFloat(el.value);
    var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", pct + "%");
  }

  function render() {
    var svg = $("projChart");
    if (!svg) return;

    var views = Math.max(0, num("viewsRange"));
    var eng = num("engagement");
    var lo = Math.max(0, num("rpmLow"));
    var hi = Math.max(0, num("rpmHigh"));
    if (hi < lo) { var t = lo; lo = hi; hi = t; }
    var g = num("growth", 5) / 100;
    var b = boost(eng);

    var go = $("growthOut");
    if (go) go.textContent = nf0.format(num("growth", 5)) + " %";

    var months = [], cumLow = 0, cumHigh = 0;
    for (var m = 0; m < 12; m++) {
      var f = Math.pow(1 + g, m);
      var mv = views * 30 * f;
      cumLow += mv / 1000 * lo;
      cumHigh += mv / 1000 * hi * b;
      months.push({ low: cumLow, high: cumHigh });
    }
    var tot = $("projTotal");
    if (tot) tot.textContent = money(cumLow) + " – " + money(cumHigh);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var W = 820, H = 320, L = 64, R = 24, T = 18, B = 40;
    var pw = W - L - R, ph = H - T - B;
    var maxY = cumHigh > 0 ? cumHigh : 1;
    var step = niceStep(maxY / 4);
    maxY = Math.max(step, Math.ceil(maxY / step) * step);

    function x(i) { return L + (i / 11) * pw; }
    function y(v) { return T + ph - (v / maxY) * ph; }

    for (var v = 0; v <= maxY + 1e-6; v += step) {
      svg.appendChild(mk("line", { x1: L, y1: y(v), x2: L + pw, y2: y(v), stroke: "#e6e9ee", "stroke-width": 1 }));
      var tl = mk("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", "font-size": 11, fill: "#5b6673" });
      tl.textContent = moneyCompact(v);
      svg.appendChild(tl);
    }
    for (var i = 0; i < 12; i++) {
      var tx = mk("text", { x: x(i), y: H - 16, "text-anchor": "middle", "font-size": 11, fill: "#5b6673" });
      tx.textContent = "M" + (i + 1);
      svg.appendChild(tx);
    }

    var band = "";
    for (var a = 0; a < 12; a++) band += (a ? " L " : "M ") + x(a) + " " + y(months[a].high);
    for (var c = 11; c >= 0; c--) band += " L " + x(c) + " " + y(months[c].low);
    band += " Z";
    svg.appendChild(mk("path", { d: band, fill: "rgba(255,0,0,0.10)", stroke: "none" }));

    function linePath(key) {
      var d = "";
      for (var i2 = 0; i2 < 12; i2++) d += (i2 ? " L " : "M ") + x(i2) + " " + y(months[i2][key]);
      return d;
    }
    svg.appendChild(mk("path", { d: linePath("high"), fill: "none", stroke: "#ff0000", "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    svg.appendChild(mk("path", { d: linePath("low"), fill: "none", stroke: "#cc0000", "stroke-width": 2, "stroke-dasharray": "5 4", "stroke-linejoin": "round" }));
    svg.appendChild(mk("circle", { cx: x(11), cy: y(months[11].high), r: 4, fill: "#ff0000" }));
    svg.appendChild(mk("circle", { cx: x(11), cy: y(months[11].low), r: 4, fill: "#cc0000" }));
  }

  function init() {
    ["viewsRange", "engagement", "rpmLow", "rpmHigh", "growth"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", function () { setFill(el); render(); });
    });

    var niche = $("niche");
    if (niche) {
      niche.addEventListener("change", function () {
        var o = niche.options[niche.selectedIndex];
        var low = o.getAttribute("data-low"), high = o.getAttribute("data-high");
        var rl = $("rpmLow"), rh = $("rpmHigh");
        if (rl) { rl.value = low; rl.dispatchEvent(new Event("input", { bubbles: true })); }
        if (rh) { rh.value = high; rh.dispatchEvent(new Event("input", { bubbles: true })); }
        render();
      });
    }

    setFill($("growth"));
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
