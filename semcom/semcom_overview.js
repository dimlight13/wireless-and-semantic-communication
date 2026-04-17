export const metadata = {
  title: "Semantic Communication Explorer",
};

const blocks = [
  {
    id: "encoder",
    side: "Tx",
    role: "의미 추출",
    title: "sLLM Encoder",
    subtitle: "문장·이미지 → 핵심 토큰",
    accent: "#6b43bd",
    file: "semcom/semantic_encoder.js",
    brief: "소형 LLM이 원본 메시지에서 의미를 담은 토큰만 추출합니다. 단어를 글자 단위 비트로 보내지 않고 '개념' 단위로 압축합니다.",
    feature: "전통 통신은 모든 비트를 동등하게 취급하지만, sLLM Encoder는 의미적으로 중요한 토큰에 가중치를 두어 전송 대역폭을 극적으로 줄입니다.",
    io: ["원본 문장/이미지", "토큰 시퀀스"],
  },
  {
    id: "vq",
    side: "Tx",
    role: "디지털 변환",
    title: "Vector Quantization",
    subtitle: "연속 임베딩 → 코드북 인덱스",
    accent: "#1a8a9d",
    file: "semcom/vector_quantization.js",
    brief: "임베딩 벡터를 가장 가까운 코드북 중심점의 인덱스로 매핑해 기존 디지털 통신망(비트)과 호환되게 만듭니다.",
    feature: "VQ는 AI의 연속 벡터 출력을 기존 5G/LTE 모뎀이 받아들일 수 있는 이산 비트열로 변환하는 브리지 계층입니다.",
    io: ["임베딩 벡터", "코드북 인덱스 · 비트"],
  },
  {
    id: "world",
    side: "Tx",
    role: "예측 전송",
    title: "World Model",
    subtitle: "채널 예측 + 전송 전략",
    accent: "#c86414",
    file: "semcom/world_model_channel.js",
    brief: "채널 상태·UE 이동성·간섭을 예측해 변조 방식, 코드율, 토큰 우선순위를 실시간으로 조정합니다.",
    feature: "중요한 의미 토큰은 낮은 변조·강한 FEC로, 부가 토큰은 더 효율적인 모드로 보내는 Unequal Error Protection을 가능하게 합니다.",
    io: ["채널 피드백", "변조 · 코드율 · 토큰 우선순위"],
  },
  {
    id: "channel",
    side: "Channel",
    role: "무선 채널",
    title: "기존 RAN 파이프라인",
    subtitle: "FEC · 변조 · 채널 · 복조",
    accent: "#245fd6",
    file: null,
    brief: "LDPC 부호화 → QAM 변조 → 무선 채널(페이딩·잡음) → 복조 → 디스크램블링 등 5G NR Uplink 과정을 그대로 통과합니다.",
    feature: "Semantic Communication은 기존 통신 스택을 버리지 않고 그 위에 의미 계층을 덧씌우는 하이브리드 구조입니다.",
    io: ["비트열", "수신 비트 (일부 오류 포함)"],
  },
  {
    id: "decoder",
    side: "Rx",
    role: "지능형 복원",
    title: "sLLM Decoder + KB",
    subtitle: "손상 비트 → 의미 추론",
    accent: "#11865a",
    file: "semcom/semantic_decoder.js",
    brief: "수신한 코드북 인덱스가 일부 깨져도 Knowledge Base의 문맥과 의미 유사도로 원래 토큰을 유추해 복원합니다.",
    feature: "기존 통신의 CRC FAIL은 곧 재전송이지만, Semantic 복호기는 손상된 비트로도 KB 사전에서 가장 그럴듯한 의미를 찾아냅니다.",
    io: ["노이즈 섞인 인덱스", "복원된 의미"],
  },
  {
    id: "compare",
    side: "Benchmark",
    role: "비교 실험",
    title: "Bit-Com vs Sem-Com",
    subtitle: "동일 SNR에서 두 방식 비교",
    accent: "#c93e7a",
    file: "semcom/semcom_vs_bitcom.js",
    brief: "같은 문장과 같은 채널 잡음 조건에서 전통 통신과 시맨틱 통신의 성능을 나란히 비교합니다.",
    feature: "BER은 비트 오류율만 측정하지만, Semantic Similarity는 의미 유사도를 측정합니다. 이 두 지표의 차이가 semcom의 핵심 가치입니다.",
    io: ["원본 메시지", "BER · Semantic Similarity"],
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
    if (playBtn) playBtn.textContent = journeyPlaying ? "⏸ 자동" : "▶ 자동";
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
    io.innerHTML = `<span>입력: ${sel.io[0]}</span><b>→</b><span>출력: ${sel.io[1]}</span>`;

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
          <p style="color:var(--muted);font-size:13px">이 블록은 기존 5G NR Uplink 파이프라인을 그대로 사용합니다. 세부 시뮬레이션은 <code>python main.py</code>의 Protocol Stack Explorer에서 확인할 수 있습니다.</p>
        </div>
      `;
      return;
    }
    panel.innerHTML = '<div class="sub-loading">시뮬레이터를 불러오는 중입니다.</div>';
    try {
      const module = await import(`/scripts/${sel.file}?v=${Date.now()}`);
      panel.innerHTML = "";
      cleanupSub = module.mount(panel) || null;
    } catch (error) {
      panel.innerHTML = `<div class="sub-error">로드 실패<br>${error.message}</div>`;
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
          <p>AI(sLLM)와 지식(KB)을 활용해 '비트'가 아닌 '의미'를 전송하는 하이브리드 통신 프레임워크. 각 블록을 눌러 인터랙티브 시뮬레이터를 실행하세요.</p>
        </div>
        <div class="server-chip">실행: python semcom.py<br>주소: ${location.origin}</div>
      </header>

      <section class="sem-grid">
        <article class="sem-board">
          <h2>End-to-End Semantic Pipeline</h2>
          <p class="sub">Tx (의미 추출·변환·예측) → 기존 RAN 채널 → Rx (문맥 기반 복원) 의 3단 구조로 기존 5G 인프라 위에 얹힙니다.</p>

          <section class="sem-journey" aria-label="Semantic 통신 직관 비교">
            <header class="sem-journey-head">
              <div>
                <h3>한눈에 보기: 같은 메시지를 두 방식으로 보내보기</h3>
                <p>원본: <b style="color:#6b43bd">"빨간 사과가 식탁 위에 있다"</b> · 채널 조건: 동일 (SNR ~8 dB, BER ~1%)</p>
              </div>
              <div class="sem-journey-ctrl">
                <button class="vis-button" data-journey="prev" type="button">◀ 이전</button>
                <span class="journey-indicator">Step ${journeyStage + 1} / ${TOTAL_STAGES}</span>
                <button class="vis-button" data-journey="next" type="button">다음 ▶</button>
                <button class="vis-button primary" data-journey="play" type="button">${journeyPlaying ? "⏸ 자동" : "▶ 자동"}</button>
              </div>
            </header>

            <div class="journey-grid">
              <div data-stage-col="-1" class="track-tag" style="background:#fff;border:none;color:#607083;font-size:11px">stage →</div>
              <div data-stage-col="0" class="jh">① 원본</div>
              <div data-stage-col="1" class="jh">② 인코더</div>
              <div data-stage-col="2" class="jh">③ 채널 (노이즈)</div>
              <div data-stage-col="3" class="jh">④ 디코더</div>
              <div data-stage-col="4" class="jh">⑤ 복원 결과</div>

              <!-- Bit-Com row -->
              <div class="track-tag trad">전통<br>Bit-Com</div>
              <div data-stage-col="0" class="cell">
                <div class="icon">💬</div>
                <div class="big">"빨간 사과가 식탁 위에 있다"</div>
                <small>한글 문장 그대로</small>
              </div>
              <div data-stage-col="1" class="cell">
                <div class="icon">🔢</div>
                <div class="mono">11101010 10111001<br>10000000 10001011<br>11101000 10000010…</div>
                <small>UTF-8 → <b>240 bits</b></small>
              </div>
              <div data-stage-col="2" class="cell">
                <div class="icon">📡🌊</div>
                <div class="mono">111<span class="flip">1</span>1010 10111001<br>100000<span class="flip">1</span>0 10001011<br>11<span class="flip">0</span>01000 100000<span class="flip">0</span>0…</div>
                <small>BER ~1% → <b>4 bit 뒤집힘</b></small>
              </div>
              <div data-stage-col="3" class="cell">
                <div class="icon">🧮</div>
                <div class="big">UTF-8 그대로 디코드</div>
                <small>깨진 비트 → 깨진 문자</small>
              </div>
              <div data-stage-col="4" class="cell bad">
                <div class="icon">❌</div>
                <div class="big">"빨� 삵과� 식�� 위에…"</div>
                <small>문자 깨짐 → CRC FAIL → 재전송 필요</small>
              </div>

              <!-- Sem-Com row -->
              <div class="track-tag sem">시맨틱<br>Sem-Com</div>
              <div data-stage-col="0" class="cell">
                <div class="icon">💬</div>
                <div class="big">"빨간 사과가 식탁 위에 있다"</div>
                <small>같은 원본 메시지</small>
              </div>
              <div data-stage-col="1" class="cell">
                <div class="icon">🧠</div>
                <div class="tok-row">
                  <span class="tok ok">🍎 사과</span>
                  <span class="tok ok">🔴 빨강</span>
                  <span class="tok ok">🪑 식탁</span>
                </div>
                <small>sLLM 핵심 토큰 → <b>30 bits</b> (8× 압축)</small>
              </div>
              <div data-stage-col="2" class="cell">
                <div class="icon">📡🌊</div>
                <div class="tok-row">
                  <span class="tok err">🍐 배</span>
                  <span class="tok ok">🔴 빨강</span>
                  <span class="tok ok">🪑 식탁</span>
                </div>
                <small>1 token 인덱스만 살짝 뒤집힘</small>
              </div>
              <div data-stage-col="3" class="cell">
                <div class="icon">📚</div>
                <div class="big">KB 문맥 추론</div>
                <small>"빨간 + 식탁" → '배'보다 '사과' 99% 적합</small>
              </div>
              <div data-stage-col="4" class="cell good">
                <div class="icon">✅</div>
                <div class="tok-row">
                  <span class="tok recov">🍎 사과</span>
                  <span class="tok ok">🔴 빨강</span>
                  <span class="tok ok">🪑 식탁</span>
                </div>
                <small>의미 유사도 <b>99%</b> · 재전송 없음</small>
              </div>
            </div>

            <div class="journey-hint">
              💡 핵심: <b>Bit-Com</b>은 '글자의 정확한 비트'를 고집하다 노이즈 몇 개에도 무너집니다. <b>Sem-Com</b>은 '의미 단위'만 보내므로 토큰이 잘못 와도 KB가 문맥으로 바로잡습니다.
            </div>
          </section>

          <div class="sem-lanes">
            <section class="sem-lane tx">
              <h3>Tx · 송신단</h3>
              <div class="blocks">
                ${blocks.filter((b) => b.side === "Tx").map((b, i) => blockButton(b, i)).join("")}
              </div>
            </section>
            <section class="sem-lane ch">
              <h3>Channel · 기존 RAN</h3>
              <div class="blocks">
                ${blocks.filter((b) => b.side === "Channel").map((b) => blockButton(b, blocks.indexOf(b))).join("")}
              </div>
            </section>
            <section class="sem-lane rx">
              <h3>Rx · 수신단 / 비교</h3>
              <div class="blocks">
                ${blocks.filter((b) => b.side === "Rx" || b.side === "Benchmark").map((b) => blockButton(b, blocks.indexOf(b))).join("")}
              </div>
            </section>
          </div>

          <div class="sem-thesis">
            <div class="sem-thesis-card">
              <h4>① Extreme Efficiency</h4>
              <p>비트 단위가 아닌 의미 단위 전송으로 수십~수백 배 대역폭 절감. SAGIN/위성 링크에서 결정적.</p>
            </div>
            <div class="sem-thesis-card">
              <h4>② Robustness</h4>
              <p>KB 문맥으로 손상 비트를 추론. BER이 높아도 Semantic Similarity는 유지.</p>
            </div>
            <div class="sem-thesis-card">
              <h4>③ Context-Awareness</h4>
              <p>World Model이 채널을 예측해 변조·코드율·우선순위를 실시간 조정. 고속 이동과 밀집 도심에 유리.</p>
            </div>
          </div>
        </article>

        <aside class="sem-detail" aria-label="선택 블록 상세">
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
