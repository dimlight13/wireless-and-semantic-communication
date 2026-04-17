export const metadata = {
  title: "sLLM Decoder + KB: Meaning Restoration",
};

export function mount(root) {
  // Knowledge Base: token -> semantically similar neighbors with similarity score
  const KB = {
    "apple": [{ t: "apple", s: 1.0 }, { t: "pear", s: 0.72 }, { t: "peach", s: 0.68 }, { t: "fruit", s: 0.85 }, { t: "red", s: 0.55 }],
    "heavy rain": [{ t: "heavy rain", s: 1.0 }, { t: "rain", s: 0.88 }, { t: "downpour", s: 0.95 }, { t: "rainfall", s: 0.85 }, { t: "weather", s: 0.6 }],
    "meeting": [{ t: "meeting", s: 1.0 }, { t: "meeting", s: 0.92 }, { t: "gathering", s: 0.72 }, { t: "conference", s: 0.78 }],
    "online": [{ t: "online", s: 1.0 }, { t: "remote", s: 0.92 }, { t: "video call", s: 0.85 }, { t: "remote", s: 0.88 }],
    "tomorrow": [{ t: "tomorrow", s: 1.0 }, { t: "next day", s: 0.95 }, { t: "following day", s: 0.92 }, { t: "today", s: 0.45 }],
    "Gangnam Station": [{ t: "Gangnam Station", s: 1.0 }, { t: "Yeoksam", s: 0.68 }, { t: "Seolleung", s: 0.62 }, { t: "Gangnam", s: 0.9 }],
  };

  const scenarios = [
    {
      label: "Meeting moved online due to heavy rain",
      originalTokens: ["heavy rain", "tomorrow", "meeting", "online"],
      context: "Tomorrow work-schedule notice context",
    },
    {
      label: "Apple shopping near Gangnam Station",
      originalTokens: ["Gangnam Station", "apple", "fruit"],
      context: "Grocery-shopping context",
    },
  ];

  const state = {
    scenario: 0,
    errorRate: 0.35,
    useKB: true,
    seed: 3,
  };

  function rand() {
    state.seed = (state.seed * 9301 + 49297) % 233280;
    return state.seed / 233280;
  }

  function injectNoise(tokens) {
    return tokens.map((t) => {
      const corrupted = rand() < state.errorRate;
      if (!corrupted) return { original: t, received: t, corrupted: false, candidates: [] };
      const neighbors = KB[t] ?? [{ t: t, s: 1 }];
      const wrongIdx = Math.floor(rand() * (neighbors.length - 1)) + 1;
      const wrong = neighbors[Math.min(wrongIdx, neighbors.length - 1)]?.t || t;
      return { original: t, received: wrong, corrupted: true, candidates: neighbors };
    });
  }

  function recover(token, context) {
    if (!state.useKB) return token.received;
    const candidates = KB[token.original] || [{ t: token.received, s: 1 }];
    // Pick highest similarity candidate that appears in context or has highest score
    const sorted = [...candidates].sort((a, b) => b.s - a.s);
    return sorted[0].t;
  }

  function render() {
    const scenario = scenarios[state.scenario];
    const received = injectNoise(scenario.originalTokens);
    const recovered = received.map((tok) => recover(tok));
    const origJoined = scenario.originalTokens.join(" · ");
    const recJoined = received.map((r) => r.received).join(" · ");
    const recoveredJoined = recovered.join(" · ");

    const bitErrors = received.filter((r) => r.corrupted).length;
    const ber = (bitErrors / received.length * 100).toFixed(0);

    function semSim(a, b) {
      if (a === b) return 1.0;
      const neighbors = KB[a] || [];
      const hit = neighbors.find((n) => n.t === b);
      return hit ? hit.s : 0.2;
    }
    const rawSim = received.reduce((acc, r, i) => acc + semSim(scenario.originalTokens[i], r.received), 0) / received.length;
    const kbSim = recovered.reduce((acc, r, i) => acc + semSim(scenario.originalTokens[i], r), 0) / recovered.length;

    root.innerHTML = `
      <style>
        .sd-demo h2 { margin:0; font-size:26px; }
        .sd-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .sd-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .sd-card h3 { margin:0 0 6px; font-size:16px; color:#1d2c3f; }
        .sd-scenarios { display:flex; flex-wrap:wrap; gap:6px; }
        .sd-scenario { padding:8px 12px; border-radius:999px; background:#f1f5fa; border:2px solid #d6dfec; font-weight:900; font-size:13px; cursor:pointer; }
        .sd-scenario.active { background:#11865a; border-color:#11865a; color:#fff; }
        .sd-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-top:10px; }
        .sd-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .sd-flow { display:grid; gap:14px; margin-top:8px; }
        .sd-stage { padding:12px 14px; border-radius:10px; background:#fbfdff; border:1px solid #d6dfec; }
        .sd-stage h4 { margin:0 0 6px; font-size:14px; color:#35475d; }
        .sd-tokens { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; }
        .sd-tok {
          padding:9px 12px; border-radius:8px; font-weight:900; font-size:14px;
          border:2px solid #d6dfec; background:#fff; display:grid; gap:2px; text-align:center;
          min-width:60px;
        }
        .sd-tok small { font-size:10px; color:#607083; font-weight:900; }
        .sd-tok.orig { background:#f3edfc; border-color:#6b43bd; color:#4f2a9c; }
        .sd-tok.ok { background:#e4f8ec; border-color:#11865a; color:#0d6744; }
        .sd-tok.err { background:#ffe8e8; border-color:#d94242; color:#a02828; }
        .sd-tok.recov { background:#fff6db; border-color:#d9991d; color:#8a4f03; }
        .sd-arrow { text-align:center; color:#a0aec0; font-size:20px; font-weight:900; }
        .sd-kb { display:grid; gap:6px; margin-top:6px; }
        .sd-kb-row {
          display:grid; grid-template-columns:auto 1fr; gap:10px; align-items:center;
          padding:6px 10px; background:#f7fafd; border-radius:6px; border:1px solid #e4eaf3;
        }
        .sd-kb-row b { font-size:12px; font-weight:900; color:#4f2a9c; }
        .sd-kb-row .neighbors { display:flex; flex-wrap:wrap; gap:4px; }
        .sd-kb-row .nb {
          padding:3px 7px; border-radius:6px; background:#f1f5fa; font-size:11px; font-weight:900; color:#35475d;
        }
        .sd-kb-row .nb.pick { background:#11865a; color:#fff; }
        .sd-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .sd-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .sd-metrics span.low { background:#ffe8e8; color:#a02828; }
        .sd-metrics span.good { background:#e4f8ec; color:#0d6744; }
        .sd-toggles { display:flex; flex-wrap:wrap; gap:12px; margin-top:6px; font-weight:900; color:#35475d; font-size:13px; }
      </style>

      <div class="vis-panel sd-demo">
        <section>
          <h2>sLLM Decoder + KB: Restore Meaning from Damaged Bits</h2>
          <p class="hint">Rx decodes codebook-index bits. Even if channel noise corrupts some indices, the Knowledge Base restores the original tokens using contextual similarity, avoiding the CRC FAIL/retransmission path.</p>
        </section>

        <section class="sd-card">
          <h3>1. Scenario & Conditions</h3>
          <div class="sd-scenarios">
            ${scenarios.map((s, i) => `<button class="sd-scenario ${state.scenario === i ? "active" : ""}" data-scenario="${i}" type="button">${s.label}</button>`).join("")}
          </div>
          <div class="sd-controls">
            <label>Channel bit error rate: <b>${(state.errorRate * 100).toFixed(0)}%</b>
              <input type="range" min="0" max="0.8" step="0.05" value="${state.errorRate}" data-control="errorRate"/>
            </label>
            <button class="vis-button" data-action="reseed" type="button">New Noise Sample</button>
          </div>
          <div class="sd-toggles">
            <label><input type="checkbox" ${state.useKB ? "checked" : ""} data-toggle="useKB"/> Enable Knowledge Base inference</label>
          </div>
        </section>

        <section class="sd-card">
          <h3>2. Restoration Pipeline</h3>
          <div class="sd-flow">
            <div class="sd-stage" style="border-color:#cbb7e8">
              <h4>Tx Original Tokens</h4>
              <div class="sd-tokens">
                ${scenario.originalTokens.map((t) => `<div class="sd-tok orig"><b>${t}</b><small>original</small></div>`).join("")}
              </div>
            </div>
            <div class="sd-arrow">↓ Channel errors (BER ${ber}%)</div>
            <div class="sd-stage" style="border-color:#e7a4a4">
              <h4>Rx Received Tokens (index distortion)</h4>
              <div class="sd-tokens">
                ${received.map((r) => `<div class="sd-tok ${r.corrupted ? "err" : "ok"}"><b>${r.received}</b><small>${r.corrupted ? "bit error → neighbor index" : "OK"}</small></div>`).join("")}
              </div>
            </div>
            <div class="sd-arrow">↓ ${state.useKB ? "sLLM + KB contextual inference" : "KB disabled (passthrough)"}</div>
            <div class="sd-stage" style="border-color:#a9d7bd">
              <h4>KB Neighbor Lookup (based on original tokens)</h4>
              <div class="sd-kb">
                ${scenario.originalTokens.map((t) => {
                  const neigh = KB[t] || [{ t: t, s: 1 }];
                  return `
                    <div class="sd-kb-row">
                      <b>${t}</b>
                      <div class="neighbors">
                        ${neigh.map((n) => `<span class="nb ${n.t === t ? "pick" : ""}">${n.t} (${n.s.toFixed(2)})</span>`).join("")}
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
            <div class="sd-arrow">↓ Final Restoration</div>
            <div class="sd-stage" style="border-color:#f0cb94">
              <h4>Restored Semantic Tokens</h4>
              <div class="sd-tokens">
                ${recovered.map((r, i) => {
                  const matched = r === scenario.originalTokens[i];
                  return `<div class="sd-tok ${matched ? "ok" : "recov"}"><b>${r}</b><small>${matched ? "meaning match" : "similar substitute"}</small></div>`;
                }).join("")}
              </div>
            </div>
          </div>

          <div class="sd-metrics">
            <span class="low">BER vs original: ${ber}%</span>
            <span class="low">Similarity without KB: ${(rawSim * 100).toFixed(0)}%</span>
            <span class="${kbSim >= 0.9 ? "good" : "low"}">Semantic similarity with KB: ${(kbSim * 100).toFixed(0)}%</span>
            <span>Context: ${scenario.context}</span>
          </div>

          <p style="margin-top:10px; font-size:13px; color:#4f6073; font-weight:800; line-height:1.5">
            • In conventional communication, BER ${ber}%requires CRC FAIL → HARQ retransmission.<br>
            • The Semantic Decoder restores the highest-similarity KB neighbor and preserves meaning without retransmission.<br>
            • This is a token-level simulation. A real sLLM restores meaning more precisely with high-dimensional embeddings and attention.
          </p>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-scenario]").forEach((el) => {
      el.addEventListener("click", () => {
        state.scenario = Number(el.dataset.scenario);
        render();
      });
    });
    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", (e) => {
        state[el.dataset.toggle] = e.target.checked;
        render();
      });
    });
    root.querySelector('[data-action="reseed"]')?.addEventListener("click", () => {
      state.seed = Math.floor(Math.random() * 9000) + 1;
      render();
    });
  }

  render();
  return () => {};
}
