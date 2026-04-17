export const metadata = {
  title: "5G NR Uplink Protocol Stack Explorer",
};

const components = [
  {
    id: "rf",
    zone: "O-RU",
    layer: "Low-PHY 1",
    title: "RF 수신 및 ADC",
    subtitle: "아날로그 전파를 I/Q 샘플로 변환",
    file: "O-RU/rf_adc_sampling.js",
    accent: "#245fd6",
    brief: "안테나가 받은 RF 신호를 기저대역으로 내리고 ADC를 통해 디지털 I/Q 샘플로 만듭니다.",
    feature: "O-RU의 첫 단계입니다. 공중에서 들어온 연속적인 아날로그 전파를 이후 OFDM 처리와 빔포밍이 가능한 디지털 샘플 스트림으로 바꿉니다.",
    data: ["RF", "ADC", "I/Q"],
  },
  {
    id: "cp",
    zone: "O-RU",
    layer: "Low-PHY 2",
    title: "CP 제거",
    subtitle: "OFDM 보호 구간 분리",
    file: "O-RU/cp_removal.js",
    accent: "#245fd6",
    brief: "OFDM 심볼 앞에 붙은 Cyclic Prefix를 제거해 실제 유효 심볼만 남깁니다.",
    feature: "CP는 다중경로 지연으로부터 심볼을 보호하기 위해 붙인 구간입니다. 수신 처리에서는 FFT에 넣기 전에 이 보호 구간을 떼어내야 합니다.",
    data: ["CP+심볼", "CP 제거", "심볼"],
  },
  {
    id: "fft",
    zone: "O-RU",
    layer: "Low-PHY 3",
    title: "FFT",
    subtitle: "시간축 신호를 주파수축 자원으로 변환",
    file: "O-RU/fft_ofdm.js",
    accent: "#245fd6",
    brief: "시간 영역 OFDM 심볼을 서브캐리어별 주파수 영역 Resource Element로 분해합니다.",
    feature: "FFT를 거치면 뭉쳐 있던 시간축 파형이 서브캐리어 단위의 주파수 자원으로 펼쳐집니다. 이후 O-DU High-PHY는 이 자원 단위의 심볼을 처리합니다.",
    data: ["Time", "FFT", "Subcarrier"],
  },
  {
    id: "beamforming",
    zone: "O-RU",
    layer: "Low-PHY 4",
    title: "디지털 빔포밍",
    subtitle: "안테나별 신호 결합",
    file: "O-RU/digital_beamforming.js",
    accent: "#245fd6",
    brief: "여러 안테나에서 받은 주파수 영역 신호에 가중치를 곱해 원하는 단말 신호를 강화합니다.",
    feature: "빔포밍은 여러 안테나의 관측값을 수학적으로 결합해 신호대잡음비를 높입니다. O-RU는 이 결합된 주파수 영역 신호를 O-DU로 넘깁니다.",
    data: ["ANT", "Weight", "UE"],
  },
  {
    id: "eq",
    zone: "O-DU",
    layer: "High-PHY 1",
    title: "Channel Estimation & Equalization",
    subtitle: "찌그러짐 복구",
    file: "O-DU/channel_estimation_equalization.js",
    accent: "#11865a",
    brief: "채널 추정값으로 페이딩, 위상 회전, 진폭 왜곡을 보정합니다.",
    feature: "업링크 수신의 High-PHY 첫 단계입니다. 무선 채널을 통과하며 찌그러진 QAM 심볼을 원래 별자리점에 가깝게 되돌린 뒤 복조기로 넘깁니다.",
    data: ["왜곡 심볼", "채널 추정", "등화 심볼"],
  },
  {
    id: "demod",
    zone: "O-DU",
    layer: "High-PHY 2",
    title: "Demodulation",
    subtitle: "LLR 확률값 추출",
    file: "O-DU/qam_demodulation_llr.js",
    accent: "#11865a",
    brief: "등화된 QAM 심볼을 비트별 신뢰도인 LLR 값으로 바꿉니다.",
    feature: "복조기는 바로 0과 1을 확정하지 않고, 각 비트가 0 또는 1일 가능성을 소프트 정보인 LLR로 출력합니다. 이후 디스크램블링과 LDPC 복호는 이 LLR을 사용합니다.",
    data: ["QAM", "LLR+", "LLR-"],
  },
  {
    id: "descrambling",
    zone: "O-DU",
    layer: "High-PHY 3",
    title: "Descrambling",
    subtitle: "LLR 부호 반전",
    file: "O-DU/scrambling_descrambling_llr.js",
    accent: "#11865a",
    brief: "스크램블링 코드가 1인 위치의 LLR 부호를 반전해 원래 비트 신뢰도로 되돌립니다.",
    feature: "5G PHY의 디스크램블링은 하드 비트 XOR만 떠올리면 놓치기 쉽습니다. LDPC 복호 전에는 코드 1 위치의 LLR 부호를 뒤집는 방식으로 원본 신뢰도를 복원합니다.",
    data: ["LLR", "코드", "부호 반전"],
  },
  {
    id: "rate",
    zone: "O-DU",
    layer: "High-PHY 4",
    title: "Rate Dematching",
    subtitle: "코드블록 위치 복원",
    file: "O-DU/5g_rate_matching_dematchning.js",
    accent: "#11865a",
    brief: "전송 자원에 맞춰 펑처링 또는 반복된 LLR을 LDPC 코드블록 입력 형태로 되돌립니다.",
    feature: "무선 자원이 부족해 사라진 위치는 Null LLR로 채우고, 반복된 위치는 결합합니다. 이 과정을 거쳐 LDPC 복호기가 기대하는 코드블록 배열이 만들어집니다.",
    data: ["자원 LLR", "Null", "Combined"],
  },
  {
    id: "ldpc",
    zone: "O-DU",
    layer: "High-PHY 5",
    title: "LDPC Decoding",
    subtitle: "에러 정정 및 0/1 확정",
    file: "O-DU/ldpc_decoding.js",
    accent: "#11865a",
    brief: "LLR을 반복 복호해 오류를 정정하고 하드 비트 0/1로 확정합니다.",
    feature: "LDPC 복호는 아직 확률값인 LLR을 이용해 가능한 코드워드를 찾아갑니다. 복호가 수렴하면 소프트 정보가 실제 Transport Block 비트열로 확정됩니다.",
    data: ["LLR", "LDPC", "0/1"],
  },
  {
    id: "crc",
    zone: "O-DU",
    layer: "High-PHY 6",
    title: "CRC 체크",
    subtitle: "최종 무결성 판정",
    file: "O-DU/parity_crc_comparison.js",
    accent: "#11865a",
    brief: "LDPC가 확정한 비트열이 정말 맞는지 CRC 나머지로 검증합니다.",
    feature: "CRC 체크가 통과해야 MAC 계층으로 올릴 수 있습니다. 실패하면 MAC HARQ가 재전송 또는 결합 복호 절차를 수행합니다.",
    data: ["0/1 비트", "CRC", "PASS/FAIL"],
  },
  {
    id: "harq",
    zone: "O-DU",
    layer: "MAC",
    title: "MAC HARQ",
    subtitle: "빠른 재전송 복구",
    file: "O-DU/MAC_HARQ_RLC_ARQ_comparison.js",
    accent: "#c86414",
    brief: "CRC 실패 블록에 대해 ACK/NACK, 재전송, 소프트 결합을 처리합니다.",
    feature: "High-PHY의 CRC 결과가 MAC으로 올라오면 HARQ가 짧은 시간 안에서 재전송 복구를 시도합니다. MAC이 포기한 손실은 이후 RLC 정책으로 넘어갑니다.",
    data: ["CRC FAIL", "NACK", "HARQ"],
  },
  {
    id: "rlc_mac",
    zone: "O-DU",
    layer: "MAC / RLC",
    title: "RLC 엔티티와 MAC 다중화",
    subtitle: "서비스별 흐름 관리",
    file: "O-DU/rlc_mac_multiplexing.js",
    accent: "#11865a",
    brief: "서비스 특성이 다른 RLC 흐름이 MAC 전송 단위와 연결되는 과정을 보여줍니다.",
    feature: "웹, 음성, RRC 제어처럼 성격이 다른 데이터는 각 RLC 엔티티에서 다른 신뢰성 또는 지연 정책을 가진 뒤 MAC 전송 단위와 연결됩니다.",
    data: ["RLC", "LCID", "MAC TB"],
  },
  {
    id: "pdcp",
    zone: "O-CU",
    layer: "PDCP",
    title: "PDCP",
    subtitle: "순서 정렬 · 복호화 · ROHC",
    file: "O-CU/pdcp_reordering_deciphering.js",
    accent: "#6b43bd",
    brief: "RLC에서 올라온 사용자 데이터를 순서대로 정렬하고, 암호를 풀며, 압축된 헤더를 복원합니다.",
    feature: "PDCP는 무선 구간의 보안과 패킷 순서를 담당합니다. 늦게 온 패킷을 재정렬하고, Deciphering으로 사용자 데이터를 복호화하며, ROHC로 압축된 IP 헤더를 복원합니다.",
    data: ["SN 정렬", "복호화", "ROHC"],
  },
  {
    id: "sdap",
    zone: "O-CU",
    layer: "SDAP",
    title: "SDAP",
    subtitle: "QoS Flow를 DRB와 코어망 경로로 매핑",
    file: "O-CU/sdap_qos_mapping.js",
    accent: "#6b43bd",
    brief: "완성된 IP 패킷을 QoS Flow 특성에 맞춰 적절한 DRB와 코어망 경로로 분류합니다.",
    feature: "SDAP은 5QI와 QFI를 기준으로 서비스 품질이 다른 트래픽을 구분합니다. 음성, 영상, 일반 데이터가 서로 다른 품질 요구사항을 가지므로 올바른 DRB와 코어망 경로로 매핑합니다.",
    data: ["QFI", "5QI", "DRB"],
  },
];

const simulatorMap = new Map(components.filter((item) => item.file).map((item) => [item.id, item]));
const flowOrder = components.map((item) => item.id);

export function mount(root) {
  let activeId = "rf";
  let cleanupSimulator = null;
  let packetIndex = 0;
  let packetTimer = null;

  function activeComponent() {
    return components.find((item) => item.id === activeId) || components[0];
  }

  function componentById(id) {
    return components.find((item) => item.id === id);
  }

  function startPacketFlow() {
    positionPacket();
    packetTimer = window.setInterval(() => {
      packetIndex = (packetIndex + 1) % flowOrder.length;
      positionPacket();
    }, 1200);
  }

  function positionPacket() {
    const packet = root.querySelector(".moving-packet");
    const current = componentById(flowOrder[packetIndex]);
    const marker = root.querySelector(`[data-node="${current.id}"]`);
    const board = root.querySelector(".stack-board");
    if (!packet || !marker || !board) return;

    const boardRect = board.getBoundingClientRect();
    const rect = marker.getBoundingClientRect();
    packet.style.left = `${rect.left - boardRect.left + rect.width / 2 - packet.offsetWidth / 2}px`;
    packet.style.top = `${rect.top - boardRect.top + rect.height / 2 - 18}px`;
    packet.textContent = current.data[0];
  }

  async function loadSimulator() {
    const selected = activeComponent();
    const panel = root.querySelector("#simulatorMount");
    const title = root.querySelector("#detailTitle");
    const meta = root.querySelector("#detailMeta");
    const feature = root.querySelector("#detailFeature");
    const chips = root.querySelector("#detailChips");

    title.textContent = selected.title;
    meta.textContent = `${selected.zone} · ${selected.layer}${selected.subtitle ? ` · ${selected.subtitle}` : ""}`;
    feature.textContent = selected.feature;
    chips.innerHTML = selected.data.map((item) => `<span>${item}</span>`).join("");

    if (typeof cleanupSimulator === "function") {
      cleanupSimulator();
      cleanupSimulator = null;
    }

    root.querySelectorAll("[data-component]").forEach((button) => {
      button.classList.toggle("active", button.dataset.component === activeId);
    });

    if (!selected.file) {
      panel.innerHTML = `
        <div class="placeholder-sim">
          <strong>${selected.title}</strong>
          <p>${selected.brief}</p>
          <div class="mini-flow">${selected.data.map((item) => `<span>${item}</span>`).join("<b>→</b>")}</div>
        </div>
      `;
      return;
    }

    panel.innerHTML = '<div class="sim-loading">연결된 시뮬레이터를 불러오는 중입니다.</div>';
    try {
      const module = await import(new URL(selected.file, import.meta.url).href);
      panel.innerHTML = "";
      cleanupSimulator = module.mount(panel) || null;
    } catch (error) {
      panel.innerHTML = `<div class="sim-error">시뮬레이터 로드 실패<br>${error.message}</div>`;
    }
  }

  function selectComponent(id) {
    activeId = id;
    loadSimulator();
  }

  function componentButton(item, index) {
    const hasSimulator = simulatorMap.has(item.id);
    return `
      <button class="stack-node ${hasSimulator ? "has-sim" : "overview-only"}" data-component="${item.id}" data-node="${item.id}" style="--node-accent:${item.accent}" type="button">
        <span class="node-meta"><span class="node-step">${index + 1}</span><span class="node-zone">${item.zone}</span></span>
        <strong>${item.title}</strong>
        <em>${item.subtitle || item.layer}</em>
      </button>
    `;
  }

  const oruNodes = components.filter((item) => item.zone === "O-RU");
  const oduNodes = components.filter((item) => item.zone === "O-DU");
  const ocuNodes = components.filter((item) => item.zone === "O-CU");

  root.innerHTML = `
    <style>
      .protocol-app { display:grid; gap:18px; }
      .protocol-header {
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:18px;
        align-items:end;
      }
      .protocol-header h1 { margin:0 0 8px; font-size:clamp(32px,3.6vw,58px); line-height:1.05; letter-spacing:0; }
      .protocol-header p { margin:0; color:var(--muted); font-size:clamp(16px,1.3vw,21px); line-height:1.45; font-weight:800; }
      .server-chip { padding:12px 14px; border:1px solid var(--line); border-radius:8px; background:#fff; color:#33465b; font-size:15px; font-weight:900; box-shadow:0 8px 26px rgba(20,33,47,.08); }
      .workspace-grid { display:grid; grid-template-columns:minmax(820px, 1fr) minmax(520px, .82fr); gap:18px; align-items:start; }
      .overview-column { display:grid; gap:12px; }
      .stack-board {
        position:relative;
        min-height:1160px;
        border:1px solid var(--line);
        border-radius:8px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.94), rgba(249,251,254,.98)),
          repeating-linear-gradient(90deg, transparent 0 72px, rgba(36,95,214,.035) 72px 73px);
        box-shadow:0 16px 42px rgba(20,33,47,.10);
        overflow:visible;
      }
      .rrc-plane {
        position:absolute;
        left:18px;
        right:18px;
        top:18px;
        min-height:82px;
        border:2px dashed rgba(200,100,20,.42);
        border-radius:8px;
        background:#fff7ed;
        padding:14px 16px;
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:center;
      }
      .rrc-plane strong { color:#8a400b; font-size:22px; }
      .rrc-plane span { color:#75491f; font-weight:900; line-height:1.35; }
      .stack-lanes {
        position:absolute;
        inset:124px 18px 18px;
        display:grid;
        grid-template-columns:.92fr 1.56fr .92fr;
        gap:14px;
        align-items:stretch;
      }
      .zone {
        display:grid;
        grid-template-rows:auto 1fr;
        gap:12px;
        border:2px solid color-mix(in srgb, var(--zone-color) 34%, #d8e0ea);
        border-radius:8px;
        background:color-mix(in srgb, var(--zone-color) 7%, #fff);
        padding:14px;
        min-height:0;
      }
      .zone h2 { margin:0; font-size:26px; color:var(--zone-color); }
      .zone p { margin:4px 0 0; color:#536579; font-weight:800; line-height:1.35; }
      .node-list { display:grid; gap:8px; align-content:start; min-height:0; }
      .node-list-balanced { align-content:center; }
      .stack-node {
        position:relative;
        width:100%;
        min-height:86px;
        display:grid;
        grid-template-columns:1fr;
        gap:5px;
        align-content:start;
        border:2px solid color-mix(in srgb, var(--node-accent) 22%, #d2dce8);
        border-radius:8px;
        background:#fff;
        color:var(--ink);
        padding:10px 11px;
        text-align:left;
        cursor:pointer;
        transition:transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }
      .stack-node:hover, .stack-node:focus-visible {
        outline:none;
        transform:translateY(-3px);
        border-color:var(--node-accent);
        box-shadow:0 14px 26px rgba(20,33,47,.13);
      }
      .stack-node.active {
        border-color:var(--node-accent);
        box-shadow:0 0 0 4px color-mix(in srgb, var(--node-accent) 18%, transparent), 0 16px 30px rgba(20,33,47,.13);
      }
      .node-meta { display:flex; align-items:center; gap:7px; min-width:0; }
      .node-step {
        width:32px;
        height:32px;
        flex:0 0 auto;
        display:grid;
        place-items:center;
        border-radius:50%;
        background:var(--node-accent);
        color:#fff;
        font-weight:900;
        font-size:14px;
      }
      .node-zone { min-width:0; width:max-content; max-width:100%; padding:4px 7px; border-radius:8px; background:color-mix(in srgb, var(--node-accent) 14%, #fff); color:var(--node-accent); font-weight:900; font-size:12px; overflow-wrap:anywhere; }
      .stack-node strong { min-width:0; font-size:15px; line-height:1.22; overflow-wrap:anywhere; word-break:keep-all; }
      .stack-node em { min-width:0; color:#4f6073; font-style:normal; font-weight:900; font-size:13px; line-height:1.22; overflow-wrap:anywhere; word-break:keep-all; }
      .flow-line {
        position:absolute;
        left:70px;
        right:70px;
        top:55%;
        height:7px;
        border-radius:99px;
        background:linear-gradient(90deg, #245fd6, #11865a 58%, #6b43bd);
        opacity:.23;
      }
      .flow-note {
        position:static;
        padding:10px 12px;
        border-radius:8px;
        background:#f5f9ff;
        border:1px solid #d6e3f5;
        color:#33465b;
        font-weight:900;
        line-height:1.35;
        box-shadow:0 8px 22px rgba(20,33,47,.06);
      }
      .moving-packet {
        position:absolute;
        z-index:5;
        min-width:96px;
        max-width:150px;
        height:36px;
        display:grid;
        place-items:center;
        border-radius:8px;
        background:#14212f;
        color:#fff;
        font-size:12px;
        font-weight:900;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        padding:0 12px;
        box-shadow:0 14px 28px rgba(20,33,47,.28);
        left:60px;
        top:360px;
        transition:left 700ms ease, top 700ms ease;
      }
      .detail-panel {
        min-height:1160px;
        display:grid;
        grid-template-rows:auto minmax(0,1fr);
        border:1px solid var(--line);
        border-radius:8px;
        background:#fff;
        box-shadow:0 16px 42px rgba(20,33,47,.10);
        overflow:hidden;
      }
      .detail-head { display:grid; gap:10px; padding:18px; border-bottom:1px solid var(--line); background:#fbfdff; }
      .detail-head small { color:var(--blue); font-size:15px; font-weight:900; }
      .detail-head h2 { margin:0; font-size:30px; line-height:1.12; }
      .detail-head p { margin:0; color:#33465b; font-weight:800; line-height:1.45; }
      .detail-chips { display:flex; flex-wrap:wrap; gap:8px; }
      .detail-chips span { padding:7px 9px; border-radius:8px; background:#eef3fa; color:#26384b; font-weight:900; }
      .simulator-shell { min-height:860px; overflow:auto; padding:16px; background:#f7f9fc; }
      .sim-loading, .sim-error, .placeholder-sim {
        min-height:520px;
        display:grid;
        place-items:center;
        gap:12px;
        text-align:center;
        border:1px solid var(--line);
        border-radius:8px;
        background:#fff;
        padding:24px;
        color:var(--muted);
        font-weight:900;
      }
      .sim-error { color:var(--red); }
      .placeholder-sim strong { color:var(--ink); font-size:28px; }
      .placeholder-sim p { max-width:520px; margin:0; line-height:1.45; }
      .mini-flow { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:center; }
      .mini-flow span { padding:10px 12px; border-radius:8px; background:#eef3fa; color:#25384b; }
      @media (max-width: 1420px) {
        .workspace-grid { grid-template-columns:1fr; }
        .stack-board, .detail-panel { min-height:1160px; }
      }
      @media (max-width: 820px) {
        .protocol-header { grid-template-columns:1fr; }
        .stack-board { height:auto; min-height:0; overflow:visible; }
        .rrc-plane, .stack-lanes, .flow-line, .moving-packet { position:relative; inset:auto; left:auto; right:auto; top:auto; bottom:auto; }
        .stack-lanes { display:grid; grid-template-columns:1fr; padding:0 14px 14px; }
        .rrc-plane { margin:14px; display:grid; }
        .flow-line, .moving-packet { display:none; }
        .detail-panel { min-height:auto; }
      }
    </style>

    <div class="protocol-app">
      <header class="protocol-header">
        <div>
          <h1>5G NR Uplink Protocol Stack Explorer</h1>
          <p>업링크 수신 데이터가 O-RU, O-DU High-PHY, MAC/RLC, O-CU를 통과하는 순서를 정확히 따라가며 각 컴포넌트의 핵심 시뮬레이터를 확인합니다.</p>
        </div>
        <div class="server-chip">실행: python main.py<br>주소: ${location.origin}</div>
      </header>

      <section class="workspace-grid">
        <div class="overview-column">
          <article class="stack-board" aria-label="5G NR 업링크 프로토콜 스택 개요도">
            <div class="rrc-plane">
              <strong>RRC Control Plane</strong>
              <span>접속 관리 · 핸드오버 · 무선 설정 메시지는 사용자 데이터 흐름 위에서 전체 스택 제어</span>
            </div>
            <div class="flow-line"></div>
            <div class="moving-packet">RF</div>
            <div class="stack-lanes">
              <section class="zone" style="--zone-color:#245fd6">
                <header>
                  <h2>O-RU</h2>
                  <p>RF 수신 → CP 제거 → FFT → 빔포밍</p>
                </header>
                <div class="node-list node-list-balanced">
                  ${oruNodes.map((item) => componentButton(item, components.indexOf(item))).join("")}
                </div>
              </section>
              <section class="zone" style="--zone-color:#11865a">
                <header>
                  <h2>O-DU</h2>
                  <p>등화 → 복조 → 디스크램블링 → 레이트 디매칭 → LDPC → CRC → MAC</p>
                </header>
                <div class="node-list">
                  ${oduNodes.map((item) => componentButton(item, components.indexOf(item))).join("")}
                </div>
              </section>
              <section class="zone" style="--zone-color:#6b43bd">
                <header>
                  <h2>O-CU</h2>
                  <p>PDCP → SDAP</p>
                </header>
                <div class="node-list node-list-balanced">
                  ${ocuNodes.map((item) => componentButton(item, components.indexOf(item))).join("")}
                </div>
              </section>
            </div>
          </article>
          <div class="flow-note">전체 순서: RF 수신 → CP 제거 → FFT → 빔포밍 → Channel Estimation & Equalization → Demodulation → Descrambling → Rate Dematching → LDPC Decoding → CRC 체크 → MAC → RLC/MAC → PDCP → SDAP</div>
        </div>

        <aside class="detail-panel" aria-label="선택한 컴포넌트 상세 시뮬레이터">
          <header class="detail-head">
            <small id="detailMeta"></small>
            <h2 id="detailTitle"></h2>
            <p id="detailFeature"></p>
            <div class="detail-chips" id="detailChips"></div>
          </header>
          <section class="simulator-shell" id="simulatorMount"></section>
        </aside>
      </section>
    </div>
  `;

  root.querySelectorAll("[data-component]").forEach((button) => {
    button.addEventListener("click", () => selectComponent(button.dataset.component));
  });

  loadSimulator();
  startPacketFlow();

  return () => {
    if (packetTimer) window.clearInterval(packetTimer);
    if (typeof cleanupSimulator === "function") cleanupSimulator();
  };
}
