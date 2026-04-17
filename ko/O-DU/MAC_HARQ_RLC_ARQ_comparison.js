export const metadata = {
  title: "5G L2 에러 복구 메커니즘",
};

export function mount(root) {
  let mode = "AM";
  let noise = 70;
  let running = false;
  let packets = [1, 2, 3, 4].map((id) => ({ id, tx: "대기", mac: "대기", rlc: "대기" }));
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
    packets = [1, 2, 3, 4].map((id) => ({ id, tx: "대기", mac: "대기", rlc: "대기" }));
    rlcOutput = [];
    arqRequest = false;
    if (!keepLog) logs = [];
  }

  function start() {
    resetState(true);
    running = true;
    logs = [];
    log(`${mode === "AM" ? "파일 다운로드(RLC AM)" : "실시간 영상(RLC UM)"} 전송 시작, 노이즈 ${noise}%`);
    render();

    [1, 2, 3, 4].forEach((id, index) => {
      schedule(() => sendPacket(id), 650 * index + 350);
    });
    schedule(handleRlc, 3600);
  }

  function sendPacket(id) {
    const packet = packets.find((item) => item.id === id);
    packet.tx = "송신";
    packet.mac = "HARQ 처리";
    log(`패킷 ${id}: MAC HARQ 루프 진입`);
    render();

    if (id === 3) {
      schedule(() => {
        packet.mac = "재전송 1";
        log("패킷 3: CRC 실패 → HARQ 재전송 1");
        render();
      }, 350);
      schedule(() => {
        packet.mac = "재전송 2";
        log("패킷 3: 노이즈가 높아 HARQ 재전송 2도 실패");
        render();
      }, 700);
      schedule(() => {
        packet.mac = "Drop";
        packet.rlc = "누락";
        log("패킷 3: MAC이 복구 포기 → Drop");
        render();
      }, 1050);
    } else {
      const delay = noise > 80 ? 520 : 300;
      schedule(() => {
        packet.mac = "ACK";
        packet.rlc = "수신";
        log(`패킷 ${id}: HARQ ACK, RLC로 전달`);
        render();
      }, delay);
    }
  }

  function handleRlc() {
    const missing = packets.some((packet) => packet.id === 3 && packet.rlc === "누락");
    if (!missing) return;

    if (mode === "AM") {
      arqRequest = true;
      log("RLC AM: 3번 누락 감지 → ARQ STATUS 요청 송신");
      render();
      schedule(() => {
        const packet = packets.find((item) => item.id === 3);
        packet.tx = "ARQ 재송신";
        packet.mac = "재수신";
        packet.rlc = "ARQ 복구";
        rlcOutput = [1, 2, 3, 4];
        running = false;
        log("RLC AM: 3번 패킷을 다시 받아 순서 복구 완료");
        render();
      }, 1200);
    } else {
      arqRequest = false;
      packets.find((item) => item.id === 3).rlc = "생략";
      rlcOutput = [1, 2, 4];
      running = false;
      log("RLC UM: 3번 빈 공간을 무시하고 4번으로 진행");
      render();
    }
  }

  function packetCard(packet) {
    const cls = packet.mac === "Drop" ? "drop" : packet.mac === "ACK" || packet.rlc === "ARQ 복구" ? "ok" : packet.mac.includes("재전송") ? "retry" : "";
    return `<div class="harq-packet ${cls}">
      <strong>패킷 ${packet.id}</strong>
      <span>송신단: ${packet.tx}</span>
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
          <h2>5G L2 에러 복구 메커니즘: HARQ vs ARQ</h2>
          <p class="hint">MAC HARQ가 3번 패킷을 Drop한 뒤, RLC AM은 다시 가져오고 UM은 지연을 줄이기 위해 생략합니다.</p>
        </section>

        <section class="vis-card harq-controls">
          <label><input type="radio" name="mode" value="AM" ${mode === "AM" ? "checked" : ""}> 파일 다운로드(RLC AM)</label>
          <label><input type="radio" name="mode" value="UM" ${mode === "UM" ? "checked" : ""}> 실시간 영상(RLC UM)</label>
          <label class="noise-label">노이즈 <strong>${noise}%</strong><input data-action="noise" type="range" min="0" max="100" value="${noise}"></label>
          <button class="vis-button primary" data-action="start" type="button">${running ? "전송 중..." : "전송 시작"}</button>
          <button class="vis-button" data-action="reset" type="button">초기화</button>
        </section>

        <section class="layer-flow">
          <div class="arq-arrow">ARQ 요청<br>3번 재전송</div>

          <article class="layer">
            <h3>상단: 송신단 패킷 대기열</h3>
            <div class="packet-row">${packets.map((packet) => `<span class="packet-chip">패킷 ${packet.id}</span>`).join("")}</div>
          </article>

          <article class="layer">
            <h3>중단: MAC 계층 HARQ 루프</h3>
            <div class="packet-row">${packets.map(packetCard).join("")}</div>
          </article>

          <article class="layer">
            <h3>하단: RLC 계층 ${mode === "AM" ? "AM 모드" : "UM 모드"}</h3>
            <div class="mode-note">${mode === "AM" ? "AM: 누락된 3번을 ARQ로 다시 요청하여 1-2-3-4 순서를 맞춥니다." : "UM: 누락된 3번을 기다리지 않고 1-2-4를 바로 전달합니다."}</div>
            <div class="rlc-output" style="margin-top:12px">
              ${rlcOutput.length ? rlcOutput.map((id) => `<span class="packet-chip">패킷 ${id}</span>`).join("") : packets.map((packet) => packet.rlc === "누락" || packet.rlc === "생략" ? `<span class="rlc-gap">3번 없음</span>` : (packet.rlc === "수신" ? `<span class="packet-chip">패킷 ${packet.id}</span>` : "")).join("")}
              ${mode === "UM" && rlcOutput.length ? `<span class="rlc-gap">3번 생략</span>` : ""}
            </div>
          </article>
        </section>

        <section class="logbox">${logs.length ? logs.join("\\n") : "전송 시작 버튼을 누르면 HARQ와 ARQ 처리 로그가 표시됩니다."}</section>
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
