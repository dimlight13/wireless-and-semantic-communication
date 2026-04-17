export const metadata = {
  title: "Semantic Communication Explorer",
};

const blocks = [
  {
    id: "encoder",
    side: "Tx",
    role: "Meaning Extraction",
    title: "sLLM Encoder",
    subtitle: "Sentence/image → key tokens",
    accent: "#6b43bd",
    file: "semcom/semantic_encoder.js",
    brief: "A small LLM extracts only meaning-bearing tokens from the original message. It compresses by concepts rather than sending every word as character-level bits.",
    feature: "Conventional communication treats every bit equally, while the sLLM Encoder weights semantically important tokens and sharply reduces transmission bandwidth.",
    io: ["Original sentence/image", "Token sequence"],
  },
  {
    id: "vq",
    side: "Tx",
    role: "Digital Conversion",
    title: "Vector Quantization",
    subtitle: "Continuous embedding → codebook index",
    accent: "#1a8a9d",
    file: "semcom/vector_quantization.js",
    brief: "Map an embedding vector to the index of the nearest codebook centroid so it becomes compatible with existing bit-based digital networks.",
    feature: "VQ is a bridge layer that converts continuous AI vector output into discrete bitstreams that existing 5G/LTE modems can carry.",
    io: ["Embedding vector", "Codebook index · bits"],
  },
  {
    id: "world",
    side: "Tx",
    role: "Predictive Transmission",
    title: "World Model",
    subtitle: "Channel prediction + transmission strategy",
    accent: "#c86414",
    file: "semcom/world_model_channel.js",
    brief: "Predict channel state, UE mobility, and interference to adjust modulation, code rate, and token priority in real time.",
    feature: "It enables Unequal Error Protection: important semantic tokens use lower-order modulation and stronger FEC, while auxiliary tokens use more efficient modes.",
    io: ["Channel feedback", "Modulation · code rate · token priority"],
  },
  {
    id: "channel",
    side: "Channel",
    role: "Radio Channel",
    title: "Existing RAN Pipeline",
    subtitle: "FEC · modulation · channel · demodulation",
    accent: "#245fd6",
    file: null,
    brief: "The data passes through the normal 5G NR uplink path: LDPC coding → QAM modulation → radio channel (fading/noise) → demodulation → descrambling.",
    feature: "Semantic Communication is a hybrid structure that keeps the existing communication stack and adds a semantic layer on top.",
    io: ["Bitstream", "Received bits (some errors)"],
  },
  {
    id: "decoder",
    side: "Rx",
    role: "Intelligent Restoration",
    title: "sLLM Decoder + KB",
    subtitle: "Damaged bits → meaning inference",
    accent: "#11865a",
    file: "semcom/semantic_decoder.js",
    brief: "Even if some received codebook indices are corrupted, the Knowledge Base uses context and semantic similarity to infer and restore the original tokens.",
    feature: "In conventional communication, CRC FAIL means retransmission; the Semantic Decoder can still find the most plausible meaning in the KB from damaged bits.",
    io: ["Noisy indices", "Restored meaning"],
  },
  {
    id: "compare",
    side: "Benchmark",
    role: "Comparison Experiment",
    title: "Bit-Com vs Sem-Com",
    subtitle: "Compare both methods at the same SNR",
    accent: "#c93e7a",
    file: "semcom/semcom_vs_bitcom.js",
    brief: "Compare conventional and semantic communication side by side using the same sentence and channel noise condition.",
    feature: "BER measures only bit errors, while Semantic Similarity measures preserved meaning. The gap between these metrics is the key value of Sem-Com.",
    io: ["Original message", "BER · Semantic Similarity"],
  },
];

export function mount(root) {
  let activeId = "encoder";
  let cleanupSub = null;
  let journeyTimer = null;
  let journeyStage = 0;
  let journeyPlaying = true;

  const TOTAL_STAGES = 5;

  function byId(id) {
    return blocks.find((b) => b.id === id);
  }

  function startJourney() {
    stopJourney();
    journeyTimer = window.setInterval(() => {
      journeyStage = (journeyStage + 1) % TOTAL_STAGES;
      updateJourney();
    }, 2200);
  }

  function stopJourney() {
    if (journeyTimer) {
      window.clearInterval(journeyTimer);
      journeyTimer = null;
    }
  }

  function setJourneyStage(n) {
    journeyStage = ((n % TOTAL_STAGES) + TOTAL_STAGES) % TOTAL_STAGES;
    updateJourney();
  }

  function updateJourney() {
    const indicator = root.querySelector(".journey-indicator");
    if (indicator) indicator.textContent = `Step ${journeyStage + 1} / ${TOTAL_STAGES}`;
    root.querySelectorAll("[data-stage-col]").forEach((el) => {
      const s = Number(el.dataset.stageCol);
      el.classList.toggle("active", s === journeyStage);
      el.classList.toggle("past", s < journeyStage);
    });
    const playBtn = root.querySelector('[data-journey="play"]');
    if (playBtn) playBtn.textContent = journeyPlaying ? "⏸ Auto" : "▶ Auto";
  }

  async function loadSub() {
    const sel = byId(activeId);
    const panel = root.querySelector("#semMount");
    const title = root.querySelector("#semTitle");
    const meta = root.querySelector("#semMeta");
    const brief = root.querySelector("#semBrief");
    const feature = root.querySelector("#semFeature");
    const io = root.querySelector("#semIO");

    title.textContent = sel.title;
    meta.textContent = `${sel.side} · ${sel.role} · ${sel.subtitle}`;
    brief.textContent = sel.brief;
    feature.textContent = sel.feature;
    io.innerHTML = `<span>Input: ${sel.io[0]}</span><b>→</b><span>Output: ${sel.io[1]}</span>`;

    if (typeof cleanupSub === "function") {
      cleanupSub();
      cleanupSub = null;
    }

    root.querySelectorAll("[data-block]").forEach((el) => {
      el.classList.toggle("active", el.dataset.block === activeId);
    });

    if (!sel.file) {
      panel.innerHTML = `
        <div class="sub-placeholder">
          <strong>${sel.title}</strong>
          <p>${sel.brief}</p>
          <p style="color:var(--muted);font-size:13px">This block uses the existing 5G NR uplink pipeline as-is. Detailed simulations are available in the Protocol Stack Explorer from <code>python main.py</code>.</p>
        </div>
      `;
      return;
    }
    panel.innerHTML = '<div class="sub-loading">Loading simulator.</div>';
    try {
      const module = await import(new URL(`../${sel.file}`, import.meta.url).href);
      panel.innerHTML = "";
      cleanupSub = module.mount(panel) || null;
    } catch (error) {
      panel.innerHTML = `<div class="sub-error">Load failed<br>${error.message}</div>`;
    }
  }

  function selectBlock(id) {
    activeId = id;
    loadSub();
  }

  function blockButton(block, index) {
    return `
      <button class="sem-block" data-block="${block.id}" style="--accent:${block.accent}" type="button">
        <span class="sem-block-head">
          <span class="sem-step">${index + 1}</span>
          <span class="sem-side">${block.side}</span>
        </span>
        <strong>${block.title}</strong>
        <em>${block.subtitle}</em>
        <div class="sem-role">${block.role}</div>
      </button>
    `;
  }

  root.innerHTML = `
    <style>
      .sem-app { display:grid; gap:18px; }
      .sem-header {
        display:grid; grid-template-columns:minmax(0,1fr) auto; gap:18px; align-items:end;
      }
      .sem-header h1 { margin:0 0 8px; font-size:clamp(30px,3.6vw,54px); line-height:1.05; letter-spacing:0; }
      .sem-header p { margin:0; color:var(--muted); font-size:clamp(15px,1.3vw,20px); line-height:1.45; font-weight:800; }
      .server-chip { padding:12px 14px; border:1px solid var(--line); border-radius:8px; background:#fff; color:#33465b; font-size:15px; font-weight:900; box-shadow:0 8px 26px rgba(20,33,47,.08); }
      .sem-grid { display:grid; grid-template-columns:minmax(820px, 1fr) minmax(520px, .85fr); gap:18px; align-items:start; }
      .sem-board {
        position:relative; min-height:760px;
        border:1px solid var(--line); border-radius:8px; padding:24px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.96), rgba(249,251,254,.98)),
          radial-gradient(circle at 22% 8%, rgba(107,67,189,.08), transparent 30%),
          radial-gradient(circle at 78% 82%, rgba(26,138,157,.08), transparent 28%);
        box-shadow:0 16px 42px rgba(20,33,47,.10);
      }
      .sem-board h2 { margin:0 0 8px; font-size:22px; }
      .sem-board p.sub { margin:0 0 14px; color:var(--muted); font-weight:800; line-height:1.4; }
      .sem-lanes { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:14px; }
      .sem-lane { padding:10px 12px; border-radius:8px; background:#fff; border:1px solid var(--line); }
      .sem-lane h3 { margin:0 0 6px; font-size:14px; letter-spacing:.4px; text-transform:uppercase; }
      .sem-lane .blocks { display:grid; gap:8px; }
      .sem-block {
        position:relative; text-align:left; width:100%;
        display:grid; gap:5px;
        padding:12px 12px 16px;
        border:2px solid color-mix(in srgb, var(--accent) 24%, #d2dce8);
        border-radius:10px; background:#fff; cursor:pointer;
        transition:transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        min-height:110px;
      }
      .sem-block:hover { transform:translateY(-2px); border-color:var(--accent); box-shadow:0 10px 22px rgba(20,33,47,.12); }
      .sem-block.active { border-color:var(--accent); box-shadow:0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent), 0 14px 26px rgba(20,33,47,.14); }
      .sem-block-head { display:flex; gap:7px; align-items:center; }
      .sem-step { width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:var(--accent); color:#fff; font-weight:900; font-size:13px; }
      .sem-side { padding:3px 7px; border-radius:6px; background:color-mix(in srgb, var(--accent) 14%, #fff); color:var(--accent); font-weight:900; font-size:11px; letter-spacing:.3px; }
      .sem-block strong { font-size:15px; line-height:1.22; }
      .sem-block em { color:#4f6073; font-style:normal; font-weight:900; font-size:12px; }
      .sem-block .sem-role { position:absolute; right:10px; bottom:8px; font-size:10px; font-weight:900; color:var(--accent); letter-spacing:.3px; }

      .sem-lane.tx { background:linear-gradient(180deg,#fdfbff,#f7f4ff); border-color:#e2d9f3; }
      .sem-lane.tx h3 { color:#6b43bd; }
      .sem-lane.ch { background:linear-gradient(180deg,#f6fcff,#eef7ff); border-color:#cfe1f3; }
      .sem-lane.ch h3 { color:#245fd6; }
      .sem-lane.rx { background:linear-gradient(180deg,#f7fff8,#effaf1); border-color:#cfe7d7; }
      .sem-lane.rx h3 { color:#11865a; }

      .sem-arrows { text-align:center; margin:8px 0; color:#a0aec0; font-size:22px; font-weight:900; }

      /* ===== Journey Hero ===== */
      .sem-journey {
        margin:0 0 18px;
        padding:16px 18px 20px;
        border-radius:12px;
        background:linear-gradient(180deg,#ffffff,#f5f1ff 55%, #f0f8fb);
        border:1px solid #e0d7f0;
        box-shadow:0 10px 28px rgba(20,33,47,.08);
      }
      .sem-journey-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
      .sem-journey-head h3 { margin:0; font-size:19px; color:#14212f; }
      .sem-journey-head p { margin:0; color:#4f6073; font-size:13px; font-weight:800; line-height:1.4; }
      .sem-journey-ctrl { display:flex; gap:6px; align-items:center; }
      .sem-journey-ctrl .vis-button { min-height:34px; padding:6px 12px; font-size:12px; }
      .journey-indicator { font-weight:900; color:#6b43bd; font-size:13px; padding:0 8px; }

      .journey-grid {
        display:grid;
        grid-template-columns: 120px repeat(${TOTAL_STAGES}, minmax(0, 1fr));
        gap:6px;
      }
      .journey-grid .jh {
        padding:8px 10px; border-radius:8px;
        background:#fff; border:2px solid #e0d7f0;
        font-weight:900; text-align:center; font-size:13px; color:#35475d;
        transition:background 200ms ease, border-color 200ms ease, transform 200ms ease;
      }
      .journey-grid .jh.active { background:#6b43bd; border-color:#4f2a9c; color:#fff; transform:translateY(-2px); box-shadow:0 10px 20px rgba(107,67,189,.32); }
      .journey-grid .jh.past { background:#ede4fb; color:#4f2a9c; }
      .journey-grid .track-tag {
        display:grid; place-items:center; padding:10px 8px; border-radius:8px;
        font-weight:900; font-size:13px; text-align:center; line-height:1.2;
      }
      .journey-grid .track-tag.trad { background:#fff0f0; color:#a02828; border:2px solid #e1b5b5; }
      .journey-grid .track-tag.sem { background:#e6f4ec; color:#0d6744; border:2px solid #a9d7bd; }

      .journey-grid .cell {
        padding:10px 10px 12px; border-radius:8px;
        background:#fff; border:1.5px solid #e4eaf3;
        display:grid; gap:4px; text-align:center; min-height:92px;
        transition:border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease, opacity 220ms ease;
        opacity:.52;
      }
      .journey-grid .cell.active { opacity:1; border-color:#6b43bd; box-shadow:0 8px 22px rgba(107,67,189,.22); transform:translateY(-2px); }
      .journey-grid .cell.past { opacity:1; }
      .journey-grid .cell .icon { font-size:22px; line-height:1; }
      .journey-grid .cell .big { font-weight:900; font-size:13px; color:#14212f; line-height:1.3; }
      .journey-grid .cell .mono { font-family:Consolas, monospace; font-size:10px; color:#35475d; line-height:1.4; font-weight:900; word-break:break-all; padding:4px 5px; background:#f7faff; border-radius:4px; }
      .journey-grid .cell .mono .flip { color:#d94242; background:#ffe8e8; padding:0 2px; border-radius:2px; }
      .journey-grid .cell small { font-size:10px; color:#607083; font-weight:900; }
      .journey-grid .cell.bad { background:#fff6f6; border-color:#e1b5b5; }
      .journey-grid .cell.bad .big { color:#a02828; }
      .journey-grid .cell.good { background:#f2faf3; border-color:#a9d7bd; }
      .journey-grid .cell.good .big { color:#0d6744; }
      .journey-grid .tok-row { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; }
      .journey-grid .tok {
        padding:5px 8px; border-radius:999px; background:#eef3fa; border:1.5px solid #cbd6e4;
        font-size:11px; font-weight:900; color:#35475d;
      }
      .journey-grid .tok.ok { background:#e4f8ec; border-color:#11865a; color:#0d6744; }
      .journey-grid .tok.err { background:#ffe8e8; border-color:#d94242; color:#a02828; text-decoration:line-through; }
      .journey-grid .tok.recov { background:#fff6db; border-color:#d9991d; color:#8a4f03; }
      .journey-hint { margin-top:10px; padding:8px 12px; border-radius:8px; background:#fff; border:1px dashed #cbb7e8; color:#4f2a9c; font-size:12px; font-weight:900; line-height:1.5; }
      @media (max-width: 1100px) {
        .journey-grid { grid-template-columns:90px repeat(${TOTAL_STAGES}, minmax(0,1fr)); }
        .journey-grid .cell { min-height:84px; }
      }
      @media (max-width: 820px) {
        .journey-grid { grid-template-columns:1fr; }
        .journey-grid .jh, .journey-grid .track-tag { text-align:left; }
      }

      .sem-detail {
        min-height:760px; display:grid; grid-template-rows:auto minmax(0,1fr);
        border:1px solid var(--line); border-radius:8px; background:#fff;
        box-shadow:0 16px 42px rgba(20,33,47,.10); overflow:hidden;
      }
      .sem-detail-head { display:grid; gap:10px; padding:18px; border-bottom:1px solid var(--line); background:#fbfdff; }
      .sem-detail-head small { color:#6b43bd; font-size:14px; font-weight:900; letter-spacing:.4px; }
      .sem-detail-head h2 { margin:0; font-size:28px; line-height:1.1; }
      .sem-detail-head p { margin:0; color:#33465b; font-weight:800; line-height:1.4; }
      .sem-detail-feature { padding:10px 12px; background:#f7f2ff; border:1px solid #dfd1f3; border-radius:8px; color:#4f2a9c; font-weight:900; line-height:1.4; font-size:13px; }
      .sem-io { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-weight:900; font-size:12px; }
      .sem-io span { padding:5px 8px; border-radius:6px; background:#eef3fa; color:#26384b; }
      .sem-io b { color:#94a4ba; }
      .sem-sub { padding:16px; background:#f7f9fc; overflow:auto; min-height:520px; }
      .sub-placeholder, .sub-loading, .sub-error {
        min-height:460px; display:grid; place-items:center; text-align:center;
        padding:24px; color:var(--muted); font-weight:900;
        border:1px dashed var(--line); border-radius:8px; background:#fff; gap:8px;
      }
      .sub-placeholder strong { color:var(--ink); font-size:24px; }
      .sub-error { color:var(--red); border-color:var(--red); }

      .sem-thesis { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:12px; }
      .sem-thesis-card { padding:12px; border-radius:8px; background:#fff; border:1px solid var(--line); }
      .sem-thesis-card h4 { margin:0 0 6px; font-size:14px; color:#0f1b2b; }
      .sem-thesis-card p { margin:0; font-size:12px; color:#4f6073; line-height:1.4; font-weight:800; }

      @media (max-width: 1420px) {
        .sem-grid { grid-template-columns:1fr; }
        .sem-board, .sem-detail { min-height:auto; }
      }
      @media (max-width: 820px) {
        .sem-header { grid-template-columns:1fr; }
        .sem-lanes { grid-template-columns:1fr; }
        .sem-thesis { grid-template-columns:1fr; }
      }
    </style>

    <div class="sem-app">
      <header class="sem-header">
        <div>
          <h1>Semantic Communication Explorer</h1>
          <p>A hybrid communication framework that uses AI (sLLM) and knowledge (KB) to transmit meaning instead of raw bits. Click each block to run an interactive simulator.</p>
        </div>
        <div class="server-chip">Run: python semcom.py<br>URL: ${location.origin}</div>
      </header>

      <section class="sem-grid">
        <article class="sem-board">
          <h2>End-to-End Semantic Pipeline</h2>
          <p class="sub">It sits on existing 5G infrastructure as a three-stage structure: Tx (meaning extraction, conversion, prediction) → existing RAN channel → Rx (context-based restoration).</p>

          <section class="sem-journey" aria-label="Semantic communication intuitive comparison">
            <header class="sem-journey-head">
              <div>
                <h3>At a Glance: Send the Same Message Two Ways</h3>
                <p>Original: <b style="color:#6b43bd">"A red apple is on the dining table"</b> · Channel condition: same (SNR ~8 dB, BER ~1%)</p>
              </div>
              <div class="sem-journey-ctrl">
                <button class="vis-button" data-journey="prev" type="button">◀ Previous</button>
                <span class="journey-indicator">Step ${journeyStage + 1} / ${TOTAL_STAGES}</span>
                <button class="vis-button" data-journey="next" type="button">Next ▶</button>
                <button class="vis-button primary" data-journey="play" type="button">${journeyPlaying ? "⏸ Auto" : "▶ Auto"}</button>
              </div>
            </header>

            <div class="journey-grid">
              <div data-stage-col="-1" class="track-tag" style="background:#fff;border:none;color:#607083;font-size:11px">stage →</div>
              <div data-stage-col="0" class="jh">1. Original</div>
              <div data-stage-col="1" class="jh">2. Encoder</div>
              <div data-stage-col="2" class="jh">3. Channel (Noise)</div>
              <div data-stage-col="3" class="jh">4. Decoder</div>
              <div data-stage-col="4" class="jh">5. Restored Result</div>

              <!-- Bit-Com row -->
              <div class="track-tag trad">Traditional<br>Bit-Com</div>
              <div data-stage-col="0" class="cell">
                <div class="icon">💬</div>
                <div class="big">"A red apple is on the dining table"</div>
                <small>Plain text sentence</small>
              </div>
              <div data-stage-col="1" class="cell">
                <div class="icon">🔢</div>
                <div class="mono">11101010 10111001<br>10000000 10001011<br>11101000 10000010…</div>
                <small>UTF-8 → <b>240 bits</b></small>
              </div>
              <div data-stage-col="2" class="cell">
                <div class="icon">📡🌊</div>
                <div class="mono">111<span class="flip">1</span>1010 10111001<br>100000<span class="flip">1</span>0 10001011<br>11<span class="flip">0</span>01000 100000<span class="flip">0</span>0…</div>
                <small>BER ~1% → <b>4 bits flipped</b></small>
              </div>
              <div data-stage-col="3" class="cell">
                <div class="icon">🧮</div>
                <div class="big">Decode raw UTF-8</div>
                <small>Broken bits → broken characters</small>
              </div>
              <div data-stage-col="4" class="cell bad">
                <div class="icon">❌</div>
                <div class="big">"A r�d ap�le on the ta�le..."</div>
                <small>Broken characters → CRC FAIL → retransmission needed</small>
              </div>

              <!-- Sem-Com row -->
              <div class="track-tag sem">Semantic<br>Sem-Com</div>
              <div data-stage-col="0" class="cell">
                <div class="icon">💬</div>
                <div class="big">"A red apple is on the dining table"</div>
                <small>Same original message</small>
              </div>
              <div data-stage-col="1" class="cell">
                <div class="icon">🧠</div>
                <div class="tok-row">
                  <span class="tok ok">🍎 apple</span>
                  <span class="tok ok">red</span>
                  <span class="tok ok">table</span>
                </div>
                <small>sLLM key tokens → <b>30 bits</b> (8× compression)</small>
              </div>
              <div data-stage-col="2" class="cell">
                <div class="icon">📡🌊</div>
                <div class="tok-row">
                  <span class="tok err">🍐 pear</span>
                  <span class="tok ok">red</span>
                  <span class="tok ok">table</span>
                </div>
                <small>Only one token index is slightly flipped</small>
              </div>
              <div data-stage-col="3" class="cell">
                <div class="icon">📚</div>
                <div class="big">KB contextual inference</div>
                <small>"red + table" → 'apple' fits 99% better than 'pear'</small>
              </div>
              <div data-stage-col="4" class="cell good">
                <div class="icon">✅</div>
                <div class="tok-row">
                  <span class="tok recov">🍎 apple</span>
                  <span class="tok ok">red</span>
                  <span class="tok ok">table</span>
                </div>
                <small>Semantic similarity <b>99%</b> · no retransmission</small>
              </div>
            </div>

            <div class="journey-hint">
              💡 Key point: <b>Bit-Com</b>breaks under only a few noisy bits because it insists on exact character bits. <b>Sem-Com</b>sends semantic units, so the KB can correct a wrong token from context.
            </div>
          </section>

          <div class="sem-lanes">
            <section class="sem-lane tx">
              <h3>Tx · Transmitter</h3>
              <div class="blocks">
                ${blocks.filter((b) => b.side === "Tx").map((b, i) => blockButton(b, i)).join("")}
              </div>
            </section>
            <section class="sem-lane ch">
              <h3>Channel · Existing RAN</h3>
              <div class="blocks">
                ${blocks.filter((b) => b.side === "Channel").map((b) => blockButton(b, blocks.indexOf(b))).join("")}
              </div>
            </section>
            <section class="sem-lane rx">
              <h3>Rx · Receiver / Comparison</h3>
              <div class="blocks">
                ${blocks.filter((b) => b.side === "Rx" || b.side === "Benchmark").map((b) => blockButton(b, blocks.indexOf(b))).join("")}
              </div>
            </section>
          </div>

          <div class="sem-thesis">
            <div class="sem-thesis-card">
              <h4>① Extreme Efficiency</h4>
              <p>Sending semantic units instead of raw bits can reduce bandwidth by tens to hundreds of times, which is decisive for SAGIN/satellite links.</p>
            </div>
            <div class="sem-thesis-card">
              <h4>② Robustness</h4>
              <p>Infer damaged bits through KB context. Semantic Similarity can stay high even when BER is high.</p>
            </div>
            <div class="sem-thesis-card">
              <h4>③ Context-Awareness</h4>
              <p>The World Model predicts the channel and adjusts modulation, code rate, and priority in real time, helping high mobility and dense urban scenarios.</p>
            </div>
          </div>
        </article>

        <aside class="sem-detail" aria-label="Selected block detail">
          <header class="sem-detail-head">
            <small id="semMeta"></small>
            <h2 id="semTitle"></h2>
            <p id="semBrief"></p>
            <div class="sem-detail-feature" id="semFeature"></div>
            <div class="sem-io" id="semIO"></div>
          </header>
          <section class="sem-sub" id="semMount"></section>
        </aside>
      </section>
    </div>
  `;

  root.querySelectorAll("[data-block]").forEach((btn) => {
    btn.addEventListener("click", () => selectBlock(btn.dataset.block));
  });

  root.querySelector('[data-journey="prev"]')?.addEventListener("click", () => {
    journeyPlaying = false;
    stopJourney();
    setJourneyStage(journeyStage - 1);
  });
  root.querySelector('[data-journey="next"]')?.addEventListener("click", () => {
    journeyPlaying = false;
    stopJourney();
    setJourneyStage(journeyStage + 1);
  });
  root.querySelector('[data-journey="play"]')?.addEventListener("click", () => {
    journeyPlaying = !journeyPlaying;
    if (journeyPlaying) startJourney();
    else stopJourney();
    updateJourney();
  });

  loadSub();
  updateJourney();
  if (journeyPlaying) startJourney();

  return () => {
    stopJourney();
    if (typeof cleanupSub === "function") cleanupSub();
  };
}
