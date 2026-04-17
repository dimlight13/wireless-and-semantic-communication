export const metadata = {
  title: "RF 수신 및 ADC 샘플링",
};

export function mount(root) {
  const state = {
    sampleRate: 16,
    bitDepth: 4,
    freq: 2,
    phase: 0,
    running: true,
    timer: null,
  };

  const WIDTH = 640;
  const HEIGHT = 220;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 30;
  const PLOT_W = WIDTH - PAD_L - PAD_R;
  const PLOT_H = HEIGHT - PAD_T - PAD_B;

  function analog(t) {
    return Math.sin(2 * Math.PI * state.freq * t + state.phase);
  }

  function quantize(value) {
    const levels = Math.pow(2, state.bitDepth);
    const step = 2 / levels;
    const idx = Math.floor((value + 1) / step);
    const clamped = Math.max(0, Math.min(levels - 1, idx));
    return {
      level: clamped,
      value: clamped * step - 1 + step / 2,
    };
  }

  function analogPath() {
    const points = [];
    for (let i = 0; i <= 200; i += 1) {
      const t = i / 200;
      const y = analog(t);
      const px = PAD_L + t * PLOT_W;
      const py = PAD_T + (1 - (y + 1) / 2) * PLOT_H;
      points.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return points.join(" ");
  }

  function samplePoints() {
    const pts = [];
    const count = state.sampleRate;
    for (let i = 0; i < count; i += 1) {
      const t = i / count;
      const analogVal = analog(t);
      const q = quantize(analogVal);
      pts.push({
        t,
        analog: analogVal,
        quantized: q.value,
        level: q.level,
        x: PAD_L + t * PLOT_W,
        y: PAD_T + (1 - (analogVal + 1) / 2) * PLOT_H,
        yq: PAD_T + (1 - (q.value + 1) / 2) * PLOT_H,
      });
    }
    return pts;
  }

  function quantLevels() {
    const levels = Math.pow(2, state.bitDepth);
    const step = 2 / levels;
    const lines = [];
    for (let i = 0; i <= levels; i += 1) {
      const v = -1 + i * step;
      const y = PAD_T + (1 - (v + 1) / 2) * PLOT_H;
      lines.push(`<line x1="${PAD_L}" y1="${y}" x2="${PAD_L + PLOT_W}" y2="${y}" stroke="#c7d3e3" stroke-width="0.5" stroke-dasharray="2 3" />`);
    }
    return lines.join("");
  }

  function step() {
    state.phase += 0.18;
    render();
  }

  function render() {
    const samples = samplePoints();
    const iqList = samples.map((s, i) => ({
      i: s.quantized.toFixed(3),
      q: Math.cos(2 * Math.PI * state.freq * s.t + state.phase).toFixed(3),
      idx: i,
    }));

    root.innerHTML = `
      <style>
        .rf-demo h2 { margin:0; font-size:28px; }
        .rf-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .rf-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .rf-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-top:10px; }
        .rf-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .rf-controls input[type=range] { width:100%; }
        .rf-legend { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; font-weight:900; font-size:12px; }
        .rf-legend span { display:flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; background:#f1f5fa; }
        .rf-legend i { display:inline-block; width:12px; height:12px; border-radius:50%; }
        .rf-svg { width:100%; max-width:${WIDTH}px; display:block; background:#fbfdff; border-radius:8px; }
        .rf-iq { margin-top:10px; padding:10px; background:#0f1722; border-radius:8px; font-family:Consolas, monospace; color:#8ff0ad; max-height:120px; overflow:auto; font-size:12px; line-height:1.5; }
        .rf-metric { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
        .rf-metric span { padding:6px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
      </style>

      <div class="vis-panel rf-demo">
        <section>
          <h2>RF 수신 및 ADC 샘플링</h2>
          <p class="hint">안테나로 들어온 아날로그 RF 파형을 샘플링 주파수와 ADC 비트 폭에 따라 디지털 I/Q 샘플로 변환합니다. 슬라이더를 조절해 샘플 간격과 양자화 계단을 확인하세요.</p>
        </section>

        <section class="rf-card">
          <div class="vis-row">
            <button class="vis-button primary" data-action="toggle" type="button">${state.running ? "⏸ 파형 정지" : "▶ 파형 실행"}</button>
            <button class="vis-button" data-action="step" type="button">+ 한 스텝</button>
          </div>
          <div class="rf-controls">
            <label>샘플링 속도 (samples/cycle): <b>${state.sampleRate}</b>
              <input type="range" min="4" max="64" step="1" value="${state.sampleRate}" data-control="sampleRate" />
            </label>
            <label>ADC 비트 폭: <b>${state.bitDepth}</b> bit (${Math.pow(2, state.bitDepth)} levels)
              <input type="range" min="1" max="6" step="1" value="${state.bitDepth}" data-control="bitDepth" />
            </label>
            <label>신호 주파수: <b>${state.freq}</b> cycle
              <input type="range" min="1" max="6" step="1" value="${state.freq}" data-control="freq" />
            </label>
          </div>
          <div class="rf-legend">
            <span><i style="background:#245fd6"></i>아날로그 RF</span>
            <span><i style="background:#c86414"></i>샘플링 지점</span>
            <span><i style="background:#11865a"></i>양자화된 디지털 값</span>
            <span><i style="background:#c7d3e3;border-radius:2px"></i>양자화 레벨 그리드</span>
          </div>

          <svg class="rf-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet">
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${PLOT_H}" fill="#fff" stroke="#d8e0ea"/>
            ${quantLevels()}
            <line x1="${PAD_L}" y1="${PAD_T + PLOT_H / 2}" x2="${PAD_L + PLOT_W}" y2="${PAD_T + PLOT_H / 2}" stroke="#94a4ba" stroke-width="0.6"/>
            <path d="${analogPath()}" fill="none" stroke="#245fd6" stroke-width="2"/>
            ${samples.map((s) => `
              <line x1="${s.x}" y1="${s.y}" x2="${s.x}" y2="${s.yq}" stroke="#8ea0b7" stroke-width="0.8" stroke-dasharray="2 2"/>
              <circle cx="${s.x}" cy="${s.y}" r="3" fill="#c86414"/>
              <rect x="${s.x - 3.5}" y="${s.yq - 3.5}" width="7" height="7" fill="#11865a"/>
            `).join("")}
            <text x="${PAD_L - 6}" y="${PAD_T + 5}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">+1</text>
            <text x="${PAD_L - 6}" y="${PAD_T + PLOT_H / 2 + 4}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">0</text>
            <text x="${PAD_L - 6}" y="${PAD_T + PLOT_H}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">-1</text>
            <text x="${PAD_L + PLOT_W / 2}" y="${HEIGHT - 8}" text-anchor="middle" font-size="11" fill="#35475d" font-weight="900">시간 (1 주기)</text>
          </svg>

          <div class="rf-metric">
            <span>샘플 수: ${state.sampleRate}</span>
            <span>양자화 레벨: ${Math.pow(2, state.bitDepth)}</span>
            <span>LSB 크기: ${(2 / Math.pow(2, state.bitDepth)).toFixed(3)}</span>
            <span>나이퀴스트 조건: ${state.sampleRate >= 2 * state.freq ? "충족 ✓" : "미충족 (앨리어싱 위험)"}</span>
          </div>

          <div class="rf-iq">[I/Q 샘플 출력]\n${iqList.map((s) => `  sample[${String(s.idx).padStart(2, "0")}] = I: ${s.i}, Q: ${s.q}`).join("\n")}</div>
        </section>
      </div>
    `;

    const toggle = root.querySelector('[data-action="toggle"]');
    toggle?.addEventListener("click", () => {
      state.running = !state.running;
      if (state.running) startTimer();
      else stopTimer();
      render();
    });
    root.querySelector('[data-action="step"]')?.addEventListener("click", step);
    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });
  }

  function startTimer() {
    stopTimer();
    state.timer = window.setInterval(step, 120);
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
