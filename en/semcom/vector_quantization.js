export const metadata = {
  title: "Vector Quantization: Embedding → Bits",
};

export function mount(root) {
  const state = {
    codebookSizeBits: 4,
    query: { x: 0.2, y: 0.35 },
    seed: 7,
    tokens: [
      { label: "apple", x: 0.55, y: 0.40 },
      { label: "banana", x: 0.48, y: 0.52 },
      { label: "train", x: -0.52, y: -0.38 },
      { label: "meeting", x: -0.30, y: 0.55 },
      { label: "heavy rain", x: -0.65, y: 0.20 },
    ],
    selectedToken: 0,
  };

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function buildCodebook() {
    const K = Math.pow(2, state.codebookSizeBits);
    const rand = seeded(state.seed);
    const centers = [];
    for (let i = 0; i < K; i += 1) {
      const r = 0.35 + rand() * 0.55;
      const theta = 2 * Math.PI * rand();
      centers.push({ id: i, x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    return centers;
  }

  function nearestIndex(p, centers) {
    let best = 0;
    let bestD = Infinity;
    centers.forEach((c, i) => {
      const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    return { idx: best, dist: Math.sqrt(bestD) };
  }

  function toBits(idx, width) {
    return idx.toString(2).padStart(width, "0");
  }

  const SIZE = 400;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const SCALE = SIZE * 0.42;

  function render() {
    const centers = buildCodebook();
    const activeQuery = state.selectedToken >= 0 ? state.tokens[state.selectedToken] : state.query;
    const { idx, dist } = nearestIndex(activeQuery, centers);
    const chosen = centers[idx];
    const bits = toBits(idx, state.codebookSizeBits);

    root.innerHTML = `
      <style>
        .vq-demo h2 { margin:0; font-size:26px; }
        .vq-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .vq-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .vq-card h3 { margin:0 0 6px; font-size:16px; color:#1d2c3f; }
        .vq-grid { display:grid; grid-template-columns:${SIZE + 20}px 1fr; gap:16px; align-items:start; }
        @media (max-width:780px) { .vq-grid { grid-template-columns:1fr; } }
        .vq-svg { width:${SIZE}px; max-width:100%; display:block; background:#fbfdff; border-radius:8px; border:1px solid #d8e0ea; cursor:crosshair; }
        .vq-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:8px; }
        .vq-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .vq-tokens { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
        .vq-tok { padding:6px 10px; border-radius:999px; background:#f1f5fa; border:2px solid #d6dfec; font-weight:900; font-size:12px; cursor:pointer; }
        .vq-tok.active { background:#1a8a9d; border-color:#1a8a9d; color:#fff; }
        .vq-out {
          padding:12px 14px; border-radius:8px; background:#f1f5fa; border:1px solid #d6dfec;
          font-family:Consolas, monospace; font-weight:900; line-height:1.6; font-size:14px;
        }
        .vq-bits {
          display:inline-flex; gap:4px; margin-left:4px;
        }
        .vq-bits span {
          width:26px; height:26px; display:grid; place-items:center;
          border-radius:4px; background:#1a8a9d; color:#fff; font-weight:900; font-size:13px;
        }
        .vq-bits span.zero { background:#cbd6e4; color:#0f1b2b; }
        .vq-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .vq-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .vq-metrics span.warn { background:#fff6db; color:#8a4f03; }
        .vq-metrics span.good { background:#e4f8ec; color:#0d6744; }
      </style>

      <div class="vis-panel vq-demo">
        <section>
          <h2>Vector Quantization: Continuous Embeddings to Bitstreams</h2>
          <p class="hint">Continuous vectors from the sLLM cannot be sent directly over the radio channel. VQ maps each vector to the nearest centroid in a learned codebook, creating a bitstream compatible with existing digital networks.</p>
        </section>

        <section class="vq-card">
          <h3>1. Select a token or click the embedding space</h3>
          <div class="vq-tokens">
            ${state.tokens.map((t, i) => `<button class="vq-tok ${state.selectedToken === i ? "active" : ""}" data-token="${i}" type="button">${t.label}</button>`).join("")}
            <button class="vq-tok ${state.selectedToken === -1 ? "active" : ""}" data-token="-1" type="button">Free input (drag)</button>
          </div>
          <div class="vq-controls" style="margin-top:10px">
            <label>Codebook size (bits): <b>${state.codebookSizeBits} bit</b> → ${Math.pow(2, state.codebookSizeBits)}centroids
              <input type="range" min="2" max="7" step="1" value="${state.codebookSizeBits}" data-control="codebookSizeBits"/>
            </label>
            <button class="vis-button" data-action="reseed" type="button">Retrain codebook (random seed)</button>
          </div>
        </section>

        <section class="vq-card">
          <div class="vq-grid">
            <svg class="vq-svg" viewBox="0 0 ${SIZE} ${SIZE}" data-plot>
              <line x1="0" y1="${CY}" x2="${SIZE}" y2="${CY}" stroke="#e6ecf3"/>
              <line x1="${CX}" y1="0" x2="${CX}" y2="${SIZE}" stroke="#e6ecf3"/>
              <circle cx="${CX}" cy="${CY}" r="${SCALE}" fill="none" stroke="#d8e0ea" stroke-dasharray="3 3"/>

              ${centers.map((c, i) => {
                const px = CX + c.x * SCALE;
                const py = CY - c.y * SCALE;
                const isChosen = i === idx;
                return `
                  <circle cx="${px}" cy="${py}" r="${isChosen ? 10 : 6}" fill="${isChosen ? "#1a8a9d" : "#cbd6e4"}" stroke="${isChosen ? "#0b5b69" : "#94a4ba"}" stroke-width="${isChosen ? 2 : 0.5}"/>
                  <text x="${px}" y="${py + 3}" text-anchor="middle" font-size="${isChosen ? 10 : 9}" fill="${isChosen ? "#fff" : "#35475d"}" font-weight="900">${i}</text>
                `;
              }).join("")}

              ${(() => {
                const qx = CX + activeQuery.x * SCALE;
                const qy = CY - activeQuery.y * SCALE;
                const cx = CX + chosen.x * SCALE;
                const cy = CY - chosen.y * SCALE;
                return `
                  <line x1="${qx}" y1="${qy}" x2="${cx}" y2="${cy}" stroke="#d94242" stroke-width="1.5" stroke-dasharray="4 3"/>
                  <circle cx="${qx}" cy="${qy}" r="7" fill="none" stroke="#6b43bd" stroke-width="2.5"/>
                  <circle cx="${qx}" cy="${qy}" r="3" fill="#6b43bd"/>
                  <text x="${qx + 10}" y="${qy + 4}" font-size="11" font-weight="900" fill="#4f2a9c">${state.selectedToken >= 0 ? state.tokens[state.selectedToken].label : "query"}</text>
                `;
              })()}

              <text x="${SIZE - 6}" y="${CY - 4}" text-anchor="end" font-size="10" fill="#607083" font-weight="900">Embedding dimension 1</text>
              <text x="${CX + 4}" y="12" font-size="10" fill="#607083" font-weight="900">Embedding dimension 2</text>
            </svg>

            <div>
              <h3>2. VQ Result</h3>
              <div class="vq-out">
                Input embedding: ( ${activeQuery.x.toFixed(3)}, ${activeQuery.y.toFixed(3)} )<br>
                Nearest codeword index: <span style="color:#1a8a9d">${idx}</span><br>
                Quantization error ||x − c<sub>i</sub>||: <span style="color:#8a4f03">${dist.toFixed(3)}</span><br>
                <br>
                Transmitted bitstream (${state.codebookSizeBits}-bit):
                <span class="vq-bits">${[...bits].map((b) => `<span class="${b === "0" ? "zero" : ""}">${b}</span>`).join("")}</span>
              </div>

              <div class="vq-metrics">
                <span>Codebook size K = ${Math.pow(2, state.codebookSizeBits)}</span>
                <span class="${dist < 0.1 ? "good" : "warn"}">Quantization error: ${dist.toFixed(3)}</span>
                <span>Transmitted bits/token: ${state.codebookSizeBits} bit</span>
              </div>

              <h3 style="margin-top:12px">3. Notes</h3>
              <p style="margin:0; font-size:13px; color:#4f6073; font-weight:800; line-height:1.5">
                • A larger codebook reduces quantization error but increases transmitted bit count.<br>
                • The learned codebook reflects the <b>structure</b> of semantic space, so similar meanings tend to have nearby indices.<br>
                • These index bits enter the LDPC/QAM pipeline and are carried by the existing 5G RAN.
              </p>
            </div>
          </div>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-token]").forEach((el) => {
      el.addEventListener("click", () => {
        const v = Number(el.dataset.token);
        state.selectedToken = v;
        render();
      });
    });
    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });
    root.querySelector('[data-action="reseed"]')?.addEventListener("click", () => {
      state.seed = Math.floor(Math.random() * 1000);
      render();
    });

    const plot = root.querySelector("[data-plot]");
    if (plot) {
      let dragging = false;
      const updateFromEvent = (ev) => {
        const rect = plot.getBoundingClientRect();
        const px = ((ev.clientX - rect.left) / rect.width) * SIZE;
        const py = ((ev.clientY - rect.top) / rect.height) * SIZE;
        state.query = {
          x: Math.max(-1, Math.min(1, (px - CX) / SCALE)),
          y: Math.max(-1, Math.min(1, (CY - py) / SCALE)),
        };
        state.selectedToken = -1;
        render();
      };
      plot.addEventListener("mousedown", (ev) => { dragging = true; updateFromEvent(ev); });
      window.addEventListener("mouseup", () => { dragging = false; });
      plot.addEventListener("mousemove", (ev) => { if (dragging) updateFromEvent(ev); });
    }
  }

  render();
  return () => {};
}
