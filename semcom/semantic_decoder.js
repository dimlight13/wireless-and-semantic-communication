export const metadata = {
  title: "sLLM Decoder + KB: 의미 복원",
};

export function mount(root) {
  // Knowledge Base: token -> semantically similar neighbors with similarity score
  const KB = {
    "사과": [{ t: "사과", s: 1.0 }, { t: "배", s: 0.72 }, { t: "복숭아", s: 0.68 }, { t: "과일", s: 0.85 }, { t: "빨간색", s: 0.55 }],
    "폭우": [{ t: "폭우", s: 1.0 }, { t: "비", s: 0.88 }, { t: "호우", s: 0.95 }, { t: "강우", s: 0.85 }, { t: "날씨", s: 0.6 }],
    "회의": [{ t: "회의", s: 1.0 }, { t: "미팅", s: 0.92 }, { t: "모임", s: 0.72 }, { t: "컨퍼런스", s: 0.78 }],
    "온라인": [{ t: "온라인", s: 1.0 }, { t: "비대면", s: 0.92 }, { t: "화상", s: 0.85 }, { t: "원격", s: 0.88 }],
    "내일": [{ t: "내일", s: 1.0 }, { t: "익일", s: 0.95 }, { t: "다음날", s: 0.92 }, { t: "오늘", s: 0.45 }],
    "강남역": [{ t: "강남역", s: 1.0 }, { t: "역삼", s: 0.68 }, { t: "선릉", s: 0.62 }, { t: "강남", s: 0.9 }],
  };

  const scenarios = [
    {
      label: "폭우로 회의 온라인 변경",
      originalTokens: ["폭우", "내일", "회의", "온라인"],
      context: "내일 업무 일정 공지 문맥",
    },
    {
      label: "강남역 사과 쇼핑",
      originalTokens: ["강남역", "사과", "과일"],
      context: "식료품 쇼핑 문맥",
    },
  ];

  const state = {
    scenario: 0,
    errorRate: 0.35,
    useKB: true,
    seed: 3,
  };

  function rand() {
    state.seed = (state.seed * 9301 + 49297) % 233280;
    return state.seed / 233280;
  }

  function injectNoise(tokens) {
    return tokens.map((t) => {
      const corrupted = rand() < state.errorRate;
      if (!corrupted) return { original: t, received: t, corrupted: false, candidates: [] };
      const neighbors = KB[t] ?? [{ t: t, s: 1 }];
      const wrongIdx = Math.floor(rand() * (neighbors.length - 1)) + 1;
      const wrong = neighbors[Math.min(wrongIdx, neighbors.length - 1)]?.t || t;
      return { original: t, received: wrong, corrupted: true, candidates: neighbors };
    });
  }

  function recover(token, context) {
    if (!state.useKB) return token.received;
    const candidates = KB[token.original] || [{ t: token.received, s: 1 }];
    // Pick highest similarity candidate that appears in context or has highest score
    const sorted = [...candidates].sort((a, b) => b.s - a.s);
    return sorted[0].t;
  }

  function render() {
    const scenario = scenarios[state.scenario];
    const received = injectNoise(scenario.originalTokens);
    const recovered = received.map((tok) => recover(tok));
    const origJoined = scenario.originalTokens.join(" · ");
    const recJoined = received.map((r) => r.received).join(" · ");
    const recoveredJoined = recovered.join(" · ");

    const bitErrors = received.filter((r) => r.corrupted).length;
    const ber = (bitErrors / received.length * 100).toFixed(0);

    function semSim(a, b) {
      if (a === b) return 1.0;
      const neighbors = KB[a] || [];
      const hit = neighbors.find((n) => n.t === b);
      return hit ? hit.s : 0.2;
    }
    const rawSim = received.reduce((acc, r, i) => acc + semSim(scenario.originalTokens[i], r.received), 0) / received.length;
    const kbSim = recovered.reduce((acc, r, i) => acc + semSim(scenario.originalTokens[i], r), 0) / recovered.length;

    root.innerHTML = `
      <style>
        .sd-demo h2 { margin:0; font-size:26px; }
        .sd-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .sd-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .sd-card h3 { margin:0 0 6px; font-size:16px; color:#1d2c3f; }
        .sd-scenarios { display:flex; flex-wrap:wrap; gap:6px; }
        .sd-scenario { padding:8px 12px; border-radius:999px; background:#f1f5fa; border:2px solid #d6dfec; font-weight:900; font-size:13px; cursor:pointer; }
        .sd-scenario.active { background:#11865a; border-color:#11865a; color:#fff; }
        .sd-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-top:10px; }
        .sd-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .sd-flow { display:grid; gap:14px; margin-top:8px; }
        .sd-stage { padding:12px 14px; border-radius:10px; background:#fbfdff; border:1px solid #d6dfec; }
        .sd-stage h4 { margin:0 0 6px; font-size:14px; color:#35475d; }
        .sd-tokens { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; }
        .sd-tok {
          padding:9px 12px; border-radius:8px; font-weight:900; font-size:14px;
          border:2px solid #d6dfec; background:#fff; display:grid; gap:2px; text-align:center;
          min-width:60px;
        }
        .sd-tok small { font-size:10px; color:#607083; font-weight:900; }
        .sd-tok.orig { background:#f3edfc; border-color:#6b43bd; color:#4f2a9c; }
        .sd-tok.ok { background:#e4f8ec; border-color:#11865a; color:#0d6744; }
        .sd-tok.err { background:#ffe8e8; border-color:#d94242; color:#a02828; }
        .sd-tok.recov { background:#fff6db; border-color:#d9991d; color:#8a4f03; }
        .sd-arrow { text-align:center; color:#a0aec0; font-size:20px; font-weight:900; }
        .sd-kb { display:grid; gap:6px; margin-top:6px; }
        .sd-kb-row {
          display:grid; grid-template-columns:auto 1fr; gap:10px; align-items:center;
          padding:6px 10px; background:#f7fafd; border-radius:6px; border:1px solid #e4eaf3;
        }
        .sd-kb-row b { font-size:12px; font-weight:900; color:#4f2a9c; }
        .sd-kb-row .neighbors { display:flex; flex-wrap:wrap; gap:4px; }
        .sd-kb-row .nb {
          padding:3px 7px; border-radius:6px; background:#f1f5fa; font-size:11px; font-weight:900; color:#35475d;
        }
        .sd-kb-row .nb.pick { background:#11865a; color:#fff; }
        .sd-metrics { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .sd-metrics span { padding:7px 10px; border-radius:7px; background:#eef3fa; font-weight:900; color:#26384b; font-size:13px; }
        .sd-metrics span.low { background:#ffe8e8; color:#a02828; }
        .sd-metrics span.good { background:#e4f8ec; color:#0d6744; }
        .sd-toggles { display:flex; flex-wrap:wrap; gap:12px; margin-top:6px; font-weight:900; color:#35475d; font-size:13px; }
      </style>

      <div class="vis-panel sd-demo">
        <section>
          <h2>sLLM Decoder + KB: 손상된 비트를 의미로 되살리기</h2>
          <p class="hint">Rx는 코드북 인덱스 비트를 디코딩합니다. 채널 노이즈로 일부 인덱스가 틀려도, Knowledge Base의 문맥 유사도로 원래 토큰을 복원합니다 — 기존 CRC FAIL/재전송이 필요 없는 지점입니다.</p>
        </section>

        <section class="sd-card">
          <h3>① 시나리오 & 조건</h3>
          <div class="sd-scenarios">
            ${scenarios.map((s, i) => `<button class="sd-scenario ${state.scenario === i ? "active" : ""}" data-scenario="${i}" type="button">${s.label}</button>`).join("")}
          </div>
          <div class="sd-controls">
            <label>채널 비트 오류율: <b>${(state.errorRate * 100).toFixed(0)}%</b>
              <input type="range" min="0" max="0.8" step="0.05" value="${state.errorRate}" data-control="errorRate"/>
            </label>
            <button class="vis-button" data-action="reseed" type="button">새 잡음 샘플</button>
          </div>
          <div class="sd-toggles">
            <label><input type="checkbox" ${state.useKB ? "checked" : ""} data-toggle="useKB"/> Knowledge Base 추론 활성</label>
          </div>
        </section>

        <section class="sd-card">
          <h3>② 복원 파이프라인</h3>
          <div class="sd-flow">
            <div class="sd-stage" style="border-color:#cbb7e8">
              <h4>Tx 원본 토큰</h4>
              <div class="sd-tokens">
                ${scenario.originalTokens.map((t) => `<div class="sd-tok orig"><b>${t}</b><small>original</small></div>`).join("")}
              </div>
            </div>
            <div class="sd-arrow">↓ 채널 오류 (BER ${ber}%)</div>
            <div class="sd-stage" style="border-color:#e7a4a4">
              <h4>Rx 수신 토큰 (인덱스 왜곡)</h4>
              <div class="sd-tokens">
                ${received.map((r) => `<div class="sd-tok ${r.corrupted ? "err" : "ok"}"><b>${r.received}</b><small>${r.corrupted ? "bit error → 이웃 인덱스" : "정상"}</small></div>`).join("")}
              </div>
            </div>
            <div class="sd-arrow">↓ ${state.useKB ? "sLLM + KB 문맥 추론" : "KB 비활성 (passthrough)"}</div>
            <div class="sd-stage" style="border-color:#a9d7bd">
              <h4>KB 이웃 사전 조회 (원본 토큰 기준)</h4>
              <div class="sd-kb">
                ${scenario.originalTokens.map((t) => {
                  const neigh = KB[t] || [{ t: t, s: 1 }];
                  return `
                    <div class="sd-kb-row">
                      <b>${t}</b>
                      <div class="neighbors">
                        ${neigh.map((n) => `<span class="nb ${n.t === t ? "pick" : ""}">${n.t} (${n.s.toFixed(2)})</span>`).join("")}
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
            <div class="sd-arrow">↓ 최종 복원</div>
            <div class="sd-stage" style="border-color:#f0cb94">
              <h4>복원된 의미 토큰</h4>
              <div class="sd-tokens">
                ${recovered.map((r, i) => {
                  const matched = r === scenario.originalTokens[i];
                  return `<div class="sd-tok ${matched ? "ok" : "recov"}"><b>${r}</b><small>${matched ? "의미 일치" : "유사 대체"}</small></div>`;
                }).join("")}
              </div>
            </div>
          </div>

          <div class="sd-metrics">
            <span class="low">원본 대비 BER: ${ber}%</span>
            <span class="low">KB 미사용 유사도: ${(rawSim * 100).toFixed(0)}%</span>
            <span class="${kbSim >= 0.9 ? "good" : "low"}">KB 사용 의미 유사도: ${(kbSim * 100).toFixed(0)}%</span>
            <span>문맥: ${scenario.context}</span>
          </div>

          <p style="margin-top:10px; font-size:13px; color:#4f6073; font-weight:800; line-height:1.5">
            • 기존 통신에서 BER ${ber}%는 CRC FAIL → HARQ 재전송이 필수입니다.<br>
            • Semantic Decoder는 KB 이웃 중 유사도가 가장 높은 토큰으로 복원해 재전송 없이 의미를 살립니다.<br>
            • 이 예시는 토큰 단위 시뮬레이션입니다. 실제 sLLM은 수천 차원 임베딩과 attention으로 훨씬 정교하게 복원합니다.
          </p>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-scenario]").forEach((el) => {
      el.addEventListener("click", () => {
        state.scenario = Number(el.dataset.scenario);
        render();
      });
    });
    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", (e) => {
        state[el.dataset.toggle] = e.target.checked;
        render();
      });
    });
    root.querySelector('[data-action="reseed"]')?.addEventListener("click", () => {
      state.seed = Math.floor(Math.random() * 9000) + 1;
      render();
    });
  }

  render();
  return () => {};
}
