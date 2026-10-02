/* Navegación por secciones (menú lateral): muestra un panel a la vez, sin scroll. */
(function () {
  "use strict";

  function panels() { return document.querySelectorAll(".panel"); }
  function links() { return document.querySelectorAll("[data-target]"); }

  function show(id) {
    var found = false;
    panels().forEach(function (p) {
      var on = p.id === id;
      p.classList.toggle("active", on);
      if (on) found = true;
    });
    if (!found) return;
    links().forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("data-target") === id);
    });
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
    window.scrollTo(0, 0);
    /* Reajusta el gráfico al mostrarse (por si se renderizó oculto) */
    if (id === "proyeccion" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("resize"));
    }
  }

  function init() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[href^='#']") : null;
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (el && el.classList.contains("panel")) {
        e.preventDefault();
        show(id);
      }
    });

    var initial = (location.hash || "").slice(1);
    if (!initial || !document.getElementById(initial)) initial = "calculadora";
    show(initial);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
