/* =====================================================================
   DOONGRI™ — Shared guided quiz engine (used by homepage modal + quiz.html)
   ===================================================================== */
(function () {
  "use strict";
  const STEPS = [
    { key: "concern", q: "What brings you here today?", opts: ["Occasional discomfort", "Recurring / chronic concern", "Digestive irregularity", "Preventive wellness"] },
    { key: "severity", q: "How would you describe it right now?", opts: ["Mild & recent", "Moderate, comes & goes", "Persistent for months"] },
    { key: "lifestyle", q: "Your typical day is mostly…", opts: ["Desk-bound / sedentary", "On the move", "Mixed"] },
    { key: "diet", q: "How fibre-rich is your diet?", opts: ["Low fibre, irregular meals", "Moderate", "High fibre & regular"] },
    { key: "duration", q: "How committed do you want to be?", opts: ["Try one month", "A focused 3-month reset", "A 6-month journey", "A full year of care"] },
  ];
  function recommend(answers) {
    const d = answers.duration || "";
    if (d.includes("year")) return { tier: "annual", name: "Annual", price: "₹1,499/mo", save: "Save ₹6,000/year" };
    if (d.includes("6-month")) return { tier: "semi", name: "Semi-Annual", price: "₹1,699/mo", save: "Save ₹1,800" };
    if (d.includes("3-month")) return { tier: "quarter", name: "Quarterly", price: "₹1,799/mo", save: "Save ₹600" };
    return { tier: "monthly", name: "Monthly", price: "₹1,999/mo", save: "Flexible start" };
  }
  const track = (e, p) => (window.DOONGRI ? window.DOONGRI.track(e, p) : null);

  // opts: { stage, bar, onApply(rec), onVaidya() }
  function init(opts) {
    const { stage, bar } = opts;
    let step = 0; const answers = {};
    track("quiz_started");
    render();

    function render() {
      if (bar) bar.style.width = (step / STEPS.length * 100) + "%";
      if (step < STEPS.length) {
        const s = STEPS[step];
        stage.innerHTML = `
          <div class="quiz__step quiz__slide-in">
            <span class="quiz__count">Step ${step + 1} of ${STEPS.length}</span>
            <h3 id="quizQ">${s.q}</h3>
            <div class="quiz__options" role="group" aria-labelledby="quizQ">
              ${s.opts.map((o) => `<button class="quiz__opt" data-opt="${o.replace(/"/g, "&quot;")}">${o}</button>`).join("")}
            </div>
          </div>`;
        stage.querySelectorAll(".quiz__opt").forEach((b) => b.addEventListener("click", () => {
          answers[s.key] = b.dataset.opt; step++;
          if (step >= STEPS.length) track("quiz_completed", answers);
          render();
        }));
      } else {
        if (bar) bar.style.width = "100%";
        const r = recommend(answers);
        track("quiz_recommendation_shown", { tier: r.tier });
        stage.innerHTML = `
          <div class="quiz__result quiz__slide-in">
            <span class="quiz__result-badge">Your recommended journey</span>
            <span class="tier__leaf" aria-hidden="true" style="font-size:38px">🌿</span>
            <span class="tier__name">${r.name} ARSHMUKT KIT™</span>
            <p class="tier__price"><strong>${r.price}</strong></p>
            <p class="tier__save" style="color:var(--color-accent)">${r.save}</p>
            <p class="lede" style="font-size:16px">Based on your answers, this tier fits your routine best — and includes a free 15-minute Vaidya pre-consultation.</p>
            <div class="hero__cta center" style="margin-top:18px;justify-content:center">
              <button class="btn btn--gold btn--lg" id="quizApply">Choose this plan →</button>
              <button class="btn btn--ghost" id="quizVaidya">Book free Vaidya call</button>
            </div>
          </div>`;
        stage.querySelector("#quizApply").addEventListener("click", () => opts.onApply && opts.onApply(r));
        stage.querySelector("#quizVaidya").addEventListener("click", () => opts.onVaidya && opts.onVaidya(r));
      }
    }
  }
  window.DoongriQuiz = { init, recommend, STEPS };
})();
