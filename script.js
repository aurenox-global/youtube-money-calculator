/* Calculadora de Dinero en YouTube — lógica de estimación */
(function () {
  "use strict";

  var DAYS_MONTH = 30;
  var DAYS_YEAR = 365;

  var viewsRange = document.getElementById("viewsRange");
  var engagement = document.getElementById("engagement");
  var rpmLow = document.getElementById("rpmLow");
  var rpmHigh = document.getElementById("rpmHigh");

  var viewsOut = document.getElementById("viewsOut");
  var engOut = document.getElementById("engOut");

  var viewsMonth = document.getElementById("viewsMonth");
  var viewsYear = document.getElementById("viewsYear");
  var earnDay = document.getElementById("earnDay");
  var earnMonth = document.getElementById("earnMonth");
  var earnYear = document.getElementById("earnYear");
  var netMonth = document.getElementById("netMonth");
  var netYear = document.getElementById("netYear");

  var nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function usd(n) {
    return "$" + nf2.format(n);
  }

  /* El engagement modula la horquilla: a mayor engagement, la parte alta
     del rango se amplía (anuncios mejor pagados por audiencias más activas). */
  function engagementBoost(pct) {
    // 0 % → 1.0 (sin boost), 20 % → 1.35
    return 1 + (Math.min(Math.max(pct, 0), 20) / 20) * 0.35;
  }

  function setFill(el) {
    var min = parseFloat(el.min), max = parseFloat(el.max), val = parseFloat(el.value);
    var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", pct + "%");
  }

  function calculate() {
    var views = Math.max(0, parseFloat(viewsRange.value) || 0);
    var eng = Math.max(0, parseFloat(engagement.value) || 0);
    var lo = Math.max(0, parseFloat(rpmLow.value) || 0);
    var hi = Math.max(0, parseFloat(rpmHigh.value) || 0);
    if (hi < lo) { var t = lo; lo = hi; hi = t; }

    var boost = engagementBoost(eng);

    // Ingreso por vista (en USD)
    var dayLow = (views / 1000) * lo;
    var dayHigh = (views / 1000) * hi * boost;

    viewsOut.textContent = nf0.format(views) + " vistas/día";
    engOut.textContent = nf2.format(eng).replace(",00", ",0") + " %";

    viewsMonth.textContent = nf0.format(views * DAYS_MONTH);
    viewsYear.textContent = nf0.format(views * DAYS_YEAR);

    earnDay.textContent = usd(dayLow) + " – " + usd(dayHigh);
    earnMonth.textContent = usd(dayLow * DAYS_MONTH) + " – " + usd(dayHigh * DAYS_MONTH);
    earnYear.textContent = usd(dayLow * DAYS_YEAR) + " – " + usd(dayHigh * DAYS_YEAR);

    var taxF = (window.YTTax && YTTax.factor) ? YTTax.factor() : 1;
    if (netMonth) netMonth.textContent = usd(dayLow * DAYS_MONTH * taxF) + " – " + usd(dayHigh * DAYS_MONTH * taxF);
    if (netYear) netYear.textContent = usd(dayLow * DAYS_YEAR * taxF) + " – " + usd(dayHigh * DAYS_YEAR * taxF);

    setFill(viewsRange);
    setFill(engagement);
  }

  [viewsRange, engagement, rpmLow, rpmHigh].forEach(function (el) {
    el.addEventListener("input", calculate);
    el.addEventListener("change", calculate);
  });

  /* Recalcula el neto cuando cambian los ajustes fiscales */
  ["usRate", "usShare", "irpf"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", calculate);
  });

  calculate();
})();
