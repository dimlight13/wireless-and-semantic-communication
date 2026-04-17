export const metadata = {
  title: "디지털 빔포밍",
};

export function mount(root) {
  const state = {
    numAntennas: 8,
    targetAngle: 30,
    interfererAngle: -40,
    interfererOn: true,
    steeringAngle: 30,
  };

  const W = 640;
  const H = 360;
  const CX = W / 2;
  const CY = H - 60;
  const R = 240;

  function weights() {
    const phi = (state.steeringAngle * Math.PI) / 180;
    return Array.from({ length: state.numAntennas }, (_, n) => {
      const phase = Math.PI * n * Math.sin(phi);
      return { re: Math.cos(-phase), im: Math.sin(-phase) };
    });
  }

  function arrayFactor(thetaDeg) {
    const theta = (thetaDeg * Math.PI) / 180;
    const w = weights();
    let re = 0;
    let im = 0;
    for (let n = 0; n < state.numAntennas; n += 1) {
      const phase = Math.PI * n * Math.sin(theta);
      const s = { re: Math.cos(phase), im: Math.sin(phase) };
      re += w[n].re * s.re - w[n].im * s.im;
      im += w[n].re * s.im + w[n].im * s.re;
    }
    const mag = Math.sqrt(re * re + im * im) / state.numAntennas;
    return mag;
  }

  function beamPath() {
    const steps = 180;
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const deg = -90 + (180 * i) / steps;
      const rad = (deg * Math.PI) / 180;
      const mag = arrayFactor(deg);
      const r = mag * R;
      const x = CX + r * Math.sin(rad);
      const y = CY - r * Math.cos(rad);
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(" ");
  }

  function render() {
    const targetGain = arrayFactor(state.targetAngle);
    const interfGain = state.interfererOn ? arrayFactor(state.interfererAngle) : 0;
    const sinr = state.interfererOn
      ? 10 * Math.log10((targetGain * targetGain) / (interfGain * interfGain + 0.01))
      : 99;

    function angleLine(deg, color, label, strong = false) {
      const rad = (deg * Math.PI) / 180;
      const x = CX + R * Math.sin(rad);
      const y = CY - R * Math.cos(rad);
      return `
        <line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="${strong ? 2.5 : 1.4}" stroke-dasharray="${strong ? "" : "4 4"}"/>
        <text x="${x + 6 * Math.sign(Math.sin(rad))}" y="${y - 8}" fill="${color}" font-size="12" font-weight="900">${label}</text>
      `;
    }

    const w = weights();

    root.innerHTML = `
      <style>
        .bf-demo h2 { margin:0; font-size:28px; }
        .bf-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .bf-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .bf-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .bf-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-top:10px; }
        .bf-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .bf-svg { width:100%; max-width:${W}px; display:block; background:#fbfdff; border-radius:8px; margin-top:8px; }
        .bf-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .bf-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .bf-metrics span.ok { background:#e4f8ec; color:#0d6744; }
        .bf-metrics span.bad { background:#ffe8e8; color:#a02828; }
        .bf-weights { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .bf-weight { min-width:90px; padding:7px 9px; border-radius:6px; background:#f1f5fa; border:1px solid #d6dfec; font-family:Consolas, monospace; font-size:11px; font-weight:900; }
        .bf-weight b { color:#6b43bd; }
      </style>

      <div class="vis-panel bf-demo">
        <section>
          <h2>디지털 빔포밍: 안테나 배열 가중치</h2>
          <p class="hint">여러 안테나의 수신 신호에 복소 가중치 w<sub>n</sub>를 곱해 결합하면, 특정 각도로 들어오는 신호는 보강되고 다른 방향 간섭은 상쇄됩니다.</p>
        </section>

        <section class="bf-card">
          <div class="bf-controls">
            <label>안테나 수 N: <b>${state.numAntennas}</b>
              <input type="range" min="2" max="16" step="1" value="${state.numAntennas}" data-control="numAntennas" />
            </label>
            <label>빔 조향각 (steering): <b>${state.steeringAngle}°</b>
              <input type="range" min="-80" max="80" step="1" value="${state.steeringAngle}" data-control="steeringAngle" />
            </label>
            <label>목표 단말 각도: <b>${state.targetAngle}°</b>
              <input type="range" min="-80" max="80" step="1" value="${state.targetAngle}" data-control="targetAngle" />
            </label>
            <label>간섭원 각도: <b>${state.interfererAngle}°</b>
              <input type="range" min="-80" max="80" step="1" value="${state.interfererAngle}" data-control="interfererAngle" ${state.interfererOn ? "" : "disabled"}/>
            </label>
            <label style="flex-direction:row;align-items:center;gap:8px">
              <input type="checkbox" ${state.interfererOn ? "checked" : ""} data-toggle="interfererOn" />
              간섭원 활성
            </label>
            <button class="vis-button primary" data-action="align" type="button" style="align-self:end">조향 = 목표 정렬</button>
          </div>

          <h3 style="margin-top:14px">빔 패턴 (Array Factor)</h3>
          <svg class="bf-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#d8e0ea" stroke-dasharray="3 3"/>
            <circle cx="${CX}" cy="${CY}" r="${R * 0.5}" fill="none" stroke="#e4eaf3" stroke-dasharray="2 3"/>
            <line x1="${CX - R}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="#c2ccdb" stroke-width="0.6"/>
            <path d="${beamPath()} Z" fill="rgba(36,95,214,0.16)" stroke="#245fd6" stroke-width="2"/>
            ${angleLine(state.targetAngle, "#11865a", `UE (${state.targetAngle}°)`, true)}
            ${state.interfererOn ? angleLine(state.interfererAngle, "#d94242", `간섭 (${state.interfererAngle}°)`, true) : ""}
            ${angleLine(state.steeringAngle, "#c86414", `조향 (${state.steeringAngle}°)`)}
            ${Array.from({ length: state.numAntennas }, (_, n) => {
              const x = CX - (state.numAntennas - 1) * 12 + n * 24;
              return `<rect x="${x - 5}" y="${CY - 2}" width="10" height="10" fill="#245fd6"/>`;
            }).join("")}
            <text x="${CX}" y="${CY + 28}" text-anchor="middle" fill="#35475d" font-size="11" font-weight="900">안테나 배열 (N=${state.numAntennas}, 간격 λ/2)</text>
          </svg>

          <div class="bf-metrics">
            <span class="ok">목표 방향 이득: ${(targetGain * 100).toFixed(1)}% (${(20 * Math.log10(Math.max(0.001, targetGain))).toFixed(1)} dB)</span>
            <span class="${state.interfererOn && interfGain > 0.1 ? "bad" : ""}">간섭 방향 이득: ${(interfGain * 100).toFixed(1)}% (${state.interfererOn ? (20 * Math.log10(Math.max(0.001, interfGain))).toFixed(1) + " dB" : "N/A"})</span>
            <span class="${sinr >= 10 ? "ok" : "bad"}">SINR: ${sinr > 90 ? "∞" : sinr.toFixed(1) + " dB"}</span>
          </div>

          <h3 style="margin-top:14px">안테나별 가중치 w<sub>n</sub></h3>
          <div class="bf-weights">
            ${w.map((wv, n) => `<div class="bf-weight">ANT${n}: <b>${wv.re.toFixed(2)} ${wv.im >= 0 ? "+" : ""}${wv.im.toFixed(2)}j</b></div>`).join("")}
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
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", (e) => {
        state[el.dataset.toggle] = e.target.checked;
        render();
      });
    });
    root.querySelector('[data-action="align"]')?.addEventListener("click", () => {
      state.steeringAngle = state.targetAngle;
      render();
    });
  }

  render();
  return () => {};
}
