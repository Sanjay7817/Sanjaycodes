/* =====================================================================
   DOONGRI™ — Homepage interactions
   Vanilla JS, no dependencies.
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

  /* -------------------- Analytics (GA4 / dataLayer ready) -------------------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, params = {}) {
    window.dataLayer.push({ event, ...params });
    if (window.console) console.debug("[analytics]", event, params);
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-evt]");
    if (el) track(el.getAttribute("data-evt"), { label: (el.textContent || "").trim().slice(0, 40), product: el.dataset.product || undefined });
  });

  /* -------------------- Toast -------------------- */
  const toast = $("#toast");
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-show"), 2400);
  }

  /* -------------------- Year -------------------- */
  $("#year").textContent = new Date().getFullYear();

  /* -------------------- Header scroll state -------------------- */
  const header = $("#header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    // sticky ATC visibility (mobile only; CSS hides >=900px)
    const hero = $("#hero");
    const past = window.scrollY > (hero ? hero.offsetHeight - 120 : 400);
    const atc = $("#stickyAtc");
    atc.classList.toggle("is-visible", past);
    atc.setAttribute("aria-hidden", past ? "false" : "true");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------- Mobile nav -------------------- */
  const nav = $("#navMenu"), navToggle = $("#navToggle"), navOverlay = $("#navOverlay");
  function setNav(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    navOverlay.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }
  navToggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  navOverlay.addEventListener("click", () => setNav(false));
  $$("#navMenu a").forEach((a) => a.addEventListener("click", () => setNav(false)));

  /* -------------------- Hero CTA pulse (3x then stop) -------------------- */
  const pulseBtn = $(".btn--pulse");
  if (pulseBtn && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pulseBtn.classList.add("is-pulsing");
    setTimeout(() => pulseBtn.classList.remove("is-pulsing"), 4500);
  }

  /* -------------------- Hero parallax -------------------- */
  const parallax = $("[data-parallax]");
  if (parallax && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("scroll", () => {
      const r = parallax.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const offset = (window.innerHeight - r.top) * 0.04;
        parallax.style.transform = `translateY(${Math.max(-18, 18 - offset)}px)`;
      }
    }, { passive: true });
  }

  /* -------------------- Subscription tiers -------------------- */
  const tiers = $$('input[name="tier"]');
  const planSummary = $("#planSummary");
  const stickyPrice = $("#stickyPrice");
  let buyOnce = false;

  const tierLabel = (v) => ({ annual: "Annual", semi: "Semi-Annual", quarter: "Quarterly", monthly: "Monthly" }[v] || v);

  function selectedTier() { return tiers.find((t) => t.checked) || tiers[tiers.length - 1]; }

  function refreshPlan() {
    const t = selectedTier();
    $$(".tier").forEach((l) => l.classList.toggle("is-selected", l.contains(t)));
    const monthly = Number(t.dataset.monthly);
    if (buyOnce) {
      planSummary.textContent = "One-time · " + inr(1999);
      stickyPrice.textContent = inr(1999);
    } else {
      planSummary.textContent = tierLabel(t.value) + " · " + inr(monthly) + "/mo";
      stickyPrice.textContent = inr(monthly) + (t.value === "monthly" ? "" : "/mo");
    }
  }
  tiers.forEach((t) => t.addEventListener("change", () => {
    refreshPlan();
    track("subscription_tier_viewed", { tier: t.value, monthly: t.dataset.monthly });
  }));

  // plan mode toggle
  const modeSub = $("#modeSub"), modeOnce = $("#modeOnce"), tiersWrap = $("#tiers");
  function setMode(once) {
    buyOnce = once;
    modeSub.classList.toggle("is-active", !once);
    modeOnce.classList.toggle("is-active", once);
    modeSub.setAttribute("aria-selected", String(!once));
    modeOnce.setAttribute("aria-selected", String(once));
    tiersWrap.style.opacity = once ? "0.45" : "1";
    tiersWrap.style.pointerEvents = once ? "none" : "";
    refreshPlan();
    track("subscribe_selected", { mode: once ? "one_time" : "subscription" });
  }
  modeSub.addEventListener("click", () => setMode(false));
  modeOnce.addEventListener("click", () => setMode(true));
  refreshPlan();

  /* -------------------- Cart -------------------- */
  const CATALOG = {
    kit: { name: "ARSHMUKT KIT™", price: 1999, note: "3-in-1 + Vaidya stack" },
    arshajit: { name: "Arshajit Cap", price: 899, note: "60 caps · internal" },
    regulex: { name: "Regulex Churna", price: 649, note: "100g · digestive" },
    sheetlep: { name: "Sheetlep Ointment", price: 549, note: "30g · external" },
  };
  const cart = [];
  const cartCount = $("#cartCount"), cartItems = $("#cartItems"), cartTotal = $("#cartTotal");
  const drawer = $("#cartDrawer"), scrim = $("#scrim");

  function openDrawer() { drawer.classList.add("is-open"); scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add("is-open")); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; $("#cartClose").focus(); }
  function closeDrawer() { drawer.classList.remove("is-open"); scrim.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; setTimeout(() => { if (!quizOpen) scrim.hidden = true; }, 300); }

  function renderCart() {
    cartCount.textContent = String(cart.length);
    cartCount.style.visibility = cart.length ? "visible" : "hidden";
    if (!cart.length) {
      cartItems.innerHTML = '<li class="drawer__empty">Your cart is empty. Start your healing journey →</li>';
      cartTotal.textContent = inr(0);
      return;
    }
    cartItems.innerHTML = cart.map((it, i) => `
      <li class="drawer__item">
        <div class="drawer__item-info"><strong>${it.name}</strong><span>${it.note}</span></div>
        <span class="drawer__item-price">${inr(it.price)}</span>
        <button class="drawer__item-rm" data-rm="${i}" aria-label="Remove ${it.name}">Remove</button>
      </li>`).join("");
    cartTotal.textContent = inr(cart.reduce((s, it) => s + it.price, 0));
  }
  cartItems.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) { cart.splice(Number(rm.dataset.rm), 1); renderCart(); }
  });

  function addToCart(key, opts = {}) {
    const base = CATALOG[key];
    if (!base) return;
    let item = { ...base };
    if (key === "kit" && !buyOnce && opts.tier) {
      const t = tiers.find((x) => x.value === opts.tier);
      item.price = Number(t.dataset.monthly);
      item.note = tierLabel(opts.tier) + " subscription";
    } else if (key === "kit") {
      item.note = buyOnce ? "One-time purchase" : (tierLabel(selectedTier().value) + " subscription");
      item.price = buyOnce ? 1999 : Number(selectedTier().dataset.monthly);
    }
    cart.push(item);
    renderCart();
    showToast(item.name + " added to cart");
    track("add_to_cart", { product: key, price: item.price });
  }

  // Add-to-cart buttons
  $$('[data-product]').forEach((btn) => {
    if (btn.tagName !== "BUTTON") return;
    btn.addEventListener("click", () => { addToCart(btn.dataset.product); openDrawer(); });
  });
  $("#cartBtn").addEventListener("click", openDrawer);
  $("#cartClose").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", () => { closeDrawer(); closeQuiz(); });
  renderCart();

  /* -------------------- Bundle builder -------------------- */
  const chks = $$(".bundle-chk");
  const bIndividual = $("#bundleIndividual"), bSave = $("#bundleSave"), bNote = $("#bundleNote"), bAdd = $("#bundleAdd");
  function refreshBundle() {
    const checked = chks.filter((c) => c.checked);
    const sum = checked.reduce((s, c) => s + Number(c.dataset.price), 0);
    bIndividual.textContent = inr(sum);
    const all = checked.length === chks.length;
    const kitPrice = 1999;
    if (all) {
      bSave.textContent = inr(Math.max(0, sum - kitPrice));
      bNote.textContent = "All three selected — you unlock the full kit + Vaidya, Pathya, Yoga & lifestyle stack.";
      bAdd.textContent = "Add Complete Kit →";
      bAdd.dataset.product = "kit";
    } else if (checked.length === 0) {
      bSave.textContent = inr(0);
      bNote.textContent = "Select components to build your ritual.";
      bAdd.textContent = "Select a product";
    } else {
      bSave.textContent = inr(0);
      bNote.textContent = "Add all three to unlock complete-the-kit pricing and the full Vaidya subscription stack.";
      bAdd.textContent = "Add selected (" + checked.length + ") →";
      bAdd.removeAttribute("data-product");
    }
  }
  chks.forEach((c) => c.addEventListener("change", () => { refreshBundle(); track("bundle_builder_interaction", { selected: chks.filter(x => x.checked).length }); }));
  bAdd.addEventListener("click", () => {
    const checked = chks.filter((c) => c.checked);
    if (!checked.length) return;
    if (checked.length === chks.length) addToCart("kit");
    else checked.forEach((c) => { const map = { "899": "arshajit", "649": "regulex", "549": "sheetlep" }; addToCart(map[c.dataset.price]); });
    openDrawer();
  });
  refreshBundle();

  /* -------------------- Quiz -------------------- */
  const quizModal = $("#quizModal"), quizStage = $("#quizStage"), quizBar = $("#quizBar");
  let quizOpen = false, quizStep = 0;
  const answers = {};
  const STEPS = [
    { key: "concern", q: "What brings you here today?", opts: ["Occasional discomfort", "Recurring / chronic concern", "Digestive irregularity", "Preventive wellness"] },
    { key: "severity", q: "How would you describe it right now?", opts: ["Mild & recent", "Moderate, comes & goes", "Persistent for months"] },
    { key: "lifestyle", q: "Your typical day is mostly…", opts: ["Desk-bound / sedentary", "On the move", "Mixed"] },
    { key: "diet", q: "How fibre-rich is your diet?", opts: ["Low fibre, irregular meals", "Moderate", "High fibre & regular"] },
    { key: "duration", q: "How committed do you want to be?", opts: ["Try one month", "A focused 3-month reset", "A 6-month journey", "A full year of care"] },
  ];
  function recommend() {
    const d = answers.duration || "";
    if (d.includes("year")) return { tier: "annual", name: "Annual", price: "₹1,499/mo", save: "Save ₹6,000/year" };
    if (d.includes("6-month")) return { tier: "semi", name: "Semi-Annual", price: "₹1,699/mo", save: "Save ₹1,800" };
    if (d.includes("3-month")) return { tier: "quarter", name: "Quarterly", price: "₹1,799/mo", save: "Save ₹600" };
    return { tier: "monthly", name: "Monthly", price: "₹1,999/mo", save: "Flexible start" };
  }
  function renderQuiz() {
    quizBar.style.width = ((quizStep) / STEPS.length * 100) + "%";
    if (quizStep < STEPS.length) {
      const s = STEPS[quizStep];
      quizStage.innerHTML = `
        <div class="quiz__step quiz__slide-in">
          <span class="quiz__count">Step ${quizStep + 1} of ${STEPS.length}</span>
          <h3 id="quizQ">${s.q}</h3>
          <div class="quiz__options" role="group" aria-labelledby="quizQ">
            ${s.opts.map((o) => `<button class="quiz__opt" data-opt="${o}">${o}</button>`).join("")}
          </div>
        </div>`;
      $$(".quiz__opt", quizStage).forEach((b) => b.addEventListener("click", () => {
        answers[s.key] = b.dataset.opt;
        quizStep++;
        if (quizStep >= STEPS.length) { track("quiz_completed", answers); }
        renderQuiz();
      }));
    } else {
      quizBar.style.width = "100%";
      const r = recommend();
      track("quiz_recommendation_shown", { tier: r.tier });
      quizStage.innerHTML = `
        <div class="quiz__result quiz__slide-in">
          <span class="quiz__result-badge">Your recommended journey</span>
          <span class="tier__leaf" aria-hidden="true" style="font-size:34px">🌿</span>
          <span class="tier__name">${r.name} ARSHMUKT KIT™</span>
          <p class="tier__price"><strong>${r.price}</strong></p>
          <p class="tier__save" style="color:var(--color-accent)">${r.save}</p>
          <p class="lede" style="font-size:16px">Based on your answers, this tier fits your routine best — and includes a free 15-minute Vaidya pre-consultation.</p>
          <div class="hero__cta center" style="margin-top:18px;justify-content:center">
            <button class="btn btn--gold btn--lg" id="quizApply">Choose this plan →</button>
            <button class="btn btn--ghost" id="quizVaidya">Book free Vaidya call</button>
          </div>
        </div>`;
      $("#quizApply").addEventListener("click", () => {
        const radio = tiers.find((t) => t.value === r.tier);
        if (radio) { radio.checked = true; setMode(false); refreshPlan(); }
        closeQuiz();
        $("#subscribe").scrollIntoView({ behavior: "smooth" });
        showToast(r.name + " plan selected");
      });
      $("#quizVaidya").addEventListener("click", () => { closeQuiz(); $("#vaidya").scrollIntoView({ behavior: "smooth" }); track("vaidya_cta_click", { source: "quiz" }); });
    }
  }
  function openQuiz() { quizOpen = true; quizStep = 0; quizModal.classList.add("is-open"); quizModal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; renderQuiz(); $("#quizClose").focus(); track("quiz_started"); }
  function closeQuiz() { quizOpen = false; quizModal.classList.remove("is-open"); quizModal.setAttribute("aria-hidden", "true"); if (!drawer.classList.contains("is-open")) document.body.style.overflow = ""; }
  $("#openQuiz").addEventListener("click", openQuiz);
  $("#quizClose").addEventListener("click", closeQuiz);

  // Concern path cards jump into quiz
  $$(".concern-card").forEach((c) => c.addEventListener("click", () => { openQuiz(); }));

  /* -------------------- WhatsApp + esc -------------------- */
  const waMsg = encodeURIComponent("Namaste! I'd like to know more about the ARSHMUKT KIT™ and a Vaidya consultation.");
  $("#waBtn").addEventListener("click", (e) => { e.preventDefault(); window.open("https://wa.me/910000000000?text=" + waMsg, "_blank", "noopener"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); closeQuiz(); setNav(false); }
  });

  /* -------------------- Scroll reveal -------------------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* -------------------- FAQ: one open at a time + analytics -------------------- */
  const accs = $$("#faq .acc");
  accs.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) { accs.forEach((o) => { if (o !== d) o.open = false; }); track("faq_open", { q: $("summary", d).textContent.trim().slice(0, 40) }); }
  }));

  // disclaimer link tracking
  $$('.footer__disclaimer a').forEach((a) => a.addEventListener("click", () => track("disclaimer_link_click")));
})();
