export const metadata = {
  title: "FFT: 시간축 → 주파수축",
};

export function mount(root) {
  const N = 8;
  const state = {
    amps: [0, 2, 0, 1.2, 0, 0, 0, 0],
    showTime: true,
    showFreq: true,
    highlight: -1,
  };

  function timeSignal(samples = 128) {
    const arr = [];
    for (let n = 0; n < samples; n += 1) {
      const t = n / samples;
      let sum = 0;
      for (let k = 0; k < N; k += 1) {
        sum += state.amps[k] * Math.cos(2 * Math.PI * k * t);
      }
      arr.push(sum);
    }
    return arr;
  }

  function discreteDft(samples) {
    const result = [];
    for (let k = 0; k < N; k += 1) {
      let re = 0;
      let im = 0;
      for (let n = 0; n < samples.length; n += 1) {
        const ang = -2 * Math.PI * k * n / samples.length;
        re += samples[n] * Math.cos(ang);
        im += samples[n] * Math.sin(ang);
      }
      const mag = Math.sqrt(re * re + im * im) / (samples.length / 2);
      result.push(mag);
    }
    return result;
  }

  const W = 640;
  const H = 180;
  const PAD_L = 36;
  const PAD_R = 14;
  const PAD_T = 14;
  const PAD_B = 30;
  const PLOT_W = W - PAD_L - PAD_R;
  const PLOT_H = H - PAD_T - PAD_B;

  function timePath(samples) {
    const maxAmp = Math.max(1, ...state.amps.map((a) => Math.abs(a))) * N * 0.55 + 0.5;
    const pts = samples.map((v, i) => {
      const x = PAD_L + (i / (samples.length - 1)) * PLOT_W;
      const y = PAD_T + PLOT_H / 2 - (v / maxAmp) * (PLOT_H / 2 - 4);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    return pts.join(" ");
  }

  function freqBars(amps) {
    const maxA = Math.max(0.5, ...amps);
    const barW = PLOT_W / (N * 1.6);
    return amps.map((a, k) => {
      const x = PAD_L + (k + 0.3) * (PLOT_W / N);
      const h = (a / maxA) * (PLOT_H - 8);
      const y = PAD_T + PLOT_H - h;
      const color = state.highlight === k ? "#c86414" : "#11865a";
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" rx="2" />
        <text x="${x + barW / 2}" y="${PAD_T + PLOT_H + 14}" text-anchor="middle" font-size="11" fill="#35475d" font-weight="900">k=${k}</text>
        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="#0d6744" font-weight="900">${a.toFixed(2)}</text>
      `;
    }).join("");
  }

  function render() {
    const samples = timeSignal(128);
    const freq = discreteDft(samples.slice(0, N * 16).filter((_, i) => i % 16 === 0));

    root.innerHTML = `
      <style>
        .fft-demo h2 { margin:0; font-size:28px; }
        .fft-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .fft-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .fft-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .fft-card p { margin:0; color:#607083; font-size:12px; font-weight:800; }
        .subcarriers { display:grid; grid-template-columns:repeat(${N}, 1fr); gap:8px; margin-top:10px; }
        .subcarriers label { display:grid; gap:4px; font-weight:900; font-size:12px; text-align:center; color:#35475d; }
        .subcarriers input[type=range] { width:100%; writing-mode: bt-lr; -webkit-appearance:slider-vertical; appearance:slider-vertical; height:80px; }
        .subcarriers .value { color:#11865a; }
        .fft-svg { width:100%; max-width:${W}px; display:block; background:#fbfdff; border-radius:8px; margin-top:8px; }
        .fft-arrow { text-align:center; color:#718198; font-size:22px; font-weight:900; margin:8px 0; }
        .preset-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
      </style>

      <div class="vis-panel fft-demo">
        <section>
          <h2>FFT: 시간축 신호 → 주파수 영역 서브캐리어</h2>
          <p class="hint">OFDM은 여러 서브캐리어 신호를 시간 영역에서 합쳐 전송합니다. 수신단은 FFT로 시간 파형을 다시 각 서브캐리어(k)의 진폭으로 분해합니다.</p>
        </section>

        <section class="fft-card">
          <h3>서브캐리어 진폭 편집</h3>
          <p>각 서브캐리어 k의 진폭 a<sub>k</sub>를 조절하세요. 아래 시간 파형이 모든 서브캐리어의 합으로 갱신됩니다.</p>
          <div class="preset-row">
            <button class="vis-button" data-preset="single" type="button">k=2 단일 톤</button>
            <button class="vis-button" data-preset="two" type="button">k=1, k=3 두 톤</button>
            <button class="vis-button" data-preset="chirp" type="button">저→고 체증</button>
            <button class="vis-button" data-preset="reset" type="button">초기화</button>
          </div>
          <div class="subcarriers">
            ${state.amps.map((a, k) => `
              <label>
                <span>k=${k}</span>
                <input type="range" min="0" max="3" step="0.1" value="${a}" data-amp="${k}" />
                <span class="value">${a.toFixed(1)}</span>
              </label>
            `).join("")}
          </div>

          <h3 style="margin-top:14px">시간 영역 파형 (1 OFDM 심볼)</h3>
          <svg class="fft-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${PLOT_H}" fill="#fff" stroke="#d8e0ea"/>
            <line x1="${PAD_L}" y1="${PAD_T + PLOT_H / 2}" x2="${PAD_L + PLOT_W}" y2="${PAD_T + PLOT_H / 2}" stroke="#94a4ba" stroke-width="0.6"/>
            <path d="${timePath(samples)}" fill="none" stroke="#245fd6" stroke-width="2"/>
            <text x="${PAD_L - 4}" y="${PAD_T + 4}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">진폭</text>
            <text x="${PAD_L + PLOT_W / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#35475d" font-weight="900">시간 n</text>
          </svg>

          <div class="fft-arrow">↓ FFT (크기 ${N})</div>

          <h3>주파수 영역: 서브캐리어별 크기 |X[k]|</h3>
          <svg class="fft-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${PLOT_H}" fill="#fff" stroke="#d8e0ea"/>
            ${freqBars(freq)}
            <text x="${PAD_L - 4}" y="${PAD_T + 10}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">|X[k]|</text>
            <text x="${PAD_L + PLOT_W / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#35475d" font-weight="900">서브캐리어 인덱스 k</text>
          </svg>
          <p>진폭을 0으로 둔 서브캐리어는 FFT 출력에서도 사라집니다 → 자원 할당의 기초입니다.</p>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-amp]").forEach((el) => {
      el.addEventListener("input", (e) => {
        const k = Number(el.dataset.amp);
        state.amps[k] = Number(e.target.value);
        state.highlight = k;
        render();
      });
    });
    root.querySelectorAll("[data-preset]").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.dataset.preset === "single") state.amps = [0, 0, 2, 0, 0, 0, 0, 0];
        if (el.dataset.preset === "two") state.amps = [0, 1.6, 0, 1.4, 0, 0, 0, 0];
        if (el.dataset.preset === "chirp") state.amps = [0, 0.5, 1, 1.5, 2, 0, 0, 0];
        if (el.dataset.preset === "reset") state.amps = [0, 2, 0, 1.2, 0, 0, 0, 0];
        state.highlight = -1;
        render();
      });
    });
  }

  render();
  return () => {};
}
