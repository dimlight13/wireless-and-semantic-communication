export const metadata = {
  title: "5G NR Uplink Protocol Stack Explorer",
};

const components = [
  {
    id: "rf",
    zone: "O-RU",
    layer: "Low-PHY 1",
    title: "RF Reception and ADC",
    subtitle: "Convert analog RF waves into I/Q samples",
    file: "O-RU/rf_adc_sampling.js",
    accent: "#245fd6",
    brief: "Downconvert the antenna RF signal to baseband and use the ADC to create digital I/Q samples.",
    feature: "This is the first O-RU stage. It converts continuous analog radio waves into a digital sample stream that can be processed by OFDM and beamforming blocks.",
    data: ["RF", "ADC", "I/Q"],
  },
  {
    id: "cp",
    zone: "O-RU",
    layer: "Low-PHY 2",
    title: "CP Removal",
    subtitle: "Separate the OFDM guard interval",
    file: "O-RU/cp_removal.js",
    accent: "#245fd6",
    brief: "Remove the Cyclic Prefix before the OFDM symbol and keep only the useful symbol samples.",
    feature: "The CP protects the symbol from multipath delay. The receiver removes this guard interval before feeding the symbol into the FFT.",
    data: ["CP+Symbol", "CP Removal", "Symbol"],
  },
  {
    id: "fft",
    zone: "O-RU",
    layer: "Low-PHY 3",
    title: "FFT",
    subtitle: "Convert time-domain signals into frequency-domain resources",
    file: "O-RU/fft_ofdm.js",
    accent: "#245fd6",
    brief: "Decompose the time-domain OFDM symbol into frequency-domain Resource Elements by subcarrier.",
    feature: "After the FFT, the combined time-domain waveform is expanded into subcarrier-level frequency resources. The O-DU High-PHY then processes symbols on those resources.",
    data: ["Time", "FFT", "Subcarrier"],
  },
  {
    id: "beamforming",
    zone: "O-RU",
    layer: "Low-PHY 4",
    title: "Digital Beamforming",
    subtitle: "Combine antenna-specific signals",
    file: "O-RU/digital_beamforming.js",
    accent: "#245fd6",
    brief: "Apply weights to frequency-domain signals from multiple antennas to strengthen the desired UE signal.",
    feature: "Beamforming mathematically combines observations from multiple antennas to improve SNR. The O-RU forwards the combined frequency-domain signal to the O-DU.",
    data: ["ANT", "Weight", "UE"],
  },
  {
    id: "eq",
    zone: "O-DU",
    layer: "High-PHY 1",
    title: "Channel Estimation & Equalization",
    subtitle: "Recover distortion",
    file: "O-DU/channel_estimation_equalization.js",
    accent: "#11865a",
    brief: "Use the channel estimate to correct fading, phase rotation, and amplitude distortion.",
    feature: "This is the first High-PHY stage for uplink reception. It moves channel-distorted QAM symbols back toward the original constellation points before demodulation.",
    data: ["Distorted Symbol", "Channel Estimate", "Equalized Symbol"],
  },
  {
    id: "demod",
    zone: "O-DU",
    layer: "High-PHY 2",
    title: "Demodulation",
    subtitle: "Extract LLR reliability values",
    file: "O-DU/qam_demodulation_llr.js",
    accent: "#11865a",
    brief: "Convert equalized QAM symbols into bit-level reliability values called LLRs.",
    feature: "The demodulator does not hard-decide 0 or 1 immediately. It outputs soft LLR information for each bit, which descrambling and LDPC decoding use next.",
    data: ["QAM", "LLR+", "LLR-"],
  },
  {
    id: "descrambling",
    zone: "O-DU",
    layer: "High-PHY 3",
    title: "Descrambling",
    subtitle: "Invert LLR signs",
    file: "O-DU/scrambling_descrambling_llr.js",
    accent: "#11865a",
    brief: "Invert the LLR sign wherever the scrambling code is 1 to recover the original bit reliability.",
    feature: "5G PHY descrambling is easy to miss if you only think of hard-bit XOR. Before LDPC decoding, it restores the original reliability by flipping LLR signs at code-1 positions.",
    data: ["LLR", "Code", "Sign Flip"],
  },
  {
    id: "rate",
    zone: "O-DU",
    layer: "High-PHY 4",
    title: "Rate Dematching",
    subtitle: "Restore codeblock positions",
    file: "O-DU/5g_rate_matching_dematchning.js",
    accent: "#11865a",
    brief: "Convert punctured or repeated LLRs back into the LDPC codeblock input format.",
    feature: "Positions missing because of limited radio resources are filled with Null LLRs, while repeated positions are combined. This reconstructs the codeblock layout expected by the LDPC decoder.",
    data: ["Resource LLR", "Null", "Combined"],
  },
  {
    id: "ldpc",
    zone: "O-DU",
    layer: "High-PHY 5",
    title: "LDPC Decoding",
    subtitle: "Correct errors and decide 0/1",
    file: "O-DU/ldpc_decoding.js",
    accent: "#11865a",
    brief: "Iteratively decode LLRs to correct errors and decide hard 0/1 bits.",
    feature: "LDPC decoding uses probabilistic LLRs to search for a valid codeword. When decoding converges, the soft information becomes the actual Transport Block bitstream.",
    data: ["LLR", "LDPC", "0/1"],
  },
  {
    id: "crc",
    zone: "O-DU",
    layer: "High-PHY 6",
    title: "CRC Check",
    subtitle: "Final integrity decision",
    file: "O-DU/parity_crc_comparison.js",
    accent: "#11865a",
    brief: "Verify with the CRC remainder that the bitstream decided by LDPC is valid.",
    feature: "Only CRC-passing blocks can move up to MAC. On failure, MAC HARQ performs retransmission or combining.",
    data: ["0/1 Bits", "CRC", "PASS/FAIL"],
  },
  {
    id: "harq",
    zone: "O-DU",
    layer: "MAC",
    title: "MAC HARQ",
    subtitle: "Fast retransmission recovery",
    file: "O-DU/MAC_HARQ_RLC_ARQ_comparison.js",
    accent: "#c86414",
    brief: "Handle ACK/NACK, retransmission, and soft combining for CRC-failed blocks.",
    feature: "When the High-PHY CRC result reaches MAC, HARQ attempts quick retransmission recovery. Losses that MAC gives up are handled later by the RLC policy.",
    data: ["CRC FAIL", "NACK", "HARQ"],
  },
  {
    id: "rlc_mac",
    zone: "O-DU",
    layer: "MAC / RLC",
    title: "RLC Entities and MAC Multiplexing",
    subtitle: "Manage per-service flows",
    file: "O-DU/rlc_mac_multiplexing.js",
    accent: "#11865a",
    brief: "Show how RLC flows with different service properties are connected to MAC transmission units.",
    feature: "Different traffic such as web data, voice, and RRC control uses different reliability or latency policies in each RLC entity before being mapped into MAC transmission units.",
    data: ["RLC", "LCID", "MAC TB"],
  },
  {
    id: "pdcp",
    zone: "O-CU",
    layer: "PDCP",
    title: "PDCP",
    subtitle: "Reordering · Deciphering · ROHC",
    file: "O-CU/pdcp_reordering_deciphering.js",
    accent: "#6b43bd",
    brief: "Reorder user data from RLC, decipher it, and restore compressed headers.",
    feature: "PDCP handles radio-link security and packet ordering. It reorders late packets, deciphers user data, and restores ROHC-compressed IP headers.",
    data: ["SN Reorder", "Deciphering", "ROHC"],
  },
  {
    id: "sdap",
    zone: "O-CU",
    layer: "SDAP",
    title: "SDAP",
    subtitle: "Map QoS Flows to DRBs and core paths",
    file: "O-CU/sdap_qos_mapping.js",
    accent: "#6b43bd",
    brief: "Classify completed IP packets into the right DRB and core path according to QoS Flow properties.",
    feature: "SDAP separates traffic with different service quality using 5QI and QFI. Voice, video, and generic data have different quality needs, so they are mapped to the right DRB and core path.",
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

    panel.innerHTML = '<div class="sim-loading">Loading the linked simulator.</div>';
    try {
      const module = await import(new URL(selected.file, import.meta.url).href);
      panel.innerHTML = "";
      cleanupSimulator = module.mount(panel) || null;
    } catch (error) {
      panel.innerHTML = `<div class="sim-error">Simulator load failed<br>${error.message}</div>`;
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
          <p>Follow the exact path of uplink receive data through O-RU, O-DU High-PHY, MAC/RLC, and O-CU while trying each core simulator.</p>
        </div>
        <div class="server-chip">Run: python main.py<br>URL: ${location.origin}</div>
      </header>

      <section class="workspace-grid">
        <div class="overview-column">
          <article class="stack-board" aria-label="5G NR uplink protocol stack overview">
            <div class="rrc-plane">
              <strong>RRC Control Plane</strong>
              <span>Access management · handover · radio configuration messages control the whole stack above the user-data flow</span>
            </div>
            <div class="flow-line"></div>
            <div class="moving-packet">RF</div>
            <div class="stack-lanes">
              <section class="zone" style="--zone-color:#245fd6">
                <header>
                  <h2>O-RU</h2>
                  <p>RF reception → CP removal → FFT → beamforming</p>
                </header>
                <div class="node-list node-list-balanced">
                  ${oruNodes.map((item) => componentButton(item, components.indexOf(item))).join("")}
                </div>
              </section>
              <section class="zone" style="--zone-color:#11865a">
                <header>
                  <h2>O-DU</h2>
                  <p>Equalization → demodulation → descrambling → rate dematching → LDPC → CRC → MAC</p>
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
          <div class="flow-note">Full sequence: RF reception → CP removal → FFT → beamforming → Channel Estimation & Equalization → Demodulation → Descrambling → Rate Dematching → LDPC Decoding → CRC Check → MAC → RLC/MAC → PDCP → SDAP</div>
        </div>

        <aside class="detail-panel" aria-label="Selected component detail simulator">
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
