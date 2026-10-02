/* Núcleo fiscal compartido: lee los ajustes de la sección "Del bruto al neto"
   y expone gross()/net() para el resto de módulos.
   net = gross × (1 − retención efectiva EE. UU.) × (1 − IRPF). */
window.YTTax = (function () {
  function $(id) { return document.getElementById(id); }
  function num(id, d) { var e = $(id); var v = e ? parseFloat(e.value) : NaN; return isNaN(v) ? (d || 0) : v; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function rpms() {
    var lo = clamp(num("rpmLow"), 0, 1e7), hi = clamp(num("rpmHigh"), 0, 1e7);
    if (hi < lo) { var t = lo; lo = hi; hi = t; }
    return [lo, hi];
  }
  function factor() {
    var w = clamp(num("usRate"), 0, 30) / 100 * clamp(num("usShare"), 0, 100) / 100;
    var irpf = clamp(num("irpf"), 0, 50) / 100;
    return (1 - w) * (1 - irpf);
  }
  function gross(views) { var r = rpms(); return [views / 1000 * r[0], views / 1000 * r[1]]; }
  function net(views) { var f = factor(); var g = gross(views); return [g[0] * f, g[1] * f]; }

  return { rpms: rpms, factor: factor, gross: gross, net: net };
})();
