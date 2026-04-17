export const metadata = {
  title: "PDCP Reordering, Deciphering, and ROHC",
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
    return `${plain.charCodeAt(0) ^ (CIPHER_KEY + sn)} ${plain.charCodeAt(1) ^ (CIPHER_KEY + sn)} ... (AES block)`;
  }

  function compressedHeader(sn) {
    if (!state.compression) return `IP: 192.168.10.2 → 10.0.0.5, TTL=64, Proto=TCP, SPort=52331, DPort=443, SN=${sn}`;
    return `CTX-${sn % 16} (compressed, 2 bytes)`;
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
          <h2>PDCP: Reordering + Deciphering + ROHC Restoration</h2>
          <p class="hint">HARQ and RLC retransmissions on the radio link can make PDCP PDUs arrive out of order or duplicated. PDCP uses a reordering buffer to restore SN order, deciphers using the security key and COUNT, and expands the ROHC header context.</p>
        </section>

        <section class="pdcp-card">
          <div class="vis-row">
            <button class="vis-button primary" data-action="step" type="button">+ Process 1 PDU</button>
            <button class="vis-button green" data-action="run" type="button">${state.running ? "⏸ Stop Auto" : "▶ Auto Run"}</button>
            <button class="vis-button" data-action="reset" type="button">⟳ Reset</button>
          </div>

          <div class="pdcp-toggles">
            <label><input type="checkbox" ${state.cipher ? "checked" : ""} data-toggle="cipher"/> Show ciphering</label>
            <label><input type="checkbox" ${state.compression ? "checked" : ""} data-toggle="compression"/> Show ROHC header compression</label>
          </div>

          <h3 style="margin-top:14px">1. Radio Link: Arrival Order (SN)</h3>
          <div class="pdcp-row">
            ${state.arrivalOrder.map((sn, i) => {
              const cls = i < state.step ? "arrived" : "queue";
              return `<div class="pdcp-pkt ${cls}"><b>SN ${sn}</b><small>${cls === "arrived" ? "Arrived" : "Waiting"}</small></div>`;
            }).join("")}
          </div>

          <div class="pdcp-arrow">↓ Reordering buffer (expected SN = ${state.expectedNext})</div>

          <h3>2. PDUs Stored in Reordering Buffer</h3>
          <div class="pdcp-row">
            ${pending.length === 0
              ? `<small style="color:#607083;font-weight:900">Buffer is empty</small>`
              : pending.map((p) => `<div class="pdcp-pkt buffer"><b>SN ${p.sn}</b><small>Waiting for order</small></div>`).join("")}
          </div>

          <div class="pdcp-arrow">↓ Release in SN order and forward to the next stage</div>

          <h3>3. Reordering → Deciphering → ROHC Restoration</h3>
          <div class="pdcp-row">
            ${state.delivered.map((p) => `<div class="pdcp-pkt delivered"><b>SN ${p.sn}</b><small>IP Packet</small></div>`).join("") || `<small style="color:#607083;font-weight:900">No upper-layer delivery yet</small>`}
          </div>

          <div class="pdcp-code">
            ${state.delivered.map((p) => `<div><span class="cipher">Ciphered: ${cipherOf(p.sn, "Hi")}</span>\n<span class="hdr">Compressed Hdr: ${compressedHeader(p.sn)}</span>\n<span class="plain">→ Deciphered + Expanded: ${fullHeader(p.sn)} | Payload: "Hello SN=${p.sn}"</span></div>`).join("\n\n") || "(No delivered IP packets yet)"}
          </div>

          <div class="pdcp-metrics">
            <span>Next expected SN: ${state.expectedNext}</span>
            <span>Buffer size: ${pending.length} / ${state.windowSize}</span>
            <span class="ok">Delivered upward: ${state.delivered.length}</span>
            <span>Not arrived yet: ${queue.length}</span>
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
