export const metadata = {
  title: "Channel Estimation & Equalization",
};

export function mount(root) {
  const state = {
    channelMag: 0.6,
    channelPhase: 45,
    noiseSigma: 0.08,
    modulation: "16QAM",
    seed: 0,
  };

  const constellations = {
    QPSK: [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([i, q]) => [i / Math.SQRT2, q / Math.SQRT2]),
    "16QAM": [],
  };
  for (let i = -3; i <= 3; i += 2) {
    for (let q = -3; q <= 3; q += 2) {
      constellations["16QAM"].push([i / Math.sqrt(10), q / Math.sqrt(10)]);
    }
  }

  function rng(seed) {
    let s = seed * 9301 + 49297;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function gaussian(rand) {
    const u = Math.max(1e-6, rand());
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function applyChannel(points) {
    const rand = rng(state.seed + 1);
    const phi = (state.channelPhase * Math.PI) / 180;
    const h = { re: state.channelMag * Math.cos(phi), im: state.channelMag * Math.sin(phi) };
    return points.map(([i, q]) => {
      const yi = h.re * i - h.im * q + state.noiseSigma * gaussian(rand);
      const yq = h.re * q + h.im * i + state.noiseSigma * gaussian(rand);
      return [yi, yq];
    });
  }

  function equalize(points) {
    const phi = (state.channelPhase * Math.PI) / 180;
    const h = { re: state.channelMag * Math.cos(phi), im: state.channelMag * Math.sin(phi) };
    const denom = h.re * h.re + h.im * h.im + 1e-6;
    return points.map(([yi, yq]) => {
      const ei = (yi * h.re + yq * h.im) / denom;
      const eq = (yq * h.re - yi * h.im) / denom;
      return [ei, eq];
    });
  }

  const SIZE = 280;
  const SCALE = SIZE * 0.35;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  function plot(points, color, refPoints, title) {
    const dots = points.map(([i, q], idx) => {
      const ref = refPoints[idx];
      return `
        <line x1="${CX + ref[0] * SCALE}" y1="${CY - ref[1] * SCALE}" x2="${CX + i * SCALE}" y2="${CY - q * SCALE}" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
        <circle cx="${CX + i * SCALE}" cy="${CY - q * SCALE}" r="3.5" fill="${color}"/>
      `;
    }).join("");
    const refs = refPoints.map(([i, q]) => `
      <circle cx="${CX + i * SCALE}" cy="${CY - q * SCALE}" r="4" fill="none" stroke="#94a4ba" stroke-width="1" stroke-dasharray="2 2"/>
    `).join("");
    return `
      <div class="eq-plot">
        <h4>${title}</h4>
        <svg viewBox="0 0 ${SIZE} ${SIZE}" class="eq-svg">
          <rect width="${SIZE}" height="${SIZE}" fill="#fbfdff"/>
          <line x1="0" y1="${CY}" x2="${SIZE}" y2="${CY}" stroke="#c2ccdb" stroke-width="0.6"/>
          <line x1="${CX}" y1="0" x2="${CX}" y2="${SIZE}" stroke="#c2ccdb" stroke-width="0.6"/>
          ${refs}
          ${dots}
          <text x="${SIZE - 6}" y="${CY - 4}" text-anchor="end" fill="#607083" font-size="10" font-weight="900">I</text>
          <text x="${CX + 4}" y="12" fill="#607083" font-size="10" font-weight="900">Q</text>
        </svg>
      </div>
    `;
  }

  function render() {
    const refs = constellations[state.modulation];
    const received = applyChannel(refs);
    const equalized = equalize(received);

    const mseRx = received.reduce((acc, [i, q], idx) => acc + (i - refs[idx][0]) ** 2 + (q - refs[idx][1]) ** 2, 0) / refs.length;
    const mseEq = equalized.reduce((acc, [i, q], idx) => acc + (i - refs[idx][0]) ** 2 + (q - refs[idx][1]) ** 2, 0) / refs.length;

    root.innerHTML = `
      <style>
        .eq-demo h2 { margin:0; font-size:28px; }
        .eq-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .eq-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .eq-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .eq-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-top:10px; }
        .eq-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .eq-plots { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:10px; }
        .eq-plot h4 { margin:0 0 4px; font-size:13px; text-align:center; color:#1d2c3f; }
        .eq-svg { width:100%; display:block; border-radius:6px; border:1px solid #d8e0ea; }
        .eq-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .eq-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .eq-metrics span.good { background:#e4f8ec; color:#0d6744; }
        .eq-metrics span.bad { background:#ffe8e8; color:#a02828; }
        .eq-legend { display:flex; flex-wrap:wrap; gap:10px; margin-top:6px; font-weight:900; font-size:12px; }
        .eq-legend span { display:flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; background:#f1f5fa; }
        .eq-legend i { display:inline-block; width:12px; height:12px; border-radius:50%; }
        @media (max-width: 720px) { .eq-plots { grid-template-columns:1fr; } }
      </style>

      <div class="vis-panel eq-demo">
        <section>
          <h2>Channel Estimation & Equalization</h2>
          <p class="hint">무선 채널은 QAM 심볼에 복소 이득 H(진폭 감쇄 + 위상 회전)와 잡음을 더합니다. 수신단은 H를 추정해 Y/H 역변환으로 원래 별자리점 근처로 복원합니다.</p>
        </section>

        <section class="eq-card">
          <div class="eq-controls">
            <label>변조:
              <select data-control="modulation">
                <option value="QPSK" ${state.modulation === "QPSK" ? "selected" : ""}>QPSK</option>
                <option value="16QAM" ${state.modulation === "16QAM" ? "selected" : ""}>16-QAM</option>
              </select>
            </label>
            <label>채널 진폭 |H|: <b>${state.channelMag.toFixed(2)}</b>
              <input type="range" min="0.2" max="1.5" step="0.05" value="${state.channelMag}" data-control="channelMag" />
            </label>
            <label>채널 위상 ∠H: <b>${state.channelPhase}°</b>
              <input type="range" min="-180" max="180" step="5" value="${state.channelPhase}" data-control="channelPhase" />
            </label>
            <label>잡음 σ: <b>${state.noiseSigma.toFixed(2)}</b>
              <input type="range" min="0" max="0.3" step="0.01" value="${state.noiseSigma}" data-control="noiseSigma" />
            </label>
            <button class="vis-button" data-action="noise" type="button" style="align-self:end">새 잡음 시드</button>
          </div>

          <div class="eq-legend">
            <span><i style="background:#94a4ba;border:1px dashed #94a4ba"></i>이상적 송신 별자리</span>
            <span><i style="background:#245fd6"></i>송신 (Tx)</span>
            <span><i style="background:#d94242"></i>수신 Y = H·X + n</span>
            <span><i style="background:#11865a"></i>등화 후 X̂ = Y/Ĥ</span>
          </div>

          <div class="eq-plots">
            ${plot(refs, "#245fd6", refs, "Tx 별자리 X")}
            ${plot(received, "#d94242", refs, "Rx (왜곡 + 잡음)")}
            ${plot(equalized, "#11865a", refs, "등화 후 X̂")}
          </div>

          <div class="eq-metrics">
            <span>추정 채널 Ĥ: ${state.channelMag.toFixed(2)} ∠ ${state.channelPhase}°</span>
            <span class="bad">Rx MSE: ${mseRx.toFixed(3)}</span>
            <span class="good">등화 후 MSE: ${mseEq.toFixed(3)}</span>
            <span>MSE 개선: <b>${((1 - mseEq / Math.max(mseRx, 1e-6)) * 100).toFixed(1)}%</b></span>
          </div>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", (e) => {
        const key = el.dataset.control;
        const val = el.tagName === "SELECT" ? e.target.value : Number(e.target.value);
        state[key] = val;
        render();
      });
    });
    root.querySelector('[data-action="noise"]')?.addEventListener("click", () => {
      state.seed += 1;
      render();
    });
  }

  render();
  return () => {};
}
