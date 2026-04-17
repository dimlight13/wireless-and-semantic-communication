export const metadata = {
  title: "5G L2 Error Recovery Mechanisms",
};

export function mount(root) {
  let mode = "AM";
  let noise = 70;
  let running = false;
  let packets = [1, 2, 3, 4].map((id) => ({ id, tx: "Waiting", mac: "Waiting", rlc: "Waiting" }));
  let rlcOutput = [];
  let arqRequest = false;
  let logs = [];
  const timers = new Set();

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }

  function clearTimers() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
  }

  function log(message) {
    const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    logs.unshift(`[${time}] ${message}`);
    logs = logs.slice(0, 12);
  }

  function resetState(keepLog = false) {
    clearTimers();
    running = false;
    packets = [1, 2, 3, 4].map((id) => ({ id, tx: "Waiting", mac: "Waiting", rlc: "Waiting" }));
    rlcOutput = [];
    arqRequest = false;
    if (!keepLog) logs = [];
  }

  function start() {
    resetState(true);
    running = true;
    logs = [];
    log(`${mode === "AM" ? "File download (RLC AM)" : "Real-time video (RLC UM)"} transmission started, noise ${noise}%`);
    render();

    [1, 2, 3, 4].forEach((id, index) => {
      schedule(() => sendPacket(id), 650 * index + 350);
    });
    schedule(handleRlc, 3600);
  }

  function sendPacket(id) {
    const packet = packets.find((item) => item.id === id);
    packet.tx = "Tx";
    packet.mac = "HARQ Processing";
    log(`Packet ${id}: entered the MAC HARQ loop`);
    render();

    if (id === 3) {
      schedule(() => {
        packet.mac = "Retransmission 1";
        log("Packet 3: CRC failed → HARQ retransmission 1");
        render();
      }, 350);
      schedule(() => {
        packet.mac = "Retransmission 2";
        log("Packet 3: high noise caused HARQ retransmission 2 to fail too");
        render();
      }, 700);
      schedule(() => {
        packet.mac = "Drop";
        packet.rlc = "Missing";
        log("Packet 3: MAC gave up recovery → Drop");
        render();
      }, 1050);
    } else {
      const delay = noise > 80 ? 520 : 300;
      schedule(() => {
        packet.mac = "ACK";
        packet.rlc = "Received";
        log(`Packet ${id}: HARQ ACK, forwarded to RLC`);
        render();
      }, delay);
    }
  }

  function handleRlc() {
    const missing = packets.some((packet) => packet.id === 3 && packet.rlc === "Missing");
    if (!missing) return;

    if (mode === "AM") {
      arqRequest = true;
      log("RLC AM: detected missing packet 3 → sent ARQ STATUS request");
      render();
      schedule(() => {
        const packet = packets.find((item) => item.id === 3);
        packet.tx = "ARQ Retransmission";
        packet.mac = "Received Again";
        packet.rlc = "ARQ Recovery";
        rlcOutput = [1, 2, 3, 4];
        running = false;
        log("RLC AM: received packet 3 again and restored the sequence");
        render();
      }, 1200);
    } else {
      arqRequest = false;
      packets.find((item) => item.id === 3).rlc = "Skipped";
      rlcOutput = [1, 2, 4];
      running = false;
      log("RLC UM: ignored the packet 3 gap and continued to packet 4");
      render();
    }
  }

  function packetCard(packet) {
    const cls = packet.mac === "Drop" ? "drop" : packet.mac === "ACK" || packet.rlc === "ARQ Recovery" ? "ok" : packet.mac.includes("Retransmission") ? "retry" : "";
    return `<div class="harq-packet ${cls}">
      <strong>Packet ${packet.id}</strong>
      <span>Tx side: ${packet.tx}</span>
      <span>MAC: ${packet.mac}</span>
      <span>RLC: ${packet.rlc}</span>
      ${packet.mac === "Drop" ? `<b class="drop-mark">X</b>` : ""}
    </div>`;
  }

  function render() {
    root.innerHTML = `
      <style>
        .harq-demo h2 { margin:0; font-size:32px; }
        .harq-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; }
        .harq-controls { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
        .harq-controls label { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:#fff; font-weight:900; }
        .noise-label strong { color:var(--red); font-size:22px; }
        .layer-flow { position:relative; display:grid; gap:14px; }
        .layer {
          position:relative;
          border:1px solid var(--line);
          border-radius:8px;
          background:#fff;
          padding:16px;
          min-height:150px;
          overflow:hidden;
        }
        .layer h3 { margin:0 0 12px; font-size:23px; }
        .packet-row { display:flex; flex-wrap:wrap; gap:10px; align-items:stretch; }
        .harq-packet {
          position:relative;
          min-width:145px;
          display:grid;
          gap:4px;
          padding:12px;
          border-radius:8px;
          border:2px solid #cbd6e4;
          background:#f1f5fa;
          animation:packetMove 360ms ease both;
        }
        .harq-packet strong { font-size:19px; }
        .harq-packet span { color:#526276; font-size:13px; font-weight:900; }
        .harq-packet.ok { background:#e4f8ec; border-color:#11865a; }
        .harq-packet.retry { background:#fff6df; border-color:#d9991d; animation:retryShake 520ms ease both; }
        .harq-packet.drop { background:#ffe8e8; border-color:#d94242; }
        .drop-mark {
          position:absolute;
          right:8px;
          top:6px;
          width:34px;
          height:34px;
          display:grid;
          place-items:center;
          border-radius:50%;
          background:#d94242;
          color:#fff;
          font-size:24px;
        }
        .arq-arrow {
          display:${arqRequest ? "grid" : "none"};
          position:absolute;
          left:48%;
          top:36%;
          width:180px;
          height:120px;
          place-items:center;
          border:3px dashed #6b43bd;
          border-left:0;
          border-bottom:0;
          color:#6b43bd;
          font-weight:900;
          animation:arrowPulse 700ms ease-in-out infinite;
          pointer-events:none;
        }
        .rlc-output { display:flex; flex-wrap:wrap; gap:9px; align-items:center; }
        .rlc-gap { min-width:82px; min-height:42px; display:grid; place-items:center; border:2px dashed #d94242; border-radius:8px; color:#a02828; font-weight:900; background:#fff0f0; }
        .mode-note { padding:12px; border-radius:8px; background:#f5f7fb; border:1px solid var(--line); font-weight:900; }
        @keyframes packetMove {
          from { opacity:0; transform:translateY(-16px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes retryShake {
          0%, 100% { transform:translateX(0); }
          25% { transform:translateX(-4px); }
          75% { transform:translateX(4px); }
        }
        @keyframes arrowPulse {
          0%, 100% { opacity:.55; }
          50% { opacity:1; }
        }
      </style>

      <div class="vis-panel harq-demo">
        <section>
          <h2>5G L2 Error Recovery: HARQ vs ARQ</h2>
          <p class="hint">After MAC HARQ drops packet 3, RLC AM fetches it again while UM skips it to reduce latency.</p>
        </section>

        <section class="vis-card harq-controls">
          <label><input type="radio" name="mode" value="AM" ${mode === "AM" ? "checked" : ""}> File download (RLC AM)</label>
          <label><input type="radio" name="mode" value="UM" ${mode === "UM" ? "checked" : ""}> Real-time video (RLC UM)</label>
          <label class="noise-label">Noise <strong>${noise}%</strong><input data-action="noise" type="range" min="0" max="100" value="${noise}"></label>
          <button class="vis-button primary" data-action="start" type="button">${running ? "Transmitting..." : "Start Transmission"}</button>
          <button class="vis-button" data-action="reset" type="button">Reset</button>
        </section>

        <section class="layer-flow">
          <div class="arq-arrow">ARQ Request<br>Retransmit Packet 3</div>

          <article class="layer">
            <h3>Top: transmitter packet queue</h3>
            <div class="packet-row">${packets.map((packet) => `<span class="packet-chip">Packet ${packet.id}</span>`).join("")}</div>
          </article>

          <article class="layer">
            <h3>Middle: MAC-layer HARQ loop</h3>
            <div class="packet-row">${packets.map(packetCard).join("")}</div>
          </article>

          <article class="layer">
            <h3>Bottom: RLC layer ${mode === "AM" ? "AM mode" : "UM mode"}</h3>
            <div class="mode-note">${mode === "AM" ? "AM: request missing packet 3 again with ARQ to restore the 1-2-3-4 order." : "UM: deliver 1-2-4 immediately without waiting for missing packet 3."}</div>
            <div class="rlc-output" style="margin-top:12px">
              ${rlcOutput.length ? rlcOutput.map((id) => `<span class="packet-chip">Packet ${id}</span>`).join("") : packets.map((packet) => packet.rlc === "Missing" || packet.rlc === "Skipped" ? `<span class="rlc-gap">No packet 3</span>` : (packet.rlc === "Received" ? `<span class="packet-chip">Packet ${packet.id}</span>` : "")).join("")}
              ${mode === "UM" && rlcOutput.length ? `<span class="rlc-gap">Packet 3 skipped</span>` : ""}
            </div>
          </article>
        </section>

        <section class="logbox">${logs.length ? logs.join("\\n") : "Press Start Transmission to show HARQ and ARQ processing logs."}</section>
      </div>
    `;

    root.querySelectorAll('input[name="mode"]').forEach((input) => {
      input.addEventListener("change", (event) => {
        mode = event.target.value;
        resetState();
        render();
      });
    });
    root.querySelector('[data-action="noise"]').addEventListener("input", (event) => {
      noise = Number(event.target.value);
      render();
    });
    root.querySelector('[data-action="start"]').addEventListener("click", start);
    root.querySelector('[data-action="reset"]').addEventListener("click", () => {
      resetState();
      render();
    });
  }

  render();
  return () => clearTimers();
}
