export const metadata = {
  title: "World Model: Channel Prediction + Transmission Strategy",
};

export function mount(root) {
  const environments = {
    urban: { label: "Urban NLoS", baseSnr: 8, fade: 4.5, mobility: 0.5 },
    highway: { label: "Highway (120 km/h)", baseSnr: 14, fade: 3.0, mobility: 0.9 },
    rural: { label: "Suburban LoS", baseSnr: 22, fade: 1.5, mobility: 0.3 },
    satellite: { label: "Satellite link (SAGIN)", baseSnr: 6, fade: 2.0, mobility: 0.6 },
  };

  const state = {
    env: "urban",
    time: 0,
    history: [],
    running: true,
    timer: null,
    worldModelOn: true,
  };

  const tokenPool = [
    { token: "urgent", priority: 1.0 },
    { token: "fire", priority: 0.95 },
    { token: "Gangnam Station", priority: 0.9 },
    { token: "Exit 3", priority: 0.85 },
    { token: "evacuate", priority: 0.95 },
    { token: "now", priority: 0.8 },
    { token: "people", priority: 0.6 },
    { token: "many people", priority: 0.5 },
  ];

  function predictSnr(t) {
    const env = environments[state.env];
    const trend = Math.sin(t * 0.12);
    const fade = Math.sin(t * 0.35 + 1.3) * env.fade;
    const shadow = Math.sin(t * 0.05) * env.fade * 0.6;
    return env.baseSnr + trend * 2 + fade + shadow + (Math.random() - 0.5) * 1.5;
  }

  function chooseStrategy(snrPred, priority) {
    // Unequal Error Protection: high priority → robust modulation
    const snrEff = snrPred - (1 - priority) * 4;
    if (snrEff < 5) return { mod: "BPSK", rate: 1 / 4, bits: 1, fec: "LDPC 1/4", color: "#d94242" };
    if (snrEff < 10) return { mod: "QPSK", rate: 1 / 3, bits: 2, fec: "LDPC 1/3", color: "#d9991d" };
    if (snrEff < 16) return { mod: "QPSK", rate: 1 / 2, bits: 2, fec: "LDPC 1/2", color: "#245fd6" };
    if (snrEff < 22) return { mod: "16-QAM", rate: 3 / 4, bits: 4, fec: "LDPC 3/4", color: "#11865a" };
    return { mod: "64-QAM", rate: 5 / 6, bits: 6, fec: "LDPC 5/6", color: "#6b43bd" };
  }

  function ueStrategy() {
    if (!state.worldModelOn) {
      // Conservative static baseline: fixed QPSK 1/2 for all tokens
      return tokenPool.map((t) => ({ ...t, strategy: { mod: "QPSK", rate: 1 / 2, bits: 2, fec: "LDPC 1/2 (static)", color: "#94a4ba" } }));
    }
    const pred = predictSnr(state.time + 1);
    return tokenPool.map((t) => ({ ...t, strategy: chooseStrategy(pred, t.priority) }));
  }

  const W = 620;
  const H = 180;
  const PAD_L = 36;
  const PAD_R = 14;
  const PAD_T = 14;
  const PAD_B = 28;
  const PLOT_W = W - PAD_L - PAD_R;
  const PLOT_H = H - PAD_T - PAD_B;

  function step() {
    state.time += 1;
    state.history.push(predictSnr(state.time));
    if (state.history.length > 60) state.history.shift();
    render();
  }

  function snrPath(values) {
    if (values.length === 0) return "";
    const minV = -5;
    const maxV = 30;
    return values.map((v, i) => {
      const x = PAD_L + (i / Math.max(1, values.length - 1)) * PLOT_W;
      const y = PAD_T + (1 - (v - minV) / (maxV - minV)) * PLOT_H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }

  function render() {
    const tokens = ueStrategy();
    const snrNow = state.history.length > 0 ? state.history[state.history.length - 1] : predictSnr(state.time);
    const snrPred = predictSnr(state.time + 3);
    const env = environments[state.env];

    const zoneHigh = PAD_T + (1 - (18 - -5) / (30 - -5)) * PLOT_H;
    const zoneMid = PAD_T + (1 - (12 - -5) / (30 - -5)) * PLOT_H;
    const zoneLow = PAD_T + (1 - (7 - -5) / (30 - -5)) * PLOT_H;

    root.innerHTML = `
      <style>
        .wm-demo h2 { margin:0; font-size:26px; }
        .wm-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .wm-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .wm-card h3 { margin:0 0 6px; font-size:16px; color:#1d2c3f; }
        .wm-envs { display:flex; flex-wrap:wrap; gap:6px; }
        .wm-env { padding:8px 12px; border-radius:999px; background:#f1f5fa; border:2px solid #d6dfec; font-weight:900; font-size:13px; cursor:pointer; }
        .wm-env.active { background:#c86414; border-color:#c86414; color:#fff; }
        .wm-svg { width:100%; max-width:${W}px; display:block; background:#fbfdff; border-radius:8px; border:1px solid #d8e0ea; margin-top:8px; }
        .wm-strategy { display:grid; gap:6px; margin-top:10px; }
        .wm-tok-row {
          display:grid; grid-template-columns:auto 1fr auto auto; gap:10px; align-items:center;
          padding:8px 12px; border-radius:8px; background:#fbfdff; border:1px solid #d6dfec;
        }
        .wm-tok-row .dot { width:10px; height:10px; border-radius:50%; }
        .wm-tok-row b { font-size:13px; font-weight:900; }
        .wm-tok-row .prio {
          padding:3px 7px; border-radius:6px; background:#eef3fa; font-size:11px; font-weight:900; color:#35475d;
        }
        .wm-tok-row .strat {
          padding:5px 9px; border-radius:6px; color:#fff; font-weight:900; font-size:11px;
          font-family:Consolas, monospace; min-width:190px; text-align:center;
        }
        .wm-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .wm-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .wm-metrics span.low { background:#ffe8e8; color:#a02828; }
        .wm-metrics span.mid { background:#fff6db; color:#8a4f03; }
        .wm-metrics span.good { background:#e4f8ec; color:#0d6744; }
        .wm-toggles { display:flex; flex-wrap:wrap; gap:12px; margin-top:6px; font-weight:900; color:#35475d; font-size:13px; }
      </style>

      <div class="vis-panel wm-demo">
        <section>
          <h2>World Model: Predict the Channel and Adjust Strategy</h2>
          <p class="hint">A World Model of UE mobility, weather, and terrain predicts future SNR and assigns different modulation and FEC code rates according to semantic token importance (Unequal Error Protection).</p>
        </section>

        <section class="wm-card">
          <h3>1. Environment Scenario</h3>
          <div class="wm-envs">
            ${Object.entries(environments).map(([key, env]) => `
              <button class="wm-env ${state.env === key ? "active" : ""}" data-env="${key}" type="button">${env.label}</button>
            `).join("")}
          </div>

          <div class="vis-row" style="margin-top:10px">
            <button class="vis-button primary" data-action="toggle" type="button">${state.running ? "⏸ Stop Simulation" : "▶ Play Simulation"}</button>
            <button class="vis-button" data-action="step" type="button">+ 1 step</button>
            <button class="vis-button" data-action="clear" type="button">⟳ Reset</button>
          </div>

          <div class="wm-toggles">
            <label><input type="checkbox" ${state.worldModelOn ? "checked" : ""} data-toggle="worldModelOn"/> Enable World Model adaptation (OFF = fixed QPSK 1/2)</label>
          </div>
        </section>

        <section class="wm-card">
          <h3>2. Predicted SNR (dB) Time Series</h3>
          <svg class="wm-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${PLOT_H}" fill="#fff" stroke="#d8e0ea"/>
            <rect x="${PAD_L}" y="${zoneHigh}" width="${PLOT_W}" height="${PAD_T + PLOT_H - zoneHigh}" fill="#e4f8ec" opacity="0.4"/>
            <rect x="${PAD_L}" y="${zoneMid}" width="${PLOT_W}" height="${zoneHigh - zoneMid}" fill="#fff6db" opacity="0.5"/>
            <rect x="${PAD_L}" y="${zoneLow}" width="${PLOT_W}" height="${zoneMid - zoneLow}" fill="#fff0df" opacity="0.4"/>
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${zoneLow - PAD_T}" fill="#ffe8e8" opacity="0.35"/>
            <path d="${snrPath(state.history)}" fill="none" stroke="#c86414" stroke-width="2.2"/>
            ${state.history.length > 0 ? `<circle cx="${PAD_L + PLOT_W}" cy="${PAD_T + (1 - (state.history[state.history.length - 1] + 5) / 35) * PLOT_H}" r="4" fill="#c86414"/>` : ""}
            <text x="${PAD_L - 4}" y="${PAD_T + 10}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">30 dB</text>
            <text x="${PAD_L - 4}" y="${PAD_T + PLOT_H}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">-5 dB</text>
            <text x="${PAD_L + PLOT_W - 4}" y="${zoneHigh - 2}" text-anchor="end" font-size="9" fill="#0d6744" font-weight="900">64/16-QAM region</text>
            <text x="${PAD_L + PLOT_W - 4}" y="${zoneLow + 10}" text-anchor="end" font-size="9" fill="#8a4f03" font-weight="900">QPSK</text>
            <text x="${PAD_L + PLOT_W - 4}" y="${PAD_T + 12}" text-anchor="end" font-size="9" fill="#a02828" font-weight="900">BPSK required</text>
          </svg>

          <div class="wm-metrics">
            <span>Current SNR: ${snrNow.toFixed(1)} dB</span>
            <span>3-step prediction: ${snrPred.toFixed(1)} dB</span>
            <span>Environment: ${env.label}</span>
            <span>Elapsed tick: ${state.time}</span>
          </div>
        </section>

        <section class="wm-card">
          <h3>3. Token-Priority Transmission Strategy (UEP)</h3>
          <div class="wm-strategy">
            ${tokens.map((t) => `
              <div class="wm-tok-row">
                <span class="dot" style="background:${t.strategy.color}"></span>
                <div>
                  <b>${t.token}</b>
                  <div style="font-size:11px;color:#607083;font-weight:900;margin-top:2px">priority ${(t.priority * 100).toFixed(0)}%</div>
                </div>
                <span class="prio">P=${t.priority.toFixed(2)}</span>
                <span class="strat" style="background:${t.strategy.color}">${t.strategy.mod} · ${t.strategy.fec}</span>
              </div>
            `).join("")}
          </div>
          <p style="margin-top:10px; font-size:13px; color:#4f6073; font-weight:800; line-height:1.4">
            → High-priority tokens (urgent, fire, evacuate) automatically receive lower-order modulation and stronger FEC to prevent semantic loss when the channel degrades.
          </p>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-env]").forEach((el) => {
      el.addEventListener("click", () => {
        state.env = el.dataset.env;
        state.history = [];
        render();
      });
    });
    root.querySelector('[data-action="toggle"]')?.addEventListener("click", () => {
      state.running = !state.running;
      if (state.running) startTimer();
      else stopTimer();
      render();
    });
    root.querySelector('[data-action="step"]')?.addEventListener("click", step);
    root.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
      state.history = [];
      state.time = 0;
      render();
    });
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", (e) => {
        state[el.dataset.toggle] = e.target.checked;
        render();
      });
    });
  }

  function startTimer() {
    stopTimer();
    state.timer = window.setInterval(step, 600);
  }

  function stopTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  render();
  startTimer();
  return () => stopTimer();
}
