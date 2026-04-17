export const metadata = {
  title: "FFT: Time Domain → Frequency Domain",
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
          <h2>FFT: Time-Domain Signal → Frequency-Domain Subcarriers</h2>
          <p class="hint">OFDM transmits many subcarrier signals combined in the time domain. The receiver uses the FFT to decompose the time waveform back into each subcarrier amplitude.</p>
        </section>

        <section class="fft-card">
          <h3>Edit Subcarrier Amplitudes</h3>
          <p>Adjust amplitude a<sub>k</sub> for each subcarrier k. The time waveform below updates as the sum of all subcarriers.</p>
          <div class="preset-row">
            <button class="vis-button" data-preset="single" type="button">k=2 single tone</button>
            <button class="vis-button" data-preset="two" type="button">k=1, k=3 two tones</button>
            <button class="vis-button" data-preset="chirp" type="button">Low-to-high ramp</button>
            <button class="vis-button" data-preset="reset" type="button">Reset</button>
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

          <h3 style="margin-top:14px">Time-domain waveform (1 OFDM symbol)</h3>
          <svg class="fft-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${PLOT_H}" fill="#fff" stroke="#d8e0ea"/>
            <line x1="${PAD_L}" y1="${PAD_T + PLOT_H / 2}" x2="${PAD_L + PLOT_W}" y2="${PAD_T + PLOT_H / 2}" stroke="#94a4ba" stroke-width="0.6"/>
            <path d="${timePath(samples)}" fill="none" stroke="#245fd6" stroke-width="2"/>
            <text x="${PAD_L - 4}" y="${PAD_T + 4}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">Amplitude</text>
            <text x="${PAD_L + PLOT_W / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#35475d" font-weight="900">Time n</text>
          </svg>

          <div class="fft-arrow">↓ FFT (size ${N})</div>

          <h3>Frequency domain: magnitude by subcarrier |X[k]|</h3>
          <svg class="fft-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <rect x="${PAD_L}" y="${PAD_T}" width="${PLOT_W}" height="${PLOT_H}" fill="#fff" stroke="#d8e0ea"/>
            ${freqBars(freq)}
            <text x="${PAD_L - 4}" y="${PAD_T + 10}" text-anchor="end" font-size="10" fill="#536579" font-weight="900">|X[k]|</text>
            <text x="${PAD_L + PLOT_W / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#35475d" font-weight="900">Subcarrier index k</text>
          </svg>
          <p>Subcarriers with zero amplitude disappear in the FFT output too, which is the basis of resource allocation.</p>
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
