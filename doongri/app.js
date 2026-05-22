/* =====================================================================
   DOONGRI™ — Shared app layer (chrome injection + cart + interactions)
   Loaded on every page. Exposes window.DOONGRI for page scripts.
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const inSub = location.pathname.includes("/products/");
  const base = inSub ? "../" : "";
  const page = (location.pathname.split("/").pop() || "index.html");

  /* -------------------- Analytics -------------------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, params = {}) {
    window.dataLayer.push({ event, ...params });
    if (window.console) console.debug("[analytics]", event, params);
  }

  /* -------------------- Data -------------------- */
  const TIERS = {
    annual:  { monthly: 1499, total: 17988, label: "Annual",      save: 6000 },
    semi:    { monthly: 1699, total: 10194, label: "Semi-Annual", save: 1800 },
    quarter: { monthly: 1799, total: 5397,  label: "Quarterly",   save: 600  },
    monthly: { monthly: 1999, total: 1999,  label: "Monthly",     save: 0    },
  };
  const CATALOG = {
    kit:      { name: "ARSHMUKT KIT™",  price: 1999, note: "3-in-1 + Vaidya stack" },
    arshajit: { name: "Arshajit Cap",    price: 899,  note: "60 caps · internal" },
    regulex:  { name: "Regulex Churna",  price: 649,  note: "100g · digestive" },
    sheetlep: { name: "Sheetlep Ointment", price: 549, note: "30g · external" },
  };

  const NAV = [
    { href: "kit.html", label: "Shop" },
    { href: "kit.html", label: "ARSHMUKT KIT™" },
    { href: "quiz.html", label: "Your Concern" },
    { href: "ingredients.html", label: "Ingredients" },
    { href: "kit.html#reviews", label: "Reviews" },
    { href: "about.html#vaidya", label: "Vaidya" },
    { href: "subscribe.html", label: "Subscribe" },
    { href: "about.html", label: "About" },
  ];
  const isActive = (href) => href.split("#")[0] === page || (page === "" && href.includes("index"));

  const brandSVG = '<svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M3 31 L13 14 L19 23 L26 9 L37 31 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="26" cy="9" r="2.4" fill="currentColor"/><path d="M3 31 H37" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  /* -------------------- Inject chrome -------------------- */
  function injectChrome() {
    // Announcement
    const announce = document.createElement("div");
    announce.className = "announce";
    announce.setAttribute("role", "region");
    announce.setAttribute("aria-label", "Brand promises");
    const promo = ["Discreet plain-box delivery", "AYUSH GMP certified manufacturing", "Free 15-min Vaidya consultation with every kit", "Batch-level COA — each batch tested", "Made in India · Classical Ayurveda"];
    announce.innerHTML = '<div class="announce__track">' + Array(2).fill(promo.map(p => `<span>${p}</span>`).join('<span class="announce__dot">•</span>')).join('<span class="announce__dot">•</span>') + "</div>";

    // Header
    const header = document.createElement("header");
    header.className = "header";
    header.id = "header";
    header.innerHTML = `
      <div class="container header__inner">
        <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="navMenu"><span></span><span></span><span></span></button>
        <a href="${base}index.html" class="brand" aria-label="DOONGRI home">${brandSVG}<span class="brand__name">DOONGRI<sup>™</sup></span></a>
        <nav class="nav" id="navMenu" aria-label="Primary">
          ${NAV.map(n => `<a href="${base}${n.href}"${isActive(n.href) ? ' aria-current="page" class="is-active"' : ''}>${n.label}</a>`).join("")}
        </nav>
        <div class="header__actions">
          <a href="${base}about.html#vaidya" class="header__vaidya" data-evt="vaidya_cta_click">Talk to a Vaidya</a>
          <button class="cart-btn" id="cartBtn" aria-label="Open cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 12H7L6 7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span class="cart-count" id="cartCount">0</span></button>
        </div>
      </div>`;
    const overlay = document.createElement("div");
    overlay.className = "nav-overlay"; overlay.id = "navOverlay"; overlay.hidden = true;

    document.body.prepend(header);
    document.body.prepend(announce);
    document.body.appendChild(overlay);

    // Sticky ATC (opt-in via body[data-sticky-atc])
    if (document.body.hasAttribute("data-sticky-atc")) {
      const name = document.body.getAttribute("data-atc-name") || "ARSHMUKT KIT™";
      const price = document.body.getAttribute("data-atc-price") || "From ₹1,499/mo";
      const atc = document.createElement("div");
      atc.className = "sticky-atc"; atc.id = "stickyAtc"; atc.setAttribute("aria-hidden", "true");
      atc.innerHTML = `
        <div class="sticky-atc__info"><span class="sticky-atc__name">${name}</span><span class="sticky-atc__price" id="stickyPrice">${price}</span></div>
        <div class="sticky-atc__actions">
          <a href="${base}subscribe.html" class="btn btn--outline btn--sm" data-evt="subscribe_selected">Subscribe &amp; Save</a>
          <button class="btn btn--gold btn--sm" id="stickyAdd" data-evt="sticky_atc_click">Add to Cart</button>
        </div>`;
      document.body.appendChild(atc);
    }

    // WhatsApp
    const wa = document.createElement("a");
    wa.className = "wa"; wa.id = "waBtn"; wa.href = "#"; wa.setAttribute("aria-label", "Chat with us on WhatsApp"); wa.setAttribute("data-evt", "whatsapp_cta_click");
    wa.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.6 1.8 6.5L4 29l7.2-1.9c1.8 1 3.8 1.5 5.9 1.5 7 0 12.5-5.5 12.5-12.5S23 3 16 3Z" fill="currentColor"/><path d="M12 9.5c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .5s-1.3 1.3-1.3 3.1 1.3 3.6 1.5 3.9c.2.3 2.6 4.1 6.4 5.6 3.1 1.2 3.8 1 4.5.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5s-2.2-1.1-2.6-1.2c-.3-.1-.6-.2-.8.2-.2.3-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1s-1.6-.6-3-1.9c-1.1-1-1.9-2.2-2.1-2.6-.2-.3 0-.5.2-.7l.5-.6c.2-.2.2-.4.4-.6.1-.2.1-.4 0-.6s-.8-2-1.1-2.7Z" fill="#fff"/></svg><span class="wa__label">Chat with us</span>';
    document.body.appendChild(wa);

    // Cart drawer + scrim
    const drawer = document.createElement("div");
    drawer.className = "drawer"; drawer.id = "cartDrawer"; drawer.setAttribute("aria-hidden", "true"); drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-label", "Your cart"); drawer.setAttribute("aria-modal", "true");
    drawer.innerHTML = `
      <div class="drawer__panel">
        <div class="drawer__head"><h3>Your Cart</h3><button class="drawer__close" id="cartClose" aria-label="Close cart">×</button></div>
        <ul class="drawer__items" id="cartItems"></ul>
        <div class="drawer__foot">
          <div class="drawer__total"><span>Subtotal</span><strong id="cartTotal">₹0</strong></div>
          <p class="drawer__trust">100% Secure · Easy Returns · AYUSH Certified · Discreet box</p>
          <button class="btn btn--gold btn--lg btn--block" data-evt="checkout_started">Checkout securely →</button>
          <p class="drawer__pay">UPI · Cards · NetBanking · COD · Razorpay / Cashfree</p>
        </div>
      </div>`;
    const scrim = document.createElement("div");
    scrim.className = "scrim"; scrim.id = "scrim"; scrim.hidden = true;
    document.body.appendChild(drawer);
    document.body.appendChild(scrim);

    // Footer
    const footer = document.createElement("footer");
    footer.className = "footer";
    footer.innerHTML = `
      <div class="container footer__grid">
        <div class="footer__brand">
          <a href="${base}index.html" class="brand brand--light" aria-label="DOONGRI home">${brandSVG}<span class="brand__name">DOONGRI<sup>™</sup></span></a>
          <p class="footer__tagline" lang="hi">प्राचीन ज्ञान × आधुनिक विज्ञान</p>
          <p class="footer__tagline">Ancient wisdom. Modern science.</p>
        </div>
        <nav class="footer__col" aria-label="Shop">
          <h4>Shop</h4>
          <a href="${base}kit.html">ARSHMUKT KIT™</a>
          <a href="${base}products/arshajit.html">Arshajit Cap</a>
          <a href="${base}products/regulex.html">Regulex Churna</a>
          <a href="${base}products/sheetlep.html">Sheetlep Ointment</a>
          <a href="${base}subscribe.html">Subscribe &amp; Save</a>
        </nav>
        <nav class="footer__col" aria-label="Learn">
          <h4>Learn</h4>
          <a href="${base}ingredients.html">Ingredients</a>
          <a href="${base}quiz.html">Your Concern</a>
          <a href="${base}about.html#vaidya">Meet a Vaidya</a>
          <a href="${base}blog.html">Journal</a>
          <a href="${base}about.html">About &amp; Trust</a>
        </nav>
        <div class="footer__col">
          <h4>Support</h4>
          <a href="mailto:support@doongri.com">support@doongri.com</a>
          <a href="#" data-evt="whatsapp_cta_click" data-wa>WhatsApp us</a>
          <a href="#">Shipping &amp; Returns</a>
          <a href="#">Privacy (DPDP 2023)</a>
          <a href="#">Track order</a>
        </div>
      </div>
      <div class="container footer__disclaimer">
        <p><strong>Disclaimer:</strong> DOONGRI™ products are Ayurvedic dietary/wellness formulations. Individual experiences may vary. Please consult a registered Vaidya before use. Not intended to diagnose, treat, cure, or prevent any disease. AYUSH approval: [Number] · For grievances: <a href="mailto:support@doongri.com">support@doongri.com</a></p>
        <p class="footer__legal">© <span id="year">2026</span> DOONGRI™. A consumer brand. All rights reserved. · Compliance: D&amp;MR Act 1954 (Schedule J) · ASCI Code · Consumer Protection Act 2019 · DPDP 2023.</p>
      </div>`;
    document.body.appendChild(footer);
  }

  /* -------------------- Cart (localStorage) -------------------- */
  const CART_KEY = "doongri_cart_v1";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} };

  let toastT;
  function showToast(msg) {
    const toast = $("#toast") || (() => { const t = document.createElement("div"); t.className = "toast"; t.id = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); return t; })();
    toast.textContent = msg; toast.classList.add("is-show");
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("is-show"), 2400);
  }

  function renderCart() {
    const cartCount = $("#cartCount"), cartItems = $("#cartItems"), cartTotal = $("#cartTotal");
    if (cartCount) { cartCount.textContent = String(cart.length); cartCount.style.visibility = cart.length ? "visible" : "hidden"; }
    if (!cartItems) return;
    if (!cart.length) {
      cartItems.innerHTML = `<li class="drawer__empty">Your cart is empty. <a href="${base}kit.html" style="color:var(--color-secondary);border-bottom:1.5px solid var(--color-accent)">Start your healing journey →</a></li>`;
    } else {
      cartItems.innerHTML = cart.map((it, i) => `
        <li class="drawer__item">
          <div class="drawer__item-info"><strong>${it.name}</strong><span>${it.note}</span></div>
          <span class="drawer__item-price">${inr(it.price)}</span>
          <button class="drawer__item-rm" data-rm="${i}" aria-label="Remove ${it.name}">Remove</button>
        </li>`).join("");
    }
    if (cartTotal) cartTotal.textContent = inr(cart.reduce((s, it) => s + it.price, 0));
  }

  function addToCart(key, opts = {}) {
    const base2 = CATALOG[key];
    if (!base2) return;
    const item = { ...base2 };
    if (key === "kit") {
      const t = opts.tier && TIERS[opts.tier] ? TIERS[opts.tier] : null;
      if (opts.once) { item.note = "One-time purchase"; item.price = 1999; }
      else if (t) { item.price = t.monthly; item.note = t.label + " subscription"; }
      else { item.price = TIERS.annual.monthly; item.note = "Annual subscription"; }
    }
    cart.push(item); saveCart(); renderCart();
    showToast(item.name + " added to cart");
    track("add_to_cart", { product: key, price: item.price });
  }

  let quizScrimLock = false;
  function openCart() { const d = $("#cartDrawer"), s = $("#scrim"); if (!d) return; d.classList.add("is-open"); s.hidden = false; requestAnimationFrame(() => s.classList.add("is-open")); d.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; const c = $("#cartClose"); if (c) c.focus(); }
  function closeCart() { const d = $("#cartDrawer"), s = $("#scrim"); if (!d) return; d.classList.remove("is-open"); s.classList.remove("is-open"); d.setAttribute("aria-hidden", "true"); if (!quizScrimLock) { document.body.style.overflow = ""; setTimeout(() => { s.hidden = true; }, 300); } }

  /* -------------------- Wire interactions -------------------- */
  function wire() {
    // delegated analytics
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-evt]");
      if (el) track(el.getAttribute("data-evt"), { label: (el.textContent || "").trim().slice(0, 40), product: el.dataset.product || undefined });
    });

    // year
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

    // header scroll + sticky atc
    const header = $("#header"), hero = $(".hero"), atc = $("#stickyAtc");
    const onScroll = () => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
      if (atc) { const past = window.scrollY > (hero ? hero.offsetHeight - 120 : 480); atc.classList.toggle("is-visible", past); atc.setAttribute("aria-hidden", past ? "false" : "true"); }
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // mobile nav
    const nav = $("#navMenu"), navToggle = $("#navToggle"), navOverlay = $("#navOverlay");
    function setNav(open) { if (!nav) return; nav.classList.toggle("is-open", open); navToggle.setAttribute("aria-expanded", String(open)); navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu"); navOverlay.hidden = !open; document.body.style.overflow = open ? "hidden" : ""; }
    if (navToggle) navToggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
    if (navOverlay) navOverlay.addEventListener("click", () => setNav(false));
    $$("#navMenu a").forEach((a) => a.addEventListener("click", () => setNav(false)));

    // cart
    const cartBtn = $("#cartBtn"), cartClose = $("#cartClose"), cartItems = $("#cartItems"), scrim = $("#scrim");
    if (cartBtn) cartBtn.addEventListener("click", openCart);
    if (cartClose) cartClose.addEventListener("click", closeCart);
    if (scrim) scrim.addEventListener("click", () => { closeCart(); document.dispatchEvent(new CustomEvent("doongri:scrim")); });
    if (cartItems) cartItems.addEventListener("click", (e) => { const rm = e.target.closest("[data-rm]"); if (rm) { cart.splice(Number(rm.dataset.rm), 1); saveCart(); renderCart(); } });

    // generic add-to-cart for [data-product] buttons (pages can opt out with data-noauto)
    $$('button[data-product]:not([data-noauto])').forEach((b) => b.addEventListener("click", () => { addToCart(b.dataset.product, { tier: b.dataset.tier }); openCart(); }));
    const stickyAdd = $("#stickyAdd"); if (stickyAdd) stickyAdd.addEventListener("click", () => { addToCart("kit", { tier: window.DOONGRI.currentTier || "annual" }); openCart(); });

    // whatsapp
    const waMsg = encodeURIComponent("Namaste! I'd like to know more about the ARSHMUKT KIT™ and a Vaidya consultation.");
    const openWA = (e) => { if (e) e.preventDefault(); window.open("https://wa.me/910000000000?text=" + waMsg, "_blank", "noopener"); };
    const waBtn = $("#waBtn"); if (waBtn) waBtn.addEventListener("click", openWA);
    $$("[data-wa]").forEach((a) => a.addEventListener("click", openWA));

    // esc
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); setNav(false); document.dispatchEvent(new CustomEvent("doongri:esc")); } });

    // scroll reveal
    const revealEls = $$(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealEls.forEach((el) => io.observe(el));
    } else { revealEls.forEach((el) => el.classList.add("is-in")); }

    // FAQ accordions: one open per group
    $$(".accordion").forEach((group) => {
      const accs = $$(".acc", group);
      accs.forEach((d) => d.addEventListener("toggle", () => { if (d.open) { accs.forEach((o) => { if (o !== d) o.open = false; }); track("faq_open", { q: $("summary", d).textContent.trim().slice(0, 40) }); } }));
    });

    // disclaimer tracking
    $$(".footer__disclaimer a").forEach((a) => a.addEventListener("click", () => track("disclaimer_link_click")));

    renderCart();
  }

  /* -------------------- Public API -------------------- */
  window.DOONGRI = {
    $, $$, inr, track, addToCart, openCart, closeCart, showToast,
    TIERS, CATALOG, base,
    currentTier: "annual",
    setStickyPrice(text) { const p = $("#stickyPrice"); if (p) p.textContent = text; },
    lockScrim(v) { quizScrimLock = v; },
  };

  /* -------------------- Boot -------------------- */
  function boot() { injectChrome(); wire(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
