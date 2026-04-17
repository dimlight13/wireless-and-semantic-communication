export const metadata = {
  title: "PDCP 재정렬·복호화·ROHC",
};

export function mount(root) {
  const state = {
    arrivalOrder: [41, 43, 42, 45, 44, 46],
    expectedNext: 41,
    buffer: new Map(),
    delivered: [],
    windowSize: 4,
    step: 0,
    running: false,
    timer: null,
    cipher: true,
    compression: true,
  };

  const CIPHER_KEY = 0xa5;

  function cipherOf(sn, plain) {
    if (!state.cipher) return plain;
    return `${plain.charCodeAt(0) ^ (CIPHER_KEY + sn)} ${plain.charCodeAt(1) ^ (CIPHER_KEY + sn)} ... (AES 블록)`;
  }

  function compressedHeader(sn) {
    if (!state.compression) return `IP: 192.168.10.2 → 10.0.0.5, TTL=64, Proto=TCP, SPort=52331, DPort=443, SN=${sn}`;
    return `CTX-${sn % 16} (압축, 2 bytes)`;
  }

  function fullHeader(sn) {
    return `IP: 192.168.10.2 → 10.0.0.5, TCP 52331→443, SN=${sn}`;
  }

  function resetState() {
    state.expectedNext = 41;
    state.buffer = new Map();
    state.delivered = [];
    state.step = 0;
  }

  function doStep() {
    if (state.step >= state.arrivalOrder.length) {
      stopTimer();
      return;
    }
    const sn = state.arrivalOrder[state.step];
    state.buffer.set(sn, { sn, received: Date.now() });
    while (state.buffer.has(state.expectedNext)) {
      const pkt = state.buffer.get(state.expectedNext);
      state.buffer.delete(state.expectedNext);
      state.delivered.push(pkt);
      state.expectedNext += 1;
    }
    state.step += 1;
    render();
  }

  function startTimer() {
    stopTimer();
    state.timer = window.setInterval(() => {
      doStep();
      if (state.step >= state.arrivalOrder.length) stopTimer();
    }, 900);
  }

  function stopTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
      state.running = false;
    }
  }

  function render() {
    const pending = Array.from(state.buffer.values()).sort((a, b) => a.sn - b.sn);
    const arrived = state.arrivalOrder.slice(0, state.step);
    const queue = state.arrivalOrder.slice(state.step);

    root.innerHTML = `
      <style>
        .pdcp-demo h2 { margin:0; font-size:28px; }
        .pdcp-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .pdcp-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .pdcp-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .pdcp-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:10px; background:#f7faff; border-radius:8px; min-height:56px; }
        .pdcp-pkt {
          min-width:52px; padding:10px 12px; border-radius:8px;
          background:#fff; border:2px solid #cbd6e4; font-weight:900;
          display:grid; gap:2px; text-align:center;
          box-shadow:0 2px 6px rgba(20,33,47,.06);
        }
        .pdcp-pkt small { font-size:10px; color:#607083; font-weight:900; }
        .pdcp-pkt.queue { background:#f1f5fa; opacity:.85; }
        .pdcp-pkt.arrived { background:#fff6db; border-color:#d9991d; color:#8a4f03; }
        .pdcp-pkt.buffer { background:#eef0ff; border-color:#6b43bd; color:#4f2a9c; }
        .pdcp-pkt.delivered { background:#e4f8ec; border-color:#11865a; color:#0d6744; }
        .pdcp-pkt.missing { background:#ffe8e8; border-color:#d94242; color:#a02828; }
        .pdcp-arrow { text-align:center; color:#718198; font-size:22px; font-weight:900; margin:6px 0; }
        .pdcp-ctrl { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; align-items:center; }
        .pdcp-code { font-family:Consolas, monospace; font-size:12px; line-height:1.5; color:#8ff0ad; background:#101722; padding:10px 12px; border-radius:8px; margin-top:8px; max-height:160px; overflow:auto; }
        .pdcp-code .plain { color:#fff2b0; }
        .pdcp-code .cipher { color:#f2b3c9; }
        .pdcp-code .hdr { color:#8fc7ff; }
        .pdcp-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .pdcp-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .pdcp-metrics span.ok { background:#e4f8ec; color:#0d6744; }
        .pdcp-toggles { display:flex; flex-wrap:wrap; gap:12px; margin-top:6px; font-size:13px; font-weight:900; color:#35475d; }
      </style>

      <div class="vis-panel pdcp-demo">
        <section>
          <h2>PDCP: 순서 재정렬 + 복호화 + ROHC 복원</h2>
          <p class="hint">무선 구간에서 HARQ·RLC 재전송 때문에 순서가 뒤섞이거나 중복된 PDCP PDU가 올라옵니다. PDCP는 재정렬 버퍼로 SN 순서대로 맞춘 뒤, 보안 키와 COUNT로 복호화하고 ROHC 헤더 컨텍스트를 확장합니다.</p>
        </section>

        <section class="pdcp-card">
          <div class="vis-row">
            <button class="vis-button primary" data-action="step" type="button">+ 1 PDU 처리</button>
            <button class="vis-button green" data-action="run" type="button">${state.running ? "⏸ 자동 정지" : "▶ 자동 실행"}</button>
            <button class="vis-button" data-action="reset" type="button">⟳ 초기화</button>
          </div>

          <div class="pdcp-toggles">
            <label><input type="checkbox" ${state.cipher ? "checked" : ""} data-toggle="cipher"/> 암호화 보기</label>
            <label><input type="checkbox" ${state.compression ? "checked" : ""} data-toggle="compression"/> ROHC 헤더 압축 보기</label>
          </div>

          <h3 style="margin-top:14px">① 무선 구간: 도착 순서 (SN)</h3>
          <div class="pdcp-row">
            ${state.arrivalOrder.map((sn, i) => {
              const cls = i < state.step ? "arrived" : "queue";
              return `<div class="pdcp-pkt ${cls}"><b>SN ${sn}</b><small>${cls === "arrived" ? "도착" : "대기"}</small></div>`;
            }).join("")}
          </div>

          <div class="pdcp-arrow">↓ 재정렬 버퍼 (기대 SN = ${state.expectedNext})</div>

          <h3>② 재정렬 버퍼에 저장된 PDU</h3>
          <div class="pdcp-row">
            ${pending.length === 0
              ? `<small style="color:#607083;font-weight:900">버퍼가 비어 있음</small>`
              : pending.map((p) => `<div class="pdcp-pkt buffer"><b>SN ${p.sn}</b><small>순서 대기</small></div>`).join("")}
          </div>

          <div class="pdcp-arrow">↓ SN 순서대로 꺼내서 다음 단계로 전달</div>

          <h3>③ 순서 정렬 → 복호화 → ROHC 복원</h3>
          <div class="pdcp-row">
            ${state.delivered.map((p) => `<div class="pdcp-pkt delivered"><b>SN ${p.sn}</b><small>IP 패킷</small></div>`).join("") || `<small style="color:#607083;font-weight:900">아직 상위 전달 없음</small>`}
          </div>

          <div class="pdcp-code">
            ${state.delivered.map((p) => `<div><span class="cipher">Ciphered: ${cipherOf(p.sn, "안녕")}</span>\n<span class="hdr">Compressed Hdr: ${compressedHeader(p.sn)}</span>\n<span class="plain">→ Deciphered + Expanded: ${fullHeader(p.sn)} | Payload: "Hello SN=${p.sn}"</span></div>`).join("\n\n") || "(아직 전달된 IP 패킷 없음)"}
          </div>

          <div class="pdcp-metrics">
            <span>다음 기대 SN: ${state.expectedNext}</span>
            <span>버퍼 크기: ${pending.length} / ${state.windowSize}</span>
            <span class="ok">상위 전달: ${state.delivered.length}개</span>
            <span>아직 도착 안함: ${queue.length}개</span>
          </div>
        </section>
      </div>
    `;

    root.querySelector('[data-action="step"]')?.addEventListener("click", doStep);
    root.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
      resetState();
      stopTimer();
      render();
    });
    root.querySelector('[data-action="run"]')?.addEventListener("click", () => {
      state.running = !state.running;
      if (state.running) startTimer();
      else stopTimer();
      render();
    });
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", (e) => {
        state[el.dataset.toggle] = e.target.checked;
        render();
      });
    });
  }

  render();
  return () => stopTimer();
}
