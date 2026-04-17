export const metadata = {
  title: "sLLM Encoder: 의미 추출",
};

export function mount(root) {
  const presets = [
    "오늘 저녁에 강남역 근처에서 친구들과 피자를 먹기로 했다",
    "빨갛게 익은 사과가 식탁 위 바구니에 담겨 있다",
    "서울 2호선 상행선 열차가 10분 뒤 도착 예정이다",
    "폭우 때문에 내일 오전 회의는 온라인으로 진행합니다",
  ];

  const stopwords = new Set(["이", "가", "은", "는", "을", "를", "의", "에", "에서", "과", "와", "도", "로", "으로", "에게", "께서", "한", "한다", "했다", "합니다", "진행", "합니다"]);

  const importanceMap = {
    "저녁": 0.9, "강남역": 0.95, "친구들": 0.8, "피자": 0.95, "먹기로": 0.85,
    "빨갛게": 0.7, "익은": 0.65, "사과": 0.95, "바구니": 0.7, "식탁": 0.6,
    "서울": 0.75, "2호선": 0.9, "상행선": 0.85, "열차": 0.9, "10분": 0.85, "도착": 0.8,
    "폭우": 0.95, "내일": 0.9, "오전": 0.75, "회의": 0.9, "온라인": 0.95,
    "근처": 0.4, "담겨": 0.5, "예정이다": 0.5, "때문에": 0.3, "있다": 0.3,
  };

  const state = {
    text: presets[0],
    topK: 5,
    showEmbedding: true,
  };

  function tokenize(text) {
    const words = text.split(/\s+/).filter(Boolean);
    return words.map((w) => {
      const core = w.replace(/[.,!?]/g, "");
      const imp = importanceMap[core] ?? (stopwords.has(core) ? 0.1 : 0.4);
      return { word: w, core, importance: imp, isStop: stopwords.has(core) };
    });
  }

  function pseudoEmbedding(token, idx) {
    let h1 = 0;
    let h2 = 0;
    for (let i = 0; i < token.core.length; i += 1) {
      h1 = (h1 * 31 + token.core.charCodeAt(i)) % 997;
      h2 = (h2 * 17 + token.core.charCodeAt(i) * 3) % 991;
    }
    const angle = (h1 / 997) * 2 * Math.PI + idx * 0.03;
    const radius = 0.3 + token.importance * 0.6 + (h2 / 991) * 0.05;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  }

  function render() {
    const tokens = tokenize(state.text);
    const sorted = [...tokens].sort((a, b) => b.importance - a.importance);
    const topTokens = sorted.slice(0, state.topK).filter((t) => t.importance > 0.2);
    const topSet = new Set(topTokens.map((t) => t.core));

    const utf8Bytes = new TextEncoder().encode(state.text).length;
    const traditionalBits = utf8Bytes * 8;
    const tokenBits = topTokens.length * 10;
    const compression = traditionalBits / Math.max(tokenBits, 1);

    const embedSize = 300;
    const points = topTokens.map((t, i) => ({ ...t, ...pseudoEmbedding(t, i) }));

    function embedSvg() {
      const CX = embedSize / 2;
      const CY = embedSize / 2;
      const R = embedSize * 0.4;
      return `
        <svg viewBox="0 0 ${embedSize} ${embedSize}" class="se-embed">
          <rect width="${embedSize}" height="${embedSize}" fill="#fbfdff"/>
          <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#d8e0ea" stroke-dasharray="3 3"/>
          <circle cx="${CX}" cy="${CY}" r="${R * 0.6}" fill="none" stroke="#e6ecf3" stroke-dasharray="2 3"/>
          <line x1="0" y1="${CY}" x2="${embedSize}" y2="${CY}" stroke="#e6ecf3"/>
          <line x1="${CX}" y1="0" x2="${CX}" y2="${embedSize}" stroke="#e6ecf3"/>
          ${points.map((p, i) => {
            const px = CX + p.x * R;
            const py = CY - p.y * R;
            return `
              <line x1="${CX}" y1="${CY}" x2="${px}" y2="${py}" stroke="#cbb7e8" stroke-width="0.8" opacity="0.6"/>
              <circle cx="${px}" cy="${py}" r="${6 + p.importance * 4}" fill="#6b43bd" opacity="${0.35 + p.importance * 0.55}"/>
              <text x="${px + 8}" y="${py + 4}" font-size="11" font-weight="900" fill="#4f2a9c">${p.core}</text>
            `;
          }).join("")}
          <text x="${CX}" y="14" text-anchor="middle" font-size="10" fill="#607083" font-weight="900">의미 임베딩 공간 (2D 투영)</text>
        </svg>
      `;
    }

    root.innerHTML = `
      <style>
        .se-demo h2 { margin:0; font-size:26px; }
        .se-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .se-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .se-card h3 { margin:0 0 6px; font-size:16px; color:#1d2c3f; }
        .se-card p.sub { margin:0; color:#607083; font-size:12px; font-weight:800; }
        .se-input { width:100%; padding:10px 12px; border-radius:8px; border:2px solid #d6dfec; font-size:15px; font-weight:800; color:#14212f; background:#fbfdff; }
        .se-presets { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
        .se-presets button { font-size:12px; padding:6px 9px; }
        .se-tokens { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .se-token {
          padding:8px 10px; border-radius:8px; background:#f1f5fa;
          border:2px solid #d6dfec; font-weight:900; font-size:13px;
          color:#35475d; display:grid; gap:2px; min-width:60px; text-align:center;
        }
        .se-token.top { background:#f3edfc; border-color:#6b43bd; color:#4f2a9c; box-shadow:0 6px 14px rgba(107,67,189,.2); }
        .se-token.stop { opacity:.45; }
        .se-token small { font-size:10px; color:#607083; font-weight:900; }
        .se-token.top small { color:#6b43bd; }
        .se-top-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
        .se-top-chip {
          padding:10px 14px; border-radius:999px; font-weight:900; font-size:14px;
          background:#6b43bd; color:#fff; box-shadow:0 6px 16px rgba(107,67,189,.32);
          animation:semPop 280ms ease both;
        }
        @keyframes semPop { from { opacity:0; transform:translateY(4px) scale(.9); } to { opacity:1; transform:translateY(0) scale(1); } }
        .se-metrics { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px; margin-top:10px; }
        .se-metric { padding:10px 12px; border-radius:8px; background:#f1f5fa; border:1px solid #d6dfec; }
        .se-metric b { display:block; font-size:20px; color:#0f1b2b; }
        .se-metric small { color:#607083; font-weight:900; font-size:11px; }
        .se-metric.good { background:#eef9f2; border-color:#a9d7bd; }
        .se-metric.good b { color:#0d6744; }
        .se-split { display:grid; grid-template-columns:${embedSize + 20}px 1fr; gap:16px; align-items:start; margin-top:10px; }
        @media (max-width:780px) { .se-split { grid-template-columns:1fr; } }
        .se-embed { width:${embedSize}px; max-width:100%; display:block; background:#fbfdff; border-radius:8px; border:1px solid #d8e0ea; }
        .se-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:8px; margin-top:8px; }
        .se-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
      </style>

      <div class="vis-panel se-demo">
        <section>
          <h2>sLLM Encoder: 문장에서 의미만 뽑아내기</h2>
          <p class="hint">소형 LLM은 조사·어미·흔한 단어는 버리고 문맥의 핵심 토큰만 남깁니다. 압축된 토큰 수가 곧 전송해야 할 '의미의 부피'입니다.</p>
        </section>

        <section class="se-card">
          <h3>① 입력 메시지</h3>
          <input class="se-input" value="${state.text.replace(/"/g, "&quot;")}" data-input/>
          <div class="se-presets">
            ${presets.map((p, i) => `<button class="vis-button" data-preset="${i}" type="button">${p.slice(0, 18)}…</button>`).join("")}
          </div>

          <div class="se-controls">
            <label>Top-K 유지 토큰 수: <b>${state.topK}</b>
              <input type="range" min="1" max="10" step="1" value="${state.topK}" data-control="topK"/>
            </label>
          </div>
        </section>

        <section class="se-card">
          <h3>② 토큰별 중요도 (sLLM attention 추정치)</h3>
          <p class="sub">Top-K에 선택된 토큰만 실제 전송합니다. 나머지는 수신단 KB가 문맥으로 채웁니다.</p>
          <div class="se-tokens">
            ${tokens.map((t) => `
              <div class="se-token ${topSet.has(t.core) ? "top" : ""} ${t.isStop ? "stop" : ""}">
                <b>${t.word}</b>
                <small>${(t.importance * 100).toFixed(0)}%</small>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="se-card">
          <h3>③ 전송 토큰 시퀀스</h3>
          <div class="se-top-row">
            ${topTokens.length === 0 ? `<small style="color:#607083;font-weight:900">중요 토큰이 없습니다. 문장을 더 길게 입력하세요.</small>` : topTokens.map((t) => `<span class="se-top-chip">${t.core}</span>`).join("")}
          </div>

          <div class="se-split">
            ${embedSvg()}
            <div>
              <h3>④ 압축 효율</h3>
              <div class="se-metrics">
                <div class="se-metric">
                  <small>전통 통신 (UTF-8)</small>
                  <b>${traditionalBits} bits</b>
                  <small>${utf8Bytes} bytes · 비트 단위</small>
                </div>
                <div class="se-metric good">
                  <small>Semantic (Top-K 토큰)</small>
                  <b>${tokenBits} bits</b>
                  <small>${topTokens.length} tokens × 10 bits</small>
                </div>
                <div class="se-metric good">
                  <small>압축비</small>
                  <b>${compression.toFixed(1)}×</b>
                  <small>원본 대비</small>
                </div>
              </div>
              <p style="margin-top:10px; font-size:12px; color:#4f6073; font-weight:800; line-height:1.4">
                → 선택된 토큰들은 다음 단계 <b>Vector Quantization</b>에서 코드북 인덱스로 변환됩니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    `;

    root.querySelector("[data-input]")?.addEventListener("input", (e) => {
      state.text = e.target.value;
      render();
    });
    root.querySelectorAll("[data-preset]").forEach((el) => {
      el.addEventListener("click", () => {
        state.text = presets[Number(el.dataset.preset)];
        render();
      });
    });
    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });
  }

  render();
  return () => {};
}
