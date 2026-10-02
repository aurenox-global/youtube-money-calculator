/* Calculadora por enlace (canal / vídeo) — datos públicos sin API key.
   Fuentes: SocialCounts (canales), Return YouTube Dislike (vistas de vídeo),
   oEmbed de YouTube (título/miniatura) y Piped (respaldo de vistas). */
(function () {
  "use strict";

  var nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function n0(n) { return nf0.format(Math.round(n || 0)); }
  function usd(n) { return "$" + nf2.format(n || 0); }

  function compact(n) {
    n = n || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(2).replace(".", ",") + " mil M";
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(".", ",") + " M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".", ",") + " mil";
    return n0(n);
  }

  /* ---------- RPM compartido con la calculadora principal ---------- */
  function rpms() {
    var lo = parseFloat((document.getElementById("rpmLow") || {}).value) || 0;
    var hi = parseFloat((document.getElementById("rpmHigh") || {}).value) || 0;
    if (hi < lo) { var t = lo; lo = hi; hi = t; }
    return [lo, hi];
  }
  function updateRpmUsed() {
    var el = document.getElementById("rpmUsed");
    if (!el) return;
    var r = rpms();
    el.textContent = usd(r[0]) + " – " + usd(r[1]);
  }
  function earnRange(views) {
    var r = rpms();
    return [views / 1000 * r[0], views / 1000 * r[1]];
  }
  function earnStr(views) {
    var e = earnRange(views);
    return usd(e[0]) + " – " + usd(e[1]);
  }

  /* ---------- utilidades de red ---------- */
  function fetchJSON(url, timeout) {
    return new Promise(function (resolve, reject) {
      var ctrl = new AbortController();
      var t = setTimeout(function () { ctrl.abort(); }, timeout || 12000);
      fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (j) { clearTimeout(t); resolve(j); })
        .catch(function (e) { clearTimeout(t); reject(e); });
    });
  }

  /* ---------- parseo de enlaces ---------- */
  function extractVideoId(input) {
    if (!input) return null;
    input = input.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
    var m = input.match(/(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    return m ? m[1] : null;
  }

  function parseChannel(input) {
    if (!input) return null;
    input = input.trim();
    if (/^UC[A-Za-z0-9_-]{22}$/.test(input)) return { kind: "id", value: input };
    if (/^@[\w.\- ]+$/.test(input)) return { kind: "query", value: input.slice(1).trim() };
    var m;
    m = input.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})/i);
    if (m) return { kind: "id", value: m[1] };
    m = input.match(/youtube\.com\/@([\w.\-]+)/i);
    if (m) return { kind: "query", value: m[1] };
    m = input.match(/youtube\.com\/(?:c|user)\/([\w.\-]+)/i);
    if (m) return { kind: "query", value: m[1] };
    if (/^[\w.\- ]{2,}$/.test(input)) return { kind: "query", value: input };
    return null;
  }

  /* ---------- fuentes de datos ---------- */
  var API_SEARCH = "https://api.socialcounts.org/youtube-live-subscriber-count/search/";
  var API_COUNT = "https://api.socialcounts.org/youtube-live-subscriber-count/";

  function resolveChannel(parsed) {
    if (parsed.kind === "id") return Promise.resolve({ id: parsed.value });
    return fetchJSON(API_SEARCH + encodeURIComponent(parsed.value)).then(function (res) {
      var items = (res && res.items) || [];
      if (!items.length) throw new Error("No encontré ese canal. Revisa el enlace.");
      return items[0];
    });
  }

  function channelStats(id) {
    return fetchJSON(API_COUNT + id).then(function (res) {
      var c = (res && res.counters) || {};
      var e = c.estimation || c.api;
      if (!e) throw new Error("Sin datos del canal.");
      return { subs: e.subscriberCount || 0, views: e.viewCount || 0, videos: e.videoCount || 0 };
    });
  }

  function videoViews(id) {
    return fetchJSON("https://returnyoutubedislikeapi.com/votes?videoId=" + id).then(function (r) {
      if (r && typeof r.viewCount === "number") {
        return { views: r.viewCount, likes: r.likes || 0, dislikes: r.dislikes || 0, source: "RYD" };
      }
      throw new Error("sin datos");
    }).catch(function () {
      return fetchJSON("https://api.piped.private.coffee/streams/" + id).then(function (p) {
        if (p && typeof p.views === "number") {
          return { views: p.views, likes: p.likes || 0, dislikes: p.dislikes || 0, source: "Piped" };
        }
        throw new Error("Sin datos de vistas para este vídeo.");
      });
    });
  }

  function videoMeta(id) {
    return fetchJSON("https://www.youtube.com/oembed?url=" +
      encodeURIComponent("https://www.youtube.com/watch?v=" + id) + "&format=json")
      .then(function (o) { return { title: o.title, author: o.author_name, thumb: o.thumbnail_url }; })
      .catch(function () { return null; });
  }

  /* ---------- render ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function kv(label, value) {
    return '<div class="kv"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  function renderChannel(el, info, stats) {
    var perVideo = stats.videos > 0 ? stats.views / stats.videos : 0;
    var handle = info.handle ? esc(info.handle) : "";
    var avatar = info.pfp ? '<img class="yt-avatar" src="' + esc(info.pfp) + '" alt="" loading="lazy" />' : "";
    el.innerHTML =
      '<div class="yt-head">' + avatar +
        '<div><strong>' + esc(info.title || "Canal") + '</strong>' +
        (handle ? '<div class="muted small">' + handle + '</div>' : '') + '</div>' +
      '</div>' +
      kv("Suscriptores", n0(stats.subs)) +
      kv("Vistas totales", compact(stats.views) + " (" + n0(stats.views) + ")") +
      kv("Número de vídeos", n0(stats.videos)) +
      kv("Vistas medias por vídeo", compact(perVideo)) +
      '<div class="stat highlight big"><span class="stat-label">Ganancias totales estimadas (canal)</span><span class="stat-value">' + earnStr(stats.views) + '</span></div>' +
      '<div class="stat highlight"><span class="stat-label">Ganancias medias por vídeo</span><span class="stat-value">' + earnStr(perVideo) + '</span></div>';
    el.classList.remove("hidden");
  }

  function renderVideo(el, id, meta, stats) {
    var thumb = meta && meta.thumb
      ? '<img class="yt-thumb" src="' + esc(meta.thumb) + '" alt="" loading="lazy" />'
      : '<img class="yt-thumb" src="https://i.ytimg.com/vi/' + esc(id) + '/mqdefault.jpg" alt="" loading="lazy" />';
    var title = meta && meta.title ? esc(meta.title) : "Vídeo";
    var author = meta && meta.author ? esc(meta.author) : "";
    el.innerHTML =
      '<div class="yt-head">' + thumb +
        '<div><strong>' + title + '</strong>' +
        (author ? '<div class="muted small">' + author + '</div>' : '') + '</div>' +
      '</div>' +
      kv("Vistas", compact(stats.views) + " (" + n0(stats.views) + ")") +
      kv("Likes", n0(stats.likes)) +
      '<div class="stat highlight big"><span class="stat-label">Ganancias estimadas del vídeo</span><span class="stat-value">' + earnStr(stats.views) + '</span></div>' +
      '<p class="muted small">Vistas vía ' + esc(stats.source) + ' · estimación orientativa.</p>';
    el.classList.remove("hidden");
  }

  function setMsg(el, text, kind) {
    el.textContent = text || "";
    el.className = "msg" + (kind ? " " + kind : "");
  }

  /* ---------- handlers ---------- */
  function runChannel() {
    var input = document.getElementById("channelUrl");
    var btn = document.getElementById("channelBtn");
    var msg = document.getElementById("channelMsg");
    var out = document.getElementById("channelResult");
    var parsed = parseChannel(input.value);
    out.classList.add("hidden");
    if (!parsed) { setMsg(msg, "Pega un enlace de canal válido (p. ej. youtube.com/@MrBeast).", "err"); return; }

    btn.disabled = true; setMsg(msg, "⏳ Consultando el canal…", "load");
    resolveChannel(parsed)
      .then(function (info) {
        return channelStats(info.id).then(function (stats) { return { info: info, stats: stats }; });
      })
      .then(function (r) {
        renderChannel(out, r.info, r.stats);
        setMsg(msg, "✅ Datos obtenidos.", "ok");
      })
      .catch(function (e) { setMsg(msg, "⚠️ " + (e && e.message ? e.message : "No se pudo obtener el canal."), "err"); })
      .finally(function () { btn.disabled = false; });
  }

  function runVideo() {
    var input = document.getElementById("videoUrl");
    var btn = document.getElementById("videoBtn");
    var msg = document.getElementById("videoMsg");
    var out = document.getElementById("videoResult");
    var id = extractVideoId(input.value);
    out.classList.add("hidden");
    if (!id) { setMsg(msg, "Pega un enlace de vídeo válido (youtube.com/watch?v=… o youtu.be/…).", "err"); return; }

    btn.disabled = true; setMsg(msg, "⏳ Consultando el vídeo…", "load");
    Promise.all([videoViews(id), videoMeta(id)])
      .then(function (r) { renderVideo(out, id, r[1], r[0]); setMsg(msg, "✅ Datos obtenidos.", "ok"); })
      .catch(function (e) { setMsg(msg, "⚠️ " + (e && e.message ? e.message : "No se pudo obtener el vídeo."), "err"); })
      .finally(function () { btn.disabled = false; });
  }

  function init() {
    updateRpmUsed();
    ["rpmLow", "rpmHigh"].forEach(function (idv) {
      var el = document.getElementById(idv);
      if (el) el.addEventListener("input", updateRpmUsed);
    });
    var cb = document.getElementById("channelBtn"), cu = document.getElementById("channelUrl");
    if (cb) cb.addEventListener("click", runChannel);
    if (cu) cu.addEventListener("keydown", function (e) { if (e.key === "Enter") runChannel(); });
    var vb = document.getElementById("videoBtn"), vu = document.getElementById("videoUrl");
    if (vb) vb.addEventListener("click", runVideo);
    if (vu) vu.addEventListener("keydown", function (e) { if (e.key === "Enter") runVideo(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
