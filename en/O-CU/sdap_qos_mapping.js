export const metadata = {
  title: "SDAP QoS Flow → DRB Mapping",
};

export function mount(root) {
  const flows = [
    { qfi: 1, fiveQi: 1, kind: "voice", label: "VoNR voice", latency: 100, gbr: true, color: "#d94242", pkts: [] },
    { qfi: 2, fiveQi: 2, kind: "video", label: "Real-time video", latency: 150, gbr: true, color: "#c86414", pkts: [] },
    { qfi: 5, fiveQi: 5, kind: "ims", label: "IMS signaling", latency: 100, gbr: false, color: "#6b43bd", pkts: [] },
    { qfi: 7, fiveQi: 7, kind: "video-ng", label: "Video streaming", latency: 100, gbr: false, color: "#245fd6", pkts: [] },
    { qfi: 9, fiveQi: 9, kind: "web", label: "Web/file (Default)", latency: 300, gbr: false, color: "#11865a", pkts: [] },
  ];

  const drbs = [
    { id: "DRB1", label: "DRB1 (GBR voice)", accept: [1], color: "#d94242", queue: [] },
    { id: "DRB2", label: "DRB2 (GBR video)", accept: [2], color: "#c86414", queue: [] },
    { id: "DRB3", label: "DRB3 (non-GBR real-time)", accept: [5, 7], color: "#6b43bd", queue: [] },
    { id: "DRB4", label: "DRB4 (Default data)", accept: [9], color: "#11865a", queue: [] },
  ];

  const state = {
    running: false,
    timer: null,
    nextPktId: 1,
    log: [],
    spawnRate: 1,
    selectedFlow: 1,
  };

  function spawnPacket(qfi) {
    const flow = flows.find((f) => f.qfi === qfi);
    if (!flow) return;
    const pkt = { id: state.nextPktId++, qfi, color: flow.color, kind: flow.kind };
    const drb = drbs.find((d) => d.accept.includes(qfi)) || drbs[drbs.length - 1];
    drb.queue.unshift(pkt);
    if (drb.queue.length > 8) drb.queue.pop();
    state.log.unshift(`QFI ${qfi} (${flow.label}) → ${drb.id}: 5QI=${flow.fiveQi}, ${flow.gbr ? "GBR" : "non-GBR"}, max latency ${flow.latency}ms`);
    state.log = state.log.slice(0, 8);
  }

  function tick() {
    for (let i = 0; i < state.spawnRate; i += 1) {
      const qfi = flows[Math.floor(Math.random() * flows.length)].qfi;
      spawnPacket(qfi);
    }
    render();
  }

  function startTimer() {
    stopTimer();
    state.timer = window.setInterval(tick, 900);
  }

  function stopTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
      state.running = false;
    }
  }

  function render() {
    root.innerHTML = `
      <style>
        .sdap-demo h2 { margin:0; font-size:28px; }
        .sdap-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .sdap-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .sdap-card h3 { margin:0 0 6px; font-size:17px; color:#1d2c3f; }
        .sdap-lanes { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:10px; align-items:start; }
        @media (max-width: 760px) { .sdap-lanes { grid-template-columns:1fr; } }
        .sdap-col h4 { margin:0 0 8px; font-size:14px; color:#35475d; }
        .flow-row, .drb-row { display:grid; gap:8px; }
        .flow-item {
          padding:10px 12px; border-radius:8px; border:2px solid #d6dfec;
          display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center;
          background:#fff; cursor:pointer;
          transition:transform 150ms ease, border-color 150ms ease;
        }
        .flow-item:hover { transform:translateY(-1px); }
        .flow-item .dot { width:14px; height:14px; border-radius:50%; }
        .flow-item b { font-size:13px; }
        .flow-item small { font-size:11px; color:#607083; font-weight:900; }
        .flow-item .badge { padding:3px 6px; border-radius:4px; background:#eef3fa; font-size:11px; font-weight:900; color:#35475d; }
        .drb-item {
          padding:10px 12px; border-radius:8px; border:2px solid;
          display:grid; gap:8px; min-height:90px; background:#fbfdff;
        }
        .drb-item header { display:flex; justify-content:space-between; align-items:center; font-weight:900; font-size:13px; }
        .drb-item .chips { display:flex; flex-wrap:wrap; gap:4px; min-height:24px; }
        .drb-chip {
          min-width:36px; height:24px; display:grid; place-items:center;
          border-radius:4px; color:#fff; font-size:11px; font-weight:900;
          animation:slideIn 260ms ease;
        }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        .sdap-log {
          margin-top:10px; padding:10px 12px; font-family:Consolas, monospace; font-size:12px;
          background:#101722; color:#8ff0ad; border-radius:8px; min-height:100px; max-height:180px; overflow:auto;
          line-height:1.55;
        }
        .sdap-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .sdap-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:8px; margin-top:8px; }
        .sdap-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:12px; }
      </style>

      <div class="vis-panel sdap-demo">
        <section>
          <h2>SDAP: Mapping QoS Flows to DRBs and Core Paths</h2>
          <p class="hint">The core network tags each IP traffic flow with a QFI (QoS Flow Identifier). SDAP references the matching 5QI requirements for latency, loss, and GBR, then classifies traffic into the right DRB (Data Radio Bearer).</p>
        </section>

        <section class="sdap-card">
          <div class="sdap-row">
            <button class="vis-button primary" data-action="spawn" type="button">Inject 1 Packet from Selected Flow</button>
            <button class="vis-button green" data-action="run" type="button">${state.running ? "⏸ Stop Auto Traffic" : "▶ Auto Traffic"}</button>
            <button class="vis-button" data-action="clear" type="button">⟳ Clear Queues</button>
          </div>
          <div class="sdap-controls">
            <label>Manual injection flow:
              <select data-control="selectedFlow">
                ${flows.map((f) => `<option value="${f.qfi}" ${state.selectedFlow === f.qfi ? "selected" : ""}>QFI ${f.qfi} · ${f.label}</option>`).join("")}
              </select>
            </label>
            <label>Auto traffic rate: <b>${state.spawnRate} pkt/tick</b>
              <input type="range" min="1" max="4" step="1" value="${state.spawnRate}" data-control="spawnRate"/>
            </label>
          </div>

          <div class="sdap-lanes">
            <div class="sdap-col">
              <h4>QoS Flow (core network → gNB)</h4>
              <div class="flow-row">
                ${flows.map((f) => `
                  <div class="flow-item" style="border-color:${f.color}" data-spawn="${f.qfi}">
                    <span class="dot" style="background:${f.color}"></span>
                    <div>
                      <b>QFI ${f.qfi} · ${f.label}</b><br>
                      <small>5QI ${f.fiveQi} · ${f.gbr ? "GBR" : "non-GBR"} · latency ≤ ${f.latency}ms</small>
                    </div>
                    <span class="badge">→ ${(drbs.find((d) => d.accept.includes(f.qfi)) || drbs[drbs.length - 1]).id}</span>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="sdap-col">
              <h4>DRB (forwarded to RLC/MAC layers)</h4>
              <div class="drb-row">
                ${drbs.map((d) => `
                  <div class="drb-item" style="border-color:${d.color}">
                    <header>
                      <span style="color:${d.color}">${d.label}</span>
                      <small>Queued: ${d.queue.length}</small>
                    </header>
                    <div class="chips">
                      ${d.queue.map((p) => `<span class="drb-chip" style="background:${p.color}">Q${p.qfi}·#${p.id}</span>`).join("")}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="sdap-log">${state.log.length === 0 ? "(No logs yet)" : state.log.join("\n")}</div>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-spawn]").forEach((el) => {
      el.addEventListener("click", () => {
        state.selectedFlow = Number(el.dataset.spawn);
        spawnPacket(state.selectedFlow);
        render();
      });
    });
    root.querySelector('[data-action="spawn"]')?.addEventListener("click", () => {
      spawnPacket(state.selectedFlow);
      render();
    });
    root.querySelector('[data-action="run"]')?.addEventListener("click", () => {
      state.running = !state.running;
      if (state.running) startTimer();
      else stopTimer();
      render();
    });
    root.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
      drbs.forEach((d) => { d.queue.length = 0; });
      state.log = [];
      render();
    });
    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", (e) => {
        const key = el.dataset.control;
        state[key] = el.tagName === "SELECT" ? Number(e.target.value) : Number(e.target.value);
        render();
      });
    });
  }

  render();
  return () => stopTimer();
}
