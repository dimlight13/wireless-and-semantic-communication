export const metadata = {
  title: "LDPC Decoding: Tanner Graph and Message Passing",
};

export function mount(root) {
  // (7,4) Hamming-like parity check matrix (6 variable nodes x 3 check nodes for compact illustration)
  // H matrix: rows = check nodes, cols = variable nodes
  const H = [
    [1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 1],
  ];
  const NUM_V = 6;
  const NUM_C = 3;

  const state = {
    channelLlr: [2.1, -0.3, 1.8, -1.4, 2.5, -2.0],
    iteration: 0,
    varToCheck: [],
    checkToVar: [],
    totalLlr: [],
    decoded: [],
    running: false,
    timer: null,
    codeword: [1, 0, 1, 0, 1, 0],
  };

  function resetMessages() {
    state.varToCheck = Array.from({ length: NUM_V }, (_, v) => Array(NUM_C).fill(state.channelLlr[v]));
    state.checkToVar = Array.from({ length: NUM_C }, () => Array(NUM_V).fill(0));
    state.totalLlr = [...state.channelLlr];
    state.decoded = state.totalLlr.map((v) => (v >= 0 ? 0 : 1));
    state.iteration = 0;
  }

  function phi(x) {
    const ax = Math.max(1e-8, Math.abs(x));
    return Math.sign(x) * (-Math.log(Math.tanh(ax / 2)));
  }

  function iterate() {
    // Check -> Variable using min-sum
    for (let c = 0; c < NUM_C; c += 1) {
      const connected = [];
      for (let v = 0; v < NUM_V; v += 1) if (H[c][v] === 1) connected.push(v);
      for (const v of connected) {
        let sign = 1;
        let minAbs = Infinity;
        for (const v2 of connected) {
          if (v2 === v) continue;
          const m = state.varToCheck[v2][c];
          sign *= Math.sign(m) || 1;
          minAbs = Math.min(minAbs, Math.abs(m));
        }
        state.checkToVar[c][v] = sign * minAbs * 0.75; // damping factor
      }
    }
    // Variable -> Check and total LLR
    for (let v = 0; v < NUM_V; v += 1) {
      let total = state.channelLlr[v];
      for (let c = 0; c < NUM_C; c += 1) {
        if (H[c][v] === 1) total += state.checkToVar[c][v];
      }
      state.totalLlr[v] = total;
      for (let c = 0; c < NUM_C; c += 1) {
        if (H[c][v] === 1) state.varToCheck[v][c] = total - state.checkToVar[c][v];
      }
    }
    state.decoded = state.totalLlr.map((v) => (v >= 0 ? 0 : 1));
    state.iteration += 1;
  }

  function converged() {
    for (let c = 0; c < NUM_C; c += 1) {
      let sum = 0;
      for (let v = 0; v < NUM_V; v += 1) sum ^= H[c][v] & state.decoded[v];
      if (sum !== 0) return false;
    }
    return true;
  }

  const W = 640;
  const HGT = 320;

  function vPos(v) {
    return { x: 80 + v * 90, y: HGT - 60 };
  }
  function cPos(c) {
    return { x: 140 + c * 170, y: 70 };
  }

  function render() {
    const conv = converged();
    const bitsMatch = state.decoded.every((b, i) => b === state.codeword[i]);

    root.innerHTML = `
      <style>
        .ldpc-demo h2 { margin:0; font-size:28px; }
        .ldpc-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .ldpc-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .ldpc-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .ldpc-svg { width:100%; max-width:${W}px; display:block; background:#fbfdff; border-radius:8px; border:1px solid #d8e0ea; }
        .ldpc-bits { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .llr-chip {
          min-width:62px; padding:8px 10px; border-radius:7px; font-weight:900;
          background:#f1f5fa; border:2px solid #d6dfec; text-align:center; font-size:13px;
        }
        .llr-chip.pos { background:#e4f8ec; border-color:#11865a; color:#0d6744; }
        .llr-chip.neg { background:#ffe8e8; border-color:#d94242; color:#a02828; }
        .llr-chip small { display:block; font-size:10px; color:#607083; }
        .ldpc-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .ldpc-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .ldpc-metrics span.ok { background:#e4f8ec; color:#0d6744; }
        .ldpc-metrics span.bad { background:#ffe8e8; color:#a02828; }
        .llr-inputs { display:grid; grid-template-columns:repeat(${NUM_V}, 1fr); gap:6px; margin-top:8px; }
        .llr-inputs label { display:grid; gap:3px; font-size:11px; font-weight:900; color:#35475d; text-align:center; }
        .llr-inputs input { width:100%; }
        .hmat { display:grid; grid-template-columns:repeat(${NUM_V + 1}, 1fr); gap:3px; margin-top:6px; font-family:Consolas, monospace; font-size:12px; font-weight:900; }
        .hmat span { padding:4px; text-align:center; background:#f1f5fa; border-radius:4px; color:#35475d; }
        .hmat span.one { background:#6b43bd; color:#fff; }
      </style>

      <div class="vis-panel ldpc-demo">
        <section>
          <h2>LDPC Decoding: Belief Propagation</h2>
          <p class="hint">Starting from channel LLRs, variable nodes (V) and check nodes (C) exchange soft messages. Confidence increases with each iteration, and decoding converges when all parity checks are satisfied.</p>
        </section>

        <section class="ldpc-card">
          <div class="vis-row">
            <button class="vis-button primary" data-action="iterate" type="button">+ 1 Iteration</button>
            <button class="vis-button green" data-action="run" type="button">${state.running ? "⏸ Stop Auto" : "▶ Auto Iterate"}</button>
            <button class="vis-button" data-action="reset" type="button">⟳ Reset</button>
            <button class="vis-button orange" data-action="flip" type="button">Flip one strong LLR (inject error)</button>
          </div>

          <h3 style="margin-top:14px">Tanner graph (based on H matrix)</h3>
          <svg class="ldpc-svg" viewBox="0 0 ${W} ${HGT}" preserveAspectRatio="xMidYMid meet">
            ${(() => {
              let edges = "";
              for (let c = 0; c < NUM_C; c += 1) {
                for (let v = 0; v < NUM_V; v += 1) {
                  if (H[c][v] === 1) {
                    const p1 = cPos(c);
                    const p2 = vPos(v);
                    const msg = state.iteration > 0 ? state.checkToVar[c][v] : 0;
                    const color = Math.abs(msg) < 0.01 ? "#c2ccdb" : (msg >= 0 ? "#11865a" : "#d94242");
                    const width = Math.min(3.5, 0.8 + Math.abs(msg) * 0.6);
                    edges += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${color}" stroke-width="${width}" opacity="0.7"/>`;
                  }
                }
              }
              return edges;
            })()}
            ${state.channelLlr.map((llr, v) => {
              const p = vPos(v);
              const color = state.decoded[v] === 0 ? "#11865a" : "#d94242";
              return `
                <circle cx="${p.x}" cy="${p.y}" r="22" fill="#fff" stroke="${color}" stroke-width="2.5"/>
                <text x="${p.x}" y="${p.y - 2}" text-anchor="middle" font-size="14" font-weight="900" fill="${color}">V${v}</text>
                <text x="${p.x}" y="${p.y + 12}" text-anchor="middle" font-size="10" font-weight="900" fill="#35475d">${state.totalLlr[v].toFixed(1)}</text>
                <text x="${p.x}" y="${p.y + 42}" text-anchor="middle" font-size="16" font-weight="900" fill="${color}">→ ${state.decoded[v]}</text>
              `;
            }).join("")}
            ${Array.from({ length: NUM_C }).map((_, c) => {
              const p = cPos(c);
              let syndrome = 0;
              for (let v = 0; v < NUM_V; v += 1) syndrome ^= H[c][v] & state.decoded[v];
              const okC = syndrome === 0;
              return `
                <rect x="${p.x - 22}" y="${p.y - 22}" width="44" height="44" fill="#fff" stroke="${okC ? "#11865a" : "#d94242"}" stroke-width="2.5" rx="5"/>
                <text x="${p.x}" y="${p.y + 2}" text-anchor="middle" font-size="14" font-weight="900" fill="${okC ? "#11865a" : "#d94242"}">C${c}</text>
                <text x="${p.x}" y="${p.y - 28}" text-anchor="middle" font-size="11" font-weight="900" fill="#35475d">Σ mod 2 = ${syndrome} ${okC ? "✓" : "✗"}</text>
              `;
            }).join("")}
          </svg>

          <h3>Total LLR (channel + accumulated check messages)</h3>
          <div class="ldpc-bits">
            ${state.totalLlr.map((v, i) => `
              <div class="llr-chip ${v >= 0 ? "pos" : "neg"}">
                <b>${v >= 0 ? "+" : ""}${v.toFixed(2)}</b>
                <small>V${i} → ${state.decoded[i]}</small>
              </div>
            `).join("")}
          </div>

          <h3 style="margin-top:12px">Adjust Channel LLR Input</h3>
          <div class="llr-inputs">
            ${state.channelLlr.map((llr, i) => `
              <label>V${i}: ${llr.toFixed(1)}
                <input type="range" min="-3" max="3" step="0.1" value="${llr}" data-llr="${i}"/>
              </label>
            `).join("")}
          </div>

          <h3 style="margin-top:12px">Parity Check Matrix H</h3>
          <div class="hmat">
            <span>　</span>${Array.from({ length: NUM_V }, (_, i) => `<span>V${i}</span>`).join("")}
            ${H.map((row, c) => `<span>C${c}</span>${row.map((b) => `<span class="${b ? "one" : ""}">${b}</span>`).join("")}`).join("")}
          </div>

          <div class="ldpc-metrics">
            <span>Iteration: ${state.iteration}</span>
            <span class="${conv ? "ok" : "bad"}">All parity checks ${conv ? "satisfied ✓ converged" : "unsatisfied - keep iterating"}</span>
            <span class="${bitsMatch ? "ok" : "bad"}">Original codeword recovery ${bitsMatch ? "success" : "pending"}</span>
            <span>Decoded bitstream: <b>${state.decoded.join("")}</b></span>
          </div>
        </section>
      </div>
    `;

    root.querySelector('[data-action="iterate"]')?.addEventListener("click", () => {
      iterate();
      render();
    });
    root.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
      resetMessages();
      stopTimer();
      state.running = false;
      render();
    });
    root.querySelector('[data-action="run"]')?.addEventListener("click", () => {
      state.running = !state.running;
      if (state.running) startTimer();
      else stopTimer();
      render();
    });
    root.querySelector('[data-action="flip"]')?.addEventListener("click", () => {
      const i = 1; // flip V1 to a strong wrong value
      state.channelLlr[i] = state.channelLlr[i] >= 0 ? -2.5 : 2.5;
      resetMessages();
      render();
    });
    root.querySelectorAll("[data-llr]").forEach((el) => {
      el.addEventListener("input", (e) => {
        const i = Number(el.dataset.llr);
        state.channelLlr[i] = Number(e.target.value);
        resetMessages();
        render();
      });
    });
  }

  function startTimer() {
    stopTimer();
    state.timer = window.setInterval(() => {
      iterate();
      render();
      if (converged() || state.iteration > 20) stopTimer();
    }, 700);
  }

  function stopTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
      state.running = false;
    }
  }

  resetMessages();
  render();

  return () => stopTimer();
}
