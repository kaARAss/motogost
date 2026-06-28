/* МотоГОСТ — лёгкий загрузчик контента из /content/*.json.
   Если файлы не загрузились или поля пустые — на сайте остаётся
   исходный текст/картинки (значения служат запасными). */
(function () {
  "use strict";
  var FILES = ["season", "hero", "about", "services", "contacts", "gallery", "how"];
  var SVC_VARS = ["--svc-pit", "--svc-end", "--svc-instr", "--svc-gid"];
  var data = {};

  function get(path) {
    var parts = String(path).split(".");
    var cur = data;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function setImg(varName, url) {
    if (url) document.documentElement.style.setProperty(varName, "url(" + url + ")");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Безопасное выделение жирным: **текст** -> <b>текст</b> (после экранирования)
  function inlineFmt(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  }

  function applyText() {
    document.querySelectorAll("[data-cms]").forEach(function (el) {
      var v = get(el.getAttribute("data-cms"));
      if (v != null && v !== "") el.textContent = v;
    });
    document.querySelectorAll("[data-cms-href]").forEach(function (el) {
      var v = get(el.getAttribute("data-cms-href"));
      if (v) el.setAttribute("href", v);
    });
  }

  function applyImages() {
    if (data.hero && data.hero.image) setImg("--hero", data.hero.image);
    if (data.hero && data.hero.imageMobile) setImg("--hero-m", data.hero.imageMobile);
    var g = data.gallery && data.gallery.images;
    if (Array.isArray(g)) {
      g.forEach(function (url, i) { setImg("--gp" + (i + 1), url); });
    }
    if (data.about && data.about.image) setImg("--ph-about", data.about.image);
    var items = data.services && data.services.items;
    if (Array.isArray(items)) {
      items.forEach(function (it, i) {
        if (it && it.image && SVC_VARS[i]) setImg(SVC_VARS[i], it.image);
      });
    }
    if (data.how && Array.isArray(data.how.cards)) {
      var hc = data.how.cards;
      if (hc[0] && hc[0].image) setImg("--how0", hc[0].image);
      if (hc[1] && hc[1].image) setImg("--how1", hc[1].image);
    }
  }

  // Подробное описание услуг (вводный абзац + пункты) в окне «Подробнее».
  function applyServiceDetails() {
    var items = data.services && data.services.items;
    if (!Array.isArray(items)) return;
    var cards = document.querySelectorAll("#tours .svc-cards .tour");
    items.forEach(function (it, i) {
      var card = cards[i];
      if (!card || !it) return;
      var body = card.querySelector(".t-detail-body");
      if (!body) return;
      var hasIntro = it.intro != null && String(it.intro).trim() !== "";
      var list = Array.isArray(it.details) ? it.details.filter(function (x) {
        return x != null && String(x).trim() !== "";
      }) : [];
      if (!hasIntro && !list.length) return; // нет данных — оставляем исходный текст
      var html = "";
      if (hasIntro) html += "<p>" + inlineFmt(it.intro) + "</p>";
      if (list.length) {
        html += "<ul>";
        list.forEach(function (li) { html += "<li>" + inlineFmt(li) + "</li>"; });
        html += "</ul>";
      }
      body.innerHTML = html;
    });
  }

  function applySeason() {
    var el = document.getElementById("seasonBanner");
    var s = data.season;
    if (!el) return;
    if (s && s.enabled) {
      el.innerHTML =
        '<div class="season-inner"><span class="season-ic">' + esc(s.icon || "\u2744\uFE0F") +
        '</span><div class="season-tx"><b>' + esc(s.title || "") +
        '</b><p>' + esc(s.text || "") + "</p></div></div>";
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  function applyHow() {
    var hd = data.how;
    if (!hd || !Array.isArray(hd.cards)) return;
    var cards = document.querySelectorAll("#how .fmt-cards .fmt-card");
    hd.cards.forEach(function (c, i) {
      var card = cards[i];
      if (!card || !c) return;
      var steps = Array.isArray(c.steps) ? c.steps.filter(function (s) {
        return s && ((s.label != null && String(s.label).trim() !== "") || (s.text != null && String(s.text).trim() !== ""));
      }) : [];
      if (!steps.length) return;
      var ul = card.querySelector(".fmt-steps");
      if (!ul) return;
      var html = "";
      steps.forEach(function (s) {
        html += "<li><span>" + esc(s.label) + "</span><b>" + esc(s.text) + "</b></li>";
      });
      ul.innerHTML = html;
    });
  }

  function render() {
    try { applyText(); } catch (e) {}
    try { applyImages(); } catch (e) {}
    try { applyServiceDetails(); } catch (e) {}
    try { applyHow(); } catch (e) {}
    try { applySeason(); } catch (e) {}
  }

  function load() {
    var pending = FILES.length;
    FILES.forEach(function (name) {
      fetch("content/" + name + ".json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j) data[name] = j; })
        .catch(function () {})
        .then(function () { if (--pending === 0) render(); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
