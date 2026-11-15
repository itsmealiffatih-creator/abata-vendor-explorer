/* ============ Abata Vendor Explorer — app.js ============ */
(function () {
  "use strict";

  var D = window.ABATA_DATA;
  if (!D) {
    document.body.innerHTML =
      '<p style="font:16px system-ui;padding:40px">data.js belum ada. Jalankan ' +
      '<code>python build_site_data.py</code> dulu.</p>';
    return;
  }

  /* ---------- helpers ---------- */
  var nf = new Intl.NumberFormat("id-ID");
  var rp = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(v) { return v ? rp.format(v).replace(/\s/g, " ") : "—"; }

  function compact(v) {
    if (!v) return "—";
    if (v >= 1e9) return "Rp " + (v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace(".", ",") + " M";
    if (v >= 1e6) return "Rp " + Math.round(v / 1e6) + " jt";
    if (v >= 1e3) return "Rp " + Math.round(v / 1e3) + " rb";
    return "Rp " + nf.format(v);
  }

  function initials(name) {
    var parts = String(name).replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function waLink(num) {
    var d = String(num).replace(/\D/g, "");
    if (!d) return "";
    if (d.charAt(0) === "0") d = "62" + d.slice(1);
    else if (d.slice(0, 2) === "62") { /* keep */ }
    else if (d.charAt(0) === "8") d = "62" + d;
    return "https://wa.me/" + d;
  }

  var PALETTE = ["#2f6b5e", "#8a6516", "#7a4b6b", "#3d5a80", "#96603a",
                 "#4b6b3c", "#6b5b95", "#a04b3f"];
  var catOrder = D.categories.map(function (c) { return c.slug; });
  function catColor(cat) {
    var i = catOrder.indexOf(cat);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  }

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------- hero stats ---------- */
  (function stats() {
    var m = D.meta;
    var items = [
      [nf.format(m.vendors), "vendor"],
      [nf.format(m.packages), "paket / harga"],
      [nf.format(m.photos || 0), "foto vendor"],
      [m.categories, "kategori layanan"],
      ["550 – 350 jt", "rentang harga (Rp)"]
    ];
    $("#stats").innerHTML = items.map(function (it) {
      return '<div class="stat"><b>' + esc(it[0]) + "</b><span>" + esc(it[1]) + "</span></div>";
    }).join("");
    $("#stamp").textContent = m.scraped_at;
    document.title = "Abata Vendor Explorer — " + nf.format(m.vendors) +
      " vendor, " + nf.format(m.packages) + " paket";
  })();

  /* ---------- modal ---------- */
  var modal = $("#modal");
  var lastFocus = null;

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    document.getElementById("m-body").innerHTML = "";
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }

  modal.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  function openVendor(v) {
    lastFocus = document.activeElement;
    var prices = v.pkgs.map(function (p) { return p.p; }).filter(Boolean);
    var min = prices.length ? Math.min.apply(null, prices) : 0;
    var max = prices.length ? Math.max.apply(null, prices) : 0;

    var contact = [];
    v.tel.forEach(function (t) {
      contact.push('<a href="' + esc(waLink(t)) + '" target="_blank" rel="noopener">WA ' + esc(t) + "</a>");
    });
    v.mail.forEach(function (m) {
      contact.push('<a href="mailto:' + esc(m) + '">' + esc(m) + "</a>");
    });
    if (v.ig) contact.push('<a href="' + esc(v.ig) + '" target="_blank" rel="noopener">Instagram</a>');
    if (v.fb) contact.push('<a href="' + esc(v.fb) + '" target="_blank" rel="noopener">Facebook</a>');
    if (v.tt) contact.push('<a href="' + esc(v.tt) + '" target="_blank" rel="noopener">TikTok</a>');
    if (v.web) contact.push('<a href="' + esc(v.web) + '" target="_blank" rel="noopener">Website</a>');
    contact.push('<a href="' + esc(v.url) + '" target="_blank" rel="noopener">Halaman asli ↗</a>');

    var pkgs = v.pkgs.slice().sort(function (a, b) {
      if (a.p && b.p) return a.p - b.p;
      return a.p ? -1 : b.p ? 1 : 0;
    });

    var pkgHtml = pkgs.length ? pkgs.map(function (p, i) {
      return '<div class="pkg" data-pkg="' + i + '">' +
        '<div class="pkg-name">' + esc(p.n) +
        (p.p ? "" : ' <small>harga menyesuaikan</small>') + "</div>" +
        '<div class="pkg-price">' + (p.p ? esc(money(p.p)) : "—") +
        (p.po && p.po !== p.p ? "<s>" + esc(money(p.po)) + "</s>" : "") + "</div>" +
        '<div class="pkg-more">' +
          (p.d ? '<button type="button" data-i="' + i + '" aria-label="Lihat deskripsi">+</button>' : "") +
        "</div>" +
        (p.d ? '<div class="pkg-desc" id="pdi-' + i + '" hidden><p>' + esc(p.d) + "</p></div>" : "") +
        "</div>";
    }).join("") : '<p style="padding:8px 34px;color:var(--muted);font-size:13px">' +
        "Vendor ini belum mencantumkan daftar harga.</p>";

    document.getElementById("m-body").innerHTML =
      (v.img ? '<div class="m-hero"><img src="' + esc(v.img) + '" alt="Foto ' + esc(v.name) + '"></div>' : "") +
      '<div class="m-head">' +
        '<span class="badge">' + esc(v.cat) + "</span>" +
        "<h2>" + esc(v.name) + "</h2>" +
        '<div class="m-meta">' +
          "<span>" + esc(v.pkgs.length + " paket") + "</span>" +
          (min ? "<span>· " + esc(money(min)) + " – " + esc(money(max)) + "</span>" : "") +
        "</div>" +
        (contact.length ? '<div class="m-contact">' + contact.join("") + "</div>" : "") +
      "</div>" +
      (v.desc ? '<div class="m-desc">' + esc(v.desc) + "</div>" : "") +
      '<div class="m-pkgs"><h3>Daftar paket &amp; harga</h3>' + pkgHtml + "</div>";

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-panel").scrollTop = 0;
    var first = modal.querySelector(".modal-x");
    if (first) first.focus();
  }

  modal.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".pkg-more button") : null;
    if (!btn) return;
    var id = btn.getAttribute("data-i");
    var block = document.getElementById("pdi-" + id);
    if (block) {
      block.hidden = !block.hidden;
      btn.textContent = block.hidden ? "+" : "−";
      btn.setAttribute("aria-expanded", String(!block.hidden));
    }
  });

  /* ---------- vendor view ---------- */
  var state = { q: "", cat: "all", sort: "name", shown: 48 };
  var PAGE = 48;

  function vendorMin(v) {
    var ps = v.pkgs.map(function (p) { return p.p; }).filter(Boolean);
    return ps.length ? Math.min.apply(null, ps) : Infinity;
  }

  function filtered() {
    var q = state.q.toLowerCase();
    var list = D.vendors.filter(function (v) {
      if (state.cat !== "all" && v.cat !== state.cat) return false;
      if (!q) return true;
      return (v.name + " " + v.cat + " " + v.desc).toLowerCase().indexOf(q) > -1;
    });
    var sort = state.sort;
    list.sort(function (a, b) {
      if (sort === "price-asc") return vendorMin(a) - vendorMin(b);
      if (sort === "price-desc") {
        var pa = vendorMin(a), pb = vendorMin(b);
        if (pa === Infinity) return 1;
        if (pb === Infinity) return -1;
        return pb - pa;
      }
      if (sort === "pkgs") return b.pkgs.length - a.pkgs.length;
      if (sort === "cat") return a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name, "id");
    });
    return list;
  }

  function cardHtml(v) {
    var min = vendorMin(v);
    var prices = v.pkgs.map(function (p) { return p.p; }).filter(Boolean);
    var max = prices.length ? Math.max.apply(null, prices) : 0;
    var priceTxt = prices.length
      ? esc(money(min)) + (max !== min ? " – " + esc(money(max)) : "")
      : "Harga belum dicantumkan";
    var links = [];
    if (v.ig) links.push('<a href="' + esc(v.ig) + '" target="_blank" rel="noopener">Instagram</a>');
    if (v.tel.length) links.push('<a href="' + esc(waLink(v.tel[0])) + '" target="_blank" rel="noopener">WhatsApp</a>');
    var top = v.img
      ? '<div class="card-top"><div><span class="badge">' + esc(v.cat) + "</span><h3>" +
        esc(v.name) + "</h3></div></div>"
      : '<div class="card-top"><div class="avatar" style="background:' + catColor(v.cat) + '">' +
        esc(initials(v.name)) + '</div><div><span class="badge">' + esc(v.cat) +
        "</span><h3>" + esc(v.name) + "</h3></div></div>";
    return '<article class="card" tabindex="0" role="button" data-id="' + v.id + '" aria-label="' +
      esc(v.name) + '">' +
      (v.img ? '<div class="thumb"><img src="' + esc(v.img) + '" alt="Foto ' + esc(v.name) +
        '" loading="lazy" decoding="async"></div>' : "") +
      '<div class="card-body">' + top +
      (v.desc ? '<p class="desc">' + esc(v.desc) + "</p>" : "") +
      '<div class="price"><b>' + priceTxt + "</b><small>" + esc(v.pkgs.length) + " paket</small></div>" +
      '<div class="links">' + links.join("") + '<span class="open">Lihat →</span></div>' +
      "</div></article>";
  }

  function render() {
    var list = filtered();
    var slice = list.slice(0, state.shown);
    $("#grid").innerHTML = slice.map(cardHtml).join("");
    $("#count").innerHTML = list.length
      ? "<strong>" + nf.format(list.length) + "</strong> vendor" +
        (state.cat !== "all" ? " di <strong>" + esc(state.cat) + "</strong>" : "") +
        " · menampilkan " + nf.format(slice.length)
      : "";
    $("#empty").hidden = list.length > 0;
    $("#more").hidden = list.length <= state.shown;
    $("#hint").textContent = list.length ? "Klik kartu untuk melihat paket & kontak." : "";
  }

  $("#grid").addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (!card) return;
    if (e.target.closest("a")) return;   // biarkan tautan
    var v = D.vendors.find(function (x) { return String(x.id) === card.getAttribute("data-id"); });
    if (v) openVendor(v);
  });
  $("#grid").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    card.click();
  });

  $("#more").addEventListener("click", function () {
    state.shown += PAGE;
    render();
  });

  $("#q").addEventListener("input", function (e) {
    state.q = e.target.value.trim();
    state.shown = PAGE;
    render();
  });
  $("#sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    state.shown = PAGE;
    render();
  });
  $("#reset").addEventListener("click", function () {
    state = { q: "", cat: "all", sort: "name", shown: PAGE };
    $("#q").value = "";
    $("#sort").value = "name";
    renderChips();
    render();
  });

  function renderChips() {
    var chips = ['<button class="chip' + (state.cat === "all" ? " is-active" : "") +
      '" data-cat="all" type="button">Semua<em>' + nf.format(D.vendors.length) + "</em></button>"];
    D.categories.forEach(function (c) {
      chips.push('<button class="chip' + (state.cat === c.slug ? " is-active" : "") +
        '" data-cat="' + esc(c.slug) + '" type="button">' + esc(c.slug) +
        "<em>" + nf.format(c.n) + "</em></button>");
    });
    $("#chips").innerHTML = chips.join("");
  }

  $("#chips").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    state.cat = chip.getAttribute("data-cat");
    state.shown = PAGE;
    renderChips();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- package view ---------- */
  var flat = [];
  D.vendors.forEach(function (v) {
    v.pkgs.forEach(function (p) {
      flat.push({ v: v, p: p });
    });
  });

  var st2 = { q: "", cat: "all", sort: "price-asc", shown: 100 };
  var PAGE2 = 100;

  (function initCat2() {
    $("#cat2").insertAdjacentHTML("beforeend", D.categories.map(function (c) {
      return '<option value="' + esc(c.slug) + '">' + esc(c.slug) + " (" + c.n + ")</option>";
    }).join(""));
  })();

  function pFiltered() {
    var q = st2.q.toLowerCase();
    var list = flat.filter(function (r) {
      if (st2.cat !== "all" && r.v.cat !== st2.cat) return false;
      if (!q) return true;
      return (r.p.n + " " + r.v.name + " " + r.v.cat).toLowerCase().indexOf(q) > -1;
    });
    list.sort(function (a, b) {
      if (st2.sort === "price-asc") {
        if (a.p.p && b.p.p) return a.p.p - b.p.p;
        return a.p.p ? -1 : b.p.p ? 1 : 0;
      }
      if (st2.sort === "price-desc") {
        if (a.p.p && b.p.p) return b.p.p - a.p.p;
        return a.p.p ? -1 : b.p.p ? 1 : 0;
      }
      return a.p.n.localeCompare(b.p.n, "id");
    });
    return list;
  }

  function pRender() {
    var list = pFiltered();
    var slice = list.slice(0, st2.shown);
    $("#ptbody").innerHTML = slice.map(function (r) {
      var desc = r.p.d ? '<span title="' + esc(r.p.d) + '">' + esc(r.p.d) + "</span>" : "";
      return "<tr data-id=\"" + r.v.id + "\">" +
        '<td><span class="tag">' + esc(r.v.cat) + "</span></td>" +
        "<td>" + esc(r.v.name) + "</td>" +
        "<td>" + esc(r.p.n) + "</td>" +
        '<td class="num price">' + (r.p.p ? esc(money(r.p.p)) : "—") + "</td>" +
        '<td class="num old">' + (r.p.po && r.p.po !== r.p.p ? esc(money(r.p.po)) : "") + "</td>" +
        '<td class="desc">' + desc + "</td>" +
        "</tr>";
    }).join("");
    $("#count2").innerHTML = list.length
      ? "<strong>" + nf.format(list.length) + "</strong> paket · menampilkan " + nf.format(slice.length)
      : "";
    $("#empty2").hidden = list.length > 0;
    $("#more2").hidden = list.length <= st2.shown;
  }

  $("#ptbody").addEventListener("click", function (e) {
    var tr = e.target.closest("tr");
    if (!tr) return;
    var v = D.vendors.find(function (x) { return String(x.id) === tr.getAttribute("data-id"); });
    if (v) openVendor(v);
  });
  $("#more2").addEventListener("click", function () {
    st2.shown += PAGE2;
    pRender();
  });
  $("#q2").addEventListener("input", function (e) {
    st2.q = e.target.value.trim();
    st2.shown = PAGE2;
    pRender();
  });
  $("#cat2").addEventListener("change", function (e) {
    st2.cat = e.target.value;
    st2.shown = PAGE2;
    pRender();
  });
  $("#sort2").addEventListener("change", function (e) {
    st2.sort = e.target.value;
    st2.shown = PAGE2;
    pRender();
  });

  /* ---------- tab switching ---------- */
  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var view = tab.getAttribute("data-view");
      $$(".tab").forEach(function (t) { t.classList.toggle("is-active", t === tab); });
      $("#view-vendors").hidden = view !== "vendors";
      $("#view-packages").hidden = view !== "packages";
      if (view === "packages" && !$("#ptbody").children.length) pRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ---------- gallery ---------- */
  (function gallery() {
    var g = D.gallery || [];
    if (!g.length) return;
    $("#galstrip").innerHTML = g.map(function (src) {
      return '<img src="' + esc(src) + '" alt="Galeri Abata Wedding Organizer" loading="lazy">';
    }).join("");
    $("#gallery").hidden = false;
  })();

  /* ---------- boot ---------- */
  renderChips();
  render();
})();
