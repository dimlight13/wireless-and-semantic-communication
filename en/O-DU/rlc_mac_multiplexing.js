export const metadata = {
  title: "Multiple RLC Entities & MAC Multiplexing",
};

export function mount(root) {
  let sequence = 1;
  let lanes = { web: [], voice: [], control: [] };
  let macPackets = [];
  let transportBlocks = [];
  let logs = [];
  const timers = new Set();

  const service = {
    web: {
      label: "Web download",
      short: "WEB",
      lane: "RLC 1",
      mode: "AM",
      color: "#245fd6",
      delay: 950,
      description: "AM mode: validate before forwarding",
    },
    voice: {
      label: "Voice call",
      short: "VOICE",
      lane: "RLC 2",
      mode: "UM",
      color: "#11865a",
      delay: 120,
      description: "UM mode: forward without delay",
    },
    control: {
      label: "RRC control signal",
      short: "RRC",
      lane: "RLC 3",
      mode: "AM",
      color: "#d94242",
      delay: 950,
      description: "AM mode: reliability validation",
    },
  };

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }

  function log(message) {
    const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    logs.unshift(`[${time}] ${message}`);
    logs = logs.slice(0, 9);
  }

  function createPacket(type) {
    const info = service[type];
    const packet = {
      id: sequence,
      type,
      status: info.mode === "AM" ? "Checking" : "Immediate pass",
      createdAt: Date.now(),
    };
    sequence += 1;
    lanes[type].push(packet);
    log(`${info.label} Packet ${packet.id} created → routing to ${info.lane} (${info.mode})`);
    render();

    schedule(() => moveToMac(packet.id, type), info.delay);
  }

  function moveToMac(packetId, type) {
    const lanePacket = lanes[type].find((packet) => packet.id === packetId);
    if (!lanePacket) return;

    lanes[type] = lanes[type].filter((packet) => packet.id !== packetId);
    macPackets.push({ ...lanePacket, status: "MAC Waiting" });
    log(`${service[type].label} Packet ${packetId} → arrived at MAC layer`);
    render();
    schedule(mergeToTransportBlock, 1300);
  }

  function mergeToTransportBlock() {
    if (macPackets.length < 2) return;
    const block = {
      id: transportBlocks.length + 1,
      packets: [...macPackets],
    };
    transportBlocks.push(block);
    macPackets = [];
    log(`MAC Multiplexing: ${block.packets.length} packets merged into Transport Block ${block.id}`);
    render();
  }

  function reset() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    sequence = 1;
    lanes = { web: [], voice: [], control: [] };
    macPackets = [];
    transportBlocks = [];
    logs = [];
    render();
  }

  function packetHtml(packet, extraClass = "") {
    const info = service[packet.type];
    return `<span class="route-packet ${extraClass}" style="--packet-color:${info.color}">
      <b>${info.short}-${packet.id}</b>
      <small>${packet.status}</small>
    </span>`;
  }

  function laneHtml(type) {
    const info = service[type];
    return `
      <article class="rlc-lane" style="--lane-color:${info.color}">
        <div class="lane-head">
          <strong>${info.lane}</strong>
          <span>${info.label}</span>
          <em>${info.mode}</em>
        </div>
        <p>${info.description}</p>
        <div class="lane-dropzone">
          ${lanes[type].length ? lanes[type].map((packet) => packetHtml(packet, info.mode === "AM" ? "checking" : "fast")).join("") : `<span class="empty-lane">Waiting</span>`}
        </div>
      </article>
    `;
  }

  function render() {
    root.innerHTML = `
      <style>
        .mux-demo h2 { margin:0; font-size:32px; }
        .mux-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; }
        .button-panel { display:flex; flex-wrap:wrap; gap:10px; }
        .route-stage { display:grid; gap:14px; }
        .rlc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .rlc-lane {
          position:relative;
          min-height:260px;
          border:2px dashed color-mix(in srgb, var(--lane-color) 50%, #bdcad8);
          border-radius:8px;
          background:linear-gradient(180deg, #fff, color-mix(in srgb, var(--lane-color) 8%, #fff));
          padding:14px;
          overflow:hidden;
        }
        .lane-head { display:grid; gap:4px; margin-bottom:8px; }
        .lane-head strong { font-size:24px; color:var(--lane-color); }
        .lane-head span { font-weight:900; }
        .lane-head em { justify-self:start; padding:5px 8px; border-radius:8px; background:var(--lane-color); color:#fff; font-style:normal; font-weight:900; }
        .rlc-lane p { margin:0 0 12px; color:var(--muted); font-weight:800; }
        .lane-dropzone, .mac-pool { display:flex; flex-wrap:wrap; align-content:flex-start; gap:9px; min-height:120px; }
        .empty-lane { color:#748296; font-weight:900; }
        .route-packet {
          display:grid;
          gap:3px;
          min-width:112px;
          padding:10px 11px;
          border-radius:8px;
          background:var(--packet-color);
          color:#fff;
          box-shadow:0 10px 22px rgba(20,33,47,.18);
          animation:packetDrop 420ms ease both;
        }
        .route-packet b { font-size:16px; }
        .route-packet small { opacity:.92; font-size:12px; font-weight:900; }
        .route-packet.checking { animation:packetDrop 420ms ease both, verifyPulse 900ms ease-in-out infinite; }
        .route-packet.fast { animation:fastDrop 220ms ease both; }
        .mac-layer {
          border:3px solid #14212f;
          border-radius:8px;
          background:#f4f7fb;
          min-height:240px;
          padding:16px;
        }
        .mac-layer h3 { margin:0 0 10px; font-size:24px; }
        .tb-row { display:flex; flex-wrap:wrap; gap:12px; margin-top:14px; }
        .transport-block {
          min-width:240px;
          padding:14px;
          border-radius:8px;
          background:#14212f;
          color:#fff;
          box-shadow:0 14px 28px rgba(20,33,47,.22);
          animation:mergePop 520ms ease both;
        }
        .transport-block strong { display:block; margin-bottom:9px; font-size:20px; }
        .tb-colors { display:flex; gap:6px; }
        .tb-colors span { width:40px; height:28px; border-radius:6px; background:var(--packet-color); }
        @keyframes packetDrop {
          from { opacity:0; transform:translateY(-42px) scale(.96); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes fastDrop {
          from { opacity:0; transform:translateY(-18px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes verifyPulse {
          0%, 100% { box-shadow:0 10px 22px rgba(20,33,47,.18); }
          50% { box-shadow:0 0 0 6px color-mix(in srgb, var(--packet-color) 25%, transparent), 0 10px 22px rgba(20,33,47,.18); }
        }
        @keyframes mergePop {
          from { opacity:0; transform:scale(.92); }
          to { opacity:1; transform:scale(1); }
        }
        @media (max-width: 980px) { .rlc-grid { grid-template-columns:1fr; } }
      </style>

      <div class="vis-panel mux-demo">
        <section>
          <h2>Multiple RLC Entities & MAC Multiplexing Routing</h2>
          <p class="hint">Service-specific packets are routed to dedicated RLC entities, then merged into one Transport Block at the single MAC layer.</p>
        </section>

        <section class="vis-card button-panel">
          <button class="vis-button primary" data-create="web" type="button">Create Web Download</button>
          <button class="vis-button green" data-create="voice" type="button">Create Voice Call</button>
          <button class="vis-button red" data-create="control" type="button">Create RRC Control Signal</button>
          <button class="vis-button orange" data-action="merge" type="button">Merge Transport Block Now</button>
          <button class="vis-button" data-action="reset" type="button">Reset</button>
        </section>

        <section class="route-stage">
          <div class="rlc-grid">
            ${laneHtml("web")}
            ${laneHtml("voice")}
            ${laneHtml("control")}
          </div>

          <article class="mac-layer">
            <h3>MAC layer: single Transport Block creation</h3>
            <div class="mac-pool">
              ${macPackets.length ? macPackets.map((packet) => packetHtml(packet)).join("") : `<span class="empty-lane">No MAC-waiting packets</span>`}
            </div>
            <div class="tb-row">
              ${transportBlocks.map((block) => `
                <div class="transport-block">
                  <strong>Transport Block ${block.id}</strong>
                  <div class="tb-colors">
                    ${block.packets.map((packet) => `<span style="--packet-color:${service[packet.type].color}" title="${service[packet.type].label}"></span>`).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </article>
        </section>

        <section class="logbox">${logs.length ? logs.join("\\n") : "Press a packet creation button to show routing logs."}</section>
      </div>
    `;

    root.querySelectorAll("[data-create]").forEach((button) => {
      button.addEventListener("click", () => createPacket(button.dataset.create));
    });
    root.querySelector('[data-action="merge"]').addEventListener("click", mergeToTransportBlock);
    root.querySelector('[data-action="reset"]').addEventListener("click", reset);
  }

  render();
  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
  };
}
