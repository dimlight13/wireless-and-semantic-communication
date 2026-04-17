export const metadata = {
  title: "QAM 복조와 LLR 계산",
};

export function mount(root) {
  const state = {
    rxI: 0.55,
    rxQ: 0.35,
    sigma2: 0.15,
  };

  const points = [];
  for (let bi = 0; bi < 4; bi += 1) {
    for (let bq = 0; bq < 4; bq += 1) {
      const i = -3 + bi * 2;
      const q = -3 + bq * 2;
      const bits = grayLabel(bi, bq);
      points.push({ i: i / Math.sqrt(10), q: q / Math.sqrt(10), bits });
    }
  }

  function grayLabel(bi, bq) {
    const iGray = bi ^ (bi >> 1);
    const qGray = bq ^ (bq >> 1);
    return `${((iGray >> 1) & 1)}${((qGray >> 1) & 1)}${(iGray & 1)}${(qGray & 1)}`;
  }

  function dist2(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  }

  function computeLlr() {
    const llrs = [0, 0, 0, 0].map(() => ({ plus: [], minus: [] }));
    points.forEach((p) => {
      for (let b = 0; b < 4; b += 1) {
        const bit = Number(p.bits[b]);
        const d = dist2([state.rxI, state.rxQ], [p.i, p.q]);
        if (bit === 0) llrs[b].plus.push(d);
        else llrs[b].minus.push(d);
      }
    });
    return llrs.map((groups) => {
      const minPlus = Math.min(...groups.plus);
      const minMinus = Math.min(...groups.minus);
      return (minMinus - minPlus) / state.sigma2;
    });
  }

  const SIZE = 360;
  const SCALE = SIZE * 0.35;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  function toPx(p) {
    return [CX + p[0] * SCALE, CY - p[1] * SCALE];
  }

  function render() {
    const llrs = computeLlr();
    const hard = llrs.map((v) => (v >= 0 ? 0 : 1));

    let closest = 0;
    let minD = Infinity;
    points.forEach((p, idx) => {
      const d = dist2([state.rxI, state.rxQ], [p.i, p.q]);
      if (d < minD) { minD = d; closest = idx; }
    });

    const dotsSvg = points.map((p, idx) => {
      const [x, y] = toPx([p.i, p.q]);
      const isClosest = idx === closest;
      return `
        <circle cx="${x}" cy="${y}" r="${isClosest ? 6 : 4}" fill="${isClosest ? "#c86414" : "#245fd6"}" stroke="${isClosest ? "#8a400b" : "none"}" stroke-width="${isClosest ? 1 : 0}"/>
        <text x="${x + 7}" y="${y - 6}" font-size="9" fill="#35475d" font-weight="900">${p.bits}</text>
      `;
    }).join("");

    const [rxX, rxY] = toPx([state.rxI, state.rxQ]);

    const bitLabels = ["b₀ (I MSB)", "b₁ (Q MSB)", "b₂ (I LSB)", "b₃ (Q LSB)"];

    root.innerHTML = `
      <style>
        .demod-demo h2 { margin:0; font-size:28px; }
        .demod-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .demod-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .demod-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .demod-grid { display:grid; grid-template-columns:${SIZE + 20}px 1fr; gap:16px; align-items:start; }
        @media (max-width: 720px) { .demod-grid { grid-template-columns:1fr; } }
        .demod-svg { width:100%; display:block; background:#fbfdff; border-radius:8px; border:1px solid #d8e0ea; cursor:crosshair; }
        .demod-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:8px; margin-top:8px; }
        .demod-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:12px; }
        .llr-grid { display:grid; grid-template-columns:1fr; gap:8px; }
        .llr-bar {
          padding:10px 12px; border-radius:8px; background:#f1f5fa; border:1px solid #d6dfec;
          display:grid; grid-template-columns:100px 1fr 60px 40px; gap:10px; align-items:center;
        }
        .llr-bar.pos { background:#e4f8ec; border-color:#11865a; }
        .llr-bar.neg { background:#ffe8e8; border-color:#d94242; }
        .llr-bar b { font-weight:900; font-size:13px; }
        .llr-bar .track { height:14px; background:#d8e0ea; border-radius:10px; position:relative; overflow:hidden; }
        .llr-bar .fill { position:absolute; top:0; bottom:0; border-radius:10px; }
        .llr-bar.pos .fill { background:#11865a; left:50%; }
        .llr-bar.neg .fill { background:#d94242; right:50%; }
        .llr-bar .track .mid { position:absolute; top:-2px; bottom:-2px; left:50%; width:1px; background:#607083; }
        .llr-bar .hard {
          display:grid; place-items:center; font-size:20px; font-weight:900;
          width:36px; height:36px; border-radius:50%; color:#fff;
        }
        .llr-bar.pos .hard { background:#11865a; }
        .llr-bar.neg .hard { background:#d94242; }
        .demod-note { padding:10px 12px; background:#f5f9ff; border:1px solid #d6e3f5; border-radius:8px; font-size:12px; font-weight:900; color:#33465b; margin-top:10px; line-height:1.4; }
      </style>

      <div class="vis-panel demod-demo">
        <section>
          <h2>16-QAM 복조: 수신 심볼 → LLR</h2>
          <p class="hint">복조기는 별자리 위 수신 심볼 y에 대해 각 비트가 0/1일 가능성을 LLR로 계산합니다. LLR = (최근접 0 거리 − 최근접 1 거리) / σ². 플롯을 드래그해 수신 심볼 위치를 바꿔보세요.</p>
        </section>

        <section class="demod-card">
          <div class="demod-grid">
            <div>
              <svg class="demod-svg" viewBox="0 0 ${SIZE} ${SIZE}" data-plot>
                <line x1="0" y1="${CY}" x2="${SIZE}" y2="${CY}" stroke="#c2ccdb" stroke-width="0.8"/>
                <line x1="${CX}" y1="0" x2="${CX}" y2="${SIZE}" stroke="#c2ccdb" stroke-width="0.8"/>
                <line x1="${CX}" y1="0" x2="${CX}" y2="${SIZE}" stroke="#d8e0ea" stroke-dasharray="3 3"/>
                <line x1="0" y1="${CY}" x2="${SIZE}" y2="${CY}" stroke="#d8e0ea" stroke-dasharray="3 3"/>
                ${dotsSvg}
                <circle cx="${rxX}" cy="${rxY}" r="8" fill="none" stroke="#d94242" stroke-width="2" />
                <circle cx="${rxX}" cy="${rxY}" r="3" fill="#d94242"/>
                <text x="${rxX + 10}" y="${rxY + 4}" font-size="11" fill="#a02828" font-weight="900">y (Rx)</text>
                <text x="${SIZE - 6}" y="${CY - 4}" text-anchor="end" fill="#607083" font-size="10" font-weight="900">I</text>
                <text x="${CX + 4}" y="12" fill="#607083" font-size="10" font-weight="900">Q</text>
              </svg>
              <div class="demod-controls">
                <label>I 성분: <b>${state.rxI.toFixed(2)}</b>
                  <input type="range" min="-1.3" max="1.3" step="0.02" value="${state.rxI}" data-control="rxI"/>
                </label>
                <label>Q 성분: <b>${state.rxQ.toFixed(2)}</b>
                  <input type="range" min="-1.3" max="1.3" step="0.02" value="${state.rxQ}" data-control="rxQ"/>
                </label>
                <label>잡음분산 σ²: <b>${state.sigma2.toFixed(2)}</b>
                  <input type="range" min="0.02" max="0.5" step="0.01" value="${state.sigma2}" data-control="sigma2"/>
                </label>
              </div>
            </div>

            <div>
              <h3>비트별 LLR 값</h3>
              <div class="llr-grid">
                ${llrs.map((v, i) => {
                  const pct = Math.min(100, Math.abs(v) * 10);
                  const cls = v >= 0 ? "pos" : "neg";
                  return `
                    <div class="llr-bar ${cls}">
                      <b>${bitLabels[i]}</b>
                      <div class="track">
                        <span class="mid"></span>
                        <span class="fill" style="width:${pct / 2}%"></span>
                      </div>
                      <span>${v >= 0 ? "+" : ""}${v.toFixed(2)}</span>
                      <span class="hard">${hard[i]}</span>
                    </div>
                  `;
                }).join("")}
              </div>
              <div class="demod-note">
                최근접 심볼: <b style="color:#c86414">${points[closest].bits}</b><br>
                하드 판정 결과: <b>${hard.join("")}</b><br>
                LLR이 0에 가까울수록 해당 비트는 불확실합니다 → LDPC 복호기가 이 소프트 정보로 오류를 정정합니다.
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });

    const plot = root.querySelector("[data-plot]");
    if (plot) {
      let dragging = false;
      const updateFromEvent = (ev) => {
        const rect = plot.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * SIZE;
        const y = ((ev.clientY - rect.top) / rect.height) * SIZE;
        state.rxI = Math.max(-1.3, Math.min(1.3, (x - CX) / SCALE));
        state.rxQ = Math.max(-1.3, Math.min(1.3, (CY - y) / SCALE));
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
