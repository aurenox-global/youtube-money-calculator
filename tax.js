/* Del bruto al neto: retención EE. UU., IVA e IRPF.
   Parte de los mismos inputs que la calculadora principal. */
(function () {
  "use strict";

  var nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function $(id) { return document.getElementById(id); }
  function num(id, d) { var e = $(id); var v = e ? parseFloat(e.value) : NaN; return isNaN(v) ? (d || 0) : v; }
  function usd(n) { return "$" + nf2.format(Math.abs(n)); }
  function usdSigned(n) { return (n < 0 ? "−" : "") + usd(n); }
  function range(a, b) { return usd(a) + " – " + usd(b); }
  function boost(pct) { return 1 + Math.min(Math.max(pct, 0), 20) / 20 * 0.35; }
  function setFill(el) {
    if (!el || el.type !== "range") return;
    var min = parseFloat(el.min), max = parseFloat(el.max), val = parseFloat(el.value);
    var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", pct + "%");
  }
  function row(label, value, cls) {
    return '<div class="kv' + (cls ? " " + cls : "") + '"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  function render() {
    var out = $("taxResults");
    if (!out) return;

    var views = Math.max(0, num("viewsRange"));
    var eng = num("engagement");
    var lo = Math.max(0, num("rpmLow"));
    var hi = Math.max(0, num("rpmHigh"));
    if (hi < lo) { var t = lo; lo = hi; hi = t; }
    var b = boost(eng);

    var gLow = views * 30 / 1000 * lo;
    var gHigh = views * 30 / 1000 * hi * b;

    var usRate = Math.min(30, Math.max(0, num("usRate"))) / 100;
    var usShare = Math.min(100, Math.max(0, num("usShare"))) / 100;
    var w = usRate * usShare;                    // fracción efectiva retenida
    var irpf = Math.min(50, Math.max(0, num("irpf"))) / 100;

    var whLow = gLow * w, whHigh = gHigh * w;
    var preLow = gLow - whLow, preHigh = gHigh - whHigh;
    var taxLow = preLow * irpf, taxHigh = preHigh * irpf;
    var netLow = preLow - taxLow, netHigh = preHigh - taxHigh;

    var vatOn = ($("vatMode") || {}).value === "on";
    var vatRate = Math.max(0, num("vatRate")) / 100;
    var vatLow = vatOn ? gLow * vatRate : 0, vatHigh = vatOn ? gHigh * vatRate : 0;

    // etiquetas de salida
    if ($("usRateOut")) $("usRateOut").textContent = nf0.format(num("usRate")) + " %";
    if ($("usShareOut")) $("usShareOut").textContent = nf0.format(num("usShare")) + " %";
    if ($("irpfOut")) $("irpfOut").textContent = nf0.format(num("irpf")) + " %";
    if ($("vatRate")) $("vatRate").disabled = !vatOn;

    out.innerHTML =
      row("Bruto estimado / mes", range(gLow, gHigh)) +
      row("− Retención EE. UU. / mes", "−" + range(whLow, whHigh)) +
      row("= Neto antes de IRPF / mes", range(preLow, preHigh)) +
      row("− IRPF / mes", "−" + range(taxLow, taxHigh)) +
      '<div class="stat highlight big"><span class="stat-label">= Neto en mano / mes</span><span class="stat-value">' + range(netLow, netHigh) + '</span></div>' +
      '<div class="stat highlight big"><span class="stat-label">= Neto en mano / año</span><span class="stat-value">' + range(netLow * 12, netHigh * 12) + '</span></div>' +
      (vatOn
        ? '<p class="muted small">IVA que Google añade a tu pago (lo ingresas a Hacienda, no es tuyo): ' + range(vatLow, vatHigh) + ' / mes.</p>'
        : '<p class="muted small">Con IVA desactivado no se añade IVA al pago (particular o no sujeto).</p>') +
      '<p class="muted small">Retención efectiva aplicada a tus ingresos: ' + nf2.format(w * 100) + ' % (solo sobre la parte de audiencia de EE. UU.).</p>';
  }

  function init() {
    var ids = ["usRate", "usShare", "irpf", "vatRate", "vatMode", "viewsRange", "engagement", "rpmLow", "rpmHigh"];
    ids.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", function () { setFill(el); render(); });
      el.addEventListener("change", function () { setFill(el); render(); });
    });
    ["usRate", "usShare", "irpf"].forEach(function (id) { setFill($(id)); });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
