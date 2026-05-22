/* =====================================================================
   DOONGRI™ — PDP buy box (tier selector + add to cart). For kit.html.
   ===================================================================== */
(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready(function () {
    const D = window.DOONGRI; if (!D) return;
    const $ = D.$, $$ = D.$$, inr = D.inr, track = D.track;
    const buy = $(".pdp__buy"); if (!buy) return;
    const tiers = $$('input[name="tier"]', buy);
    const priceEl = $("#pdpPrice");
    const modeSub = $("#pdpModeSub"), modeOnce = $("#pdpModeOnce"), tiersWrap = $(".tiers", buy);
    let buyOnce = false;
    const selected = () => tiers.find((t) => t.checked) || tiers[0];

    function refresh() {
      const t = selected();
      $$(".tier", buy).forEach((l) => l.classList.toggle("is-selected", l.contains(t)));
      const m = Number(t.dataset.monthly);
      D.currentTier = buyOnce ? null : t.value;
      if (buyOnce) { if (priceEl) priceEl.innerHTML = "₹1,999 <small>one-time</small>"; D.setStickyPrice("₹1,999"); }
      else { if (priceEl) priceEl.innerHTML = inr(m) + " <small>/mo · " + D.TIERS[t.value].label + "</small>"; D.setStickyPrice(inr(m) + (t.value === "monthly" ? "" : "/mo")); }
    }
    tiers.forEach((t) => t.addEventListener("change", () => { refresh(); track("subscription_tier_viewed", { tier: t.value }); }));

    function setMode(once) {
      buyOnce = once;
      if (modeSub) { modeSub.classList.toggle("is-active", !once); modeSub.setAttribute("aria-selected", String(!once)); }
      if (modeOnce) { modeOnce.classList.toggle("is-active", once); modeOnce.setAttribute("aria-selected", String(once)); }
      if (tiersWrap) { tiersWrap.style.opacity = once ? "0.45" : "1"; tiersWrap.style.pointerEvents = once ? "none" : ""; }
      refresh(); track("subscribe_selected", { mode: once ? "one_time" : "subscription" });
    }
    if (modeSub) modeSub.addEventListener("click", () => setMode(false));
    if (modeOnce) modeOnce.addEventListener("click", () => setMode(true));

    const add = $("#pdpAdd"); if (add) add.addEventListener("click", () => { D.addToCart("kit", buyOnce ? { once: true } : { tier: selected().value }); D.openCart(); });
    refresh();
  });
})();
