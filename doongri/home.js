/* =====================================================================
   DOONGRI™ — Homepage-specific interactions (tiers, bundle, modal quiz)
   Depends on app.js (window.DOONGRI) and quiz.js (window.DoongriQuiz).
   ===================================================================== */
(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready(function () {
    const D = window.DOONGRI;
    const $ = D.$, $$ = D.$$, inr = D.inr, track = D.track;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- CTA pulse ---- */
    const pulseBtn = $(".btn--pulse");
    if (pulseBtn && !reduce) { pulseBtn.classList.add("is-pulsing"); setTimeout(() => pulseBtn.classList.remove("is-pulsing"), 4500); }

    /* ---- Hero parallax ---- */
    const parallax = $("[data-parallax]");
    if (parallax && !reduce) {
      window.addEventListener("scroll", () => {
        const r = parallax.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) parallax.style.transform = `translateY(${Math.max(-18, 18 - (window.innerHeight - r.top) * 0.04)}px)`;
      }, { passive: true });
    }

    /* ---- Subscription tiers ---- */
    const tiers = $$('input[name="tier"]');
    const planSummary = $("#planSummary");
    let buyOnce = false;
    const tierLabel = (v) => (D.TIERS[v] ? D.TIERS[v].label : v);
    const selectedTier = () => tiers.find((t) => t.checked) || tiers[0];

    function refreshPlan() {
      const t = selectedTier();
      $$(".tier").forEach((l) => l.classList.toggle("is-selected", l.contains(t)));
      const monthly = Number(t.dataset.monthly);
      D.currentTier = buyOnce ? null : t.value;
      if (buyOnce) { if (planSummary) planSummary.textContent = "One-time · " + inr(1999); D.setStickyPrice(inr(1999)); }
      else { if (planSummary) planSummary.textContent = tierLabel(t.value) + " · " + inr(monthly) + "/mo"; D.setStickyPrice(inr(monthly) + (t.value === "monthly" ? "" : "/mo")); }
    }
    tiers.forEach((t) => t.addEventListener("change", () => { refreshPlan(); track("subscription_tier_viewed", { tier: t.value, monthly: t.dataset.monthly }); }));

    const modeSub = $("#modeSub"), modeOnce = $("#modeOnce"), tiersWrap = $("#tiers");
    function setMode(once) {
      buyOnce = once;
      if (modeSub) { modeSub.classList.toggle("is-active", !once); modeSub.setAttribute("aria-selected", String(!once)); }
      if (modeOnce) { modeOnce.classList.toggle("is-active", once); modeOnce.setAttribute("aria-selected", String(once)); }
      if (tiersWrap) { tiersWrap.style.opacity = once ? "0.45" : "1"; tiersWrap.style.pointerEvents = once ? "none" : ""; }
      refreshPlan(); track("subscribe_selected", { mode: once ? "one_time" : "subscription" });
    }
    if (modeSub) modeSub.addEventListener("click", () => setMode(false));
    if (modeOnce) modeOnce.addEventListener("click", () => setMode(true));
    // Honor #tier deep-link (e.g. from the quiz: subscribe.html#annual)
    const hashTier = location.hash.replace("#", "");
    if (tiers.length && D.TIERS[hashTier]) { const r = tiers.find((t) => t.value === hashTier); if (r) r.checked = true; }
    if (tiers.length) refreshPlan();

    /* ---- Add kit (respects tier + mode) ---- */
    const addKit = $("#addKit");
    if (addKit) addKit.addEventListener("click", () => { D.addToCart("kit", buyOnce ? { once: true } : { tier: selectedTier().value }); D.openCart(); });

    /* ---- Bundle builder ---- */
    const chks = $$(".bundle-chk");
    const bIndividual = $("#bundleIndividual"), bSave = $("#bundleSave"), bNote = $("#bundleNote"), bAdd = $("#bundleAdd");
    function refreshBundle() {
      const checked = chks.filter((c) => c.checked);
      const sum = checked.reduce((s, c) => s + Number(c.dataset.price), 0);
      if (bIndividual) bIndividual.textContent = inr(sum);
      const all = checked.length === chks.length;
      if (all) { if (bSave) bSave.textContent = inr(Math.max(0, sum - 1999)); if (bNote) bNote.textContent = "All three selected — you unlock the full kit + Vaidya, Pathya, Yoga & lifestyle stack."; if (bAdd) bAdd.textContent = "Add Complete Kit →"; }
      else if (checked.length === 0) { if (bSave) bSave.textContent = inr(0); if (bNote) bNote.textContent = "Select components to build your ritual."; if (bAdd) bAdd.textContent = "Select a product"; }
      else { if (bSave) bSave.textContent = inr(0); if (bNote) bNote.textContent = "Add all three to unlock complete-the-kit pricing and the full Vaidya subscription stack."; if (bAdd) bAdd.textContent = "Add selected (" + checked.length + ") →"; }
    }
    chks.forEach((c) => c.addEventListener("change", () => { refreshBundle(); track("bundle_builder_interaction", { selected: chks.filter((x) => x.checked).length }); }));
    if (bAdd) bAdd.addEventListener("click", () => {
      const checked = chks.filter((c) => c.checked);
      if (!checked.length) return;
      if (checked.length === chks.length) D.addToCart("kit", { tier: "annual" });
      else checked.forEach((c) => { const map = { "899": "arshajit", "649": "regulex", "549": "sheetlep" }; D.addToCart(map[c.dataset.price]); });
      D.openCart();
    });
    if (chks.length) refreshBundle();

    /* ---- Modal quiz ---- */
    const quizModal = $("#quizModal"), quizStage = $("#quizStage"), quizBar = $("#quizBar");
    function openQuiz() {
      if (!quizModal) return;
      quizModal.classList.add("is-open"); quizModal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
      const close = $("#quizClose"); if (close) close.focus();
      window.DoongriQuiz.init({
        stage: quizStage, bar: quizBar,
        onApply(r) { const radio = tiers.find((t) => t.value === r.tier); if (radio) { radio.checked = true; setMode(false); refreshPlan(); } closeQuiz(); const sub = $("#subscribe"); if (sub) sub.scrollIntoView({ behavior: "smooth" }); D.showToast(r.name + " plan selected"); },
        onVaidya() { closeQuiz(); location.href = D.base + "about.html#vaidya"; },
      });
    }
    function closeQuiz() { if (!quizModal) return; quizModal.classList.remove("is-open"); quizModal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
    const openQuizBtn = $("#openQuiz"); if (openQuizBtn) openQuizBtn.addEventListener("click", openQuiz);
    const quizClose = $("#quizClose"); if (quizClose) quizClose.addEventListener("click", closeQuiz);
    $$(".concern-card").forEach((c) => c.addEventListener("click", openQuiz));
    document.addEventListener("doongri:esc", closeQuiz);
  });
})();
