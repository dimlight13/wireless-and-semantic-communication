export const metadata = {
  title: "스크램블링 및 디스크램블링",
};

export function mount(root) {
  let dataBits = Array(8).fill(0);
  let codeBits = [1, 0, 1, 1, 0, 1, 0, 0];
  let noiseSeed = 0;

  function makeScrambled() {
    return dataBits.map((bit, index) => bit ^ codeBits[index]);
  }

  function llrFor(bit, index) {
    const noiseTable = [0.4, -0.2, 0.7, -0.5, 0.1, -0.8, 0.5, -0.3];
    const base = bit === 0 ? 2.6 : -2.6;
    const drift = ((noiseSeed + index * 3) % 5 - 2) * 0.12;
    return Number((base + noiseTable[index] + drift).toFixed(1));
  }

  function randomizeCode() {
    codeBits = codeBits.map(() => Math.random() > 0.5 ? 1 : 0);
    render();
  }

  function regenerateNoise() {
    noiseSeed += 1;
    render();
  }

  function bitButton(bit, index) {
    return `<button class="scr-bit toggle" data-bit="${index}" type="button">${bit}<small>D${index}</small></button>`;
  }

  function bitCell(bit, index, className = "") {
    return `<span class="scr-bit ${className}">${bit}<small>${index}</small></span>`;
  }

  function llrCell(value, index, flipped = false) {
    const cls = value >= 0 ? "positive" : "negative";
    return `<span class="llr-cell ${cls} ${flipped ? "flipped" : ""}">
      <b>${value > 0 ? "+" : ""}${value.toFixed(1)}</b>
      <small>${flipped ? "부호 반전" : `L${index}`}</small>
    </span>`;
  }

  function render() {
    const scrambled = makeScrambled();
    const channelLlr = scrambled.map(llrFor);
    const descrambledLlr = channelLlr.map((value, index) => codeBits[index] === 1 ? -value : value);
    const recovered = descrambledLlr.map((value) => value >= 0 ? 0 : 1);
    const allMatch = recovered.every((bit, index) => bit === dataBits[index]);

    root.innerHTML = `
      <style>
        .scr-demo h2 { margin:0; font-size:32px; }
        .scr-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; }
        .scr-pipeline { display:grid; gap:10px; }
        .scr-stage { position:relative; display:grid; gap:10px; border:1px solid var(--line); border-radius:8px; background:#fff; padding:16px; }
        .scr-stage h3 { margin:0; font-size:21px; }
        .scr-stage p { margin:0; color:var(--muted); font-weight:800; }
        .scr-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .scr-bit {
          position:relative;
          min-width:58px;
          min-height:54px;
          display:grid;
          place-items:center;
          padding:7px 8px 14px;
          border-radius:8px;
          border:2px solid #cbd6e4;
          background:#f1f5fa;
          color:#14212f;
          font-size:22px;
          font-weight:900;
          transition:transform 220ms ease, background 220ms ease, border-color 220ms ease;
        }
        .scr-bit small, .llr-cell small {
          position:absolute;
          left:6px;
          bottom:4px;
          color:#607083;
          font-size:11px;
          font-weight:900;
        }
        .scr-bit.toggle { cursor:pointer; background:#fff; }
        .scr-bit.toggle:hover { transform:translateY(-2px); border-color:var(--blue); }
        .scr-bit.code-one { background:#eef0ff; border-color:#6b43bd; color:#4f2a9c; }
        .scr-bit.scrambled-one { background:#fff0df; border-color:#c86414; color:#8a400b; }
        .scr-arrow { text-align:center; color:#718198; font-size:28px; font-weight:900; }
        .llr-cell {
          position:relative;
          min-width:76px;
          min-height:58px;
          display:grid;
          place-items:center;
          padding:7px 8px 15px;
          border-radius:8px;
          border:2px solid #cbd6e4;
          font-size:20px;
          font-weight:900;
          animation:llrIn 280ms ease both;
        }
        .llr-cell.positive { background:#e4f8ec; border-color:#11865a; color:#0d6744; }
        .llr-cell.negative { background:#ffe8e8; border-color:#d94242; color:#a02828; }
        .llr-cell.flipped { animation:flipSign 520ms ease both; }
        .decision { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .decision .match { box-shadow:0 0 0 4px rgba(17,134,90,.18); border-color:#11865a; }
        .summary { padding:12px; border-radius:8px; font-weight:900; }
        .summary.ok { color:#0d6744; background:#e4f8ec; }
        .summary.bad { color:#a02828; background:#ffe8e8; }
        @keyframes llrIn {
          from { opacity:0; transform:translateY(8px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes flipSign {
          0% { transform:rotateY(0deg); }
          50% { transform:rotateY(90deg) scale(.96); }
          100% { transform:rotateY(0deg); }
        }
      </style>

      <div class="vis-panel scr-demo">
        <section>
          <h2>스크램블링 및 디스크램블링: LLR 부호 반전</h2>
          <p class="hint">송신단은 데이터와 스크램블링 코드를 XOR하고, 수신단은 코드가 1인 LLR 위치의 부호만 반전해 원본을 복원합니다.</p>
        </section>

        <section class="scr-pipeline">
          <article class="scr-stage">
            <h3>송신단: 원본 데이터</h3>
            <p>비트를 클릭하면 0과 1이 토글됩니다.</p>
            <div class="scr-row">${dataBits.map(bitButton).join("")}</div>
          </article>

          <div class="scr-arrow">↓ XOR</div>

          <article class="scr-stage">
            <h3>송신단: 스크램블링 코드</h3>
            <div class="vis-row">
              <button class="vis-button primary" data-action="random-code" type="button">코드 랜덤 변경</button>
              <button class="vis-button" data-action="noise" type="button">채널 노이즈 재생성</button>
            </div>
            <div class="scr-row">${codeBits.map((bit, index) => bitCell(bit, index, bit ? "code-one" : "")).join("")}</div>
          </article>

          <div class="scr-arrow">↓ 송신 비트 = 원본 XOR 코드</div>

          <article class="scr-stage">
            <h3>송신단: 스크램블된 데이터</h3>
            <div class="scr-row">${scrambled.map((bit, index) => bitCell(bit, index, bit ? "scrambled-one" : "")).join("")}</div>
          </article>

          <div class="scr-arrow">↓ 무선 채널: 비트를 LLR 실수값으로 수신</div>

          <article class="scr-stage">
            <h3>무선 채널: 노이즈가 섞인 LLR</h3>
            <p>0은 양수 LLR, 1은 음수 LLR로 들어옵니다.</p>
            <div class="scr-row">${channelLlr.map((value, index) => llrCell(value, index)).join("")}</div>
          </article>

          <div class="scr-arrow">↓ 디스크램블링: 코드가 1인 자리만 부호 반전</div>

          <article class="scr-stage">
            <h3>수신단: 디스크램블링 코드와 LLR 부호 반전</h3>
            <div class="scr-row">${codeBits.map((bit, index) => bitCell(bit, index, bit ? "code-one" : "")).join("")}</div>
            <div class="scr-row">${descrambledLlr.map((value, index) => llrCell(value, index, codeBits[index] === 1)).join("")}</div>
          </article>

          <article class="scr-stage">
            <h3>수신단: 최종 복원 판정</h3>
            <p>LLR이 양수면 0, 음수면 1로 판정합니다.</p>
            <div class="decision">
              ${recovered.map((bit, index) => `<span class="scr-bit ${bit === dataBits[index] ? "match" : ""}">${bit}<small>D${index}</small></span>`).join("")}
            </div>
            <div class="summary ${allMatch ? "ok" : "bad"}">${allMatch ? "복원 성공: 원본 데이터와 일치합니다." : "복원 실패: 노이즈가 너무 커서 판정이 달라졌습니다."}</div>
          </article>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-bit]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.bit);
        dataBits[index] = dataBits[index] === 1 ? 0 : 1;
        render();
      });
    });
    root.querySelector('[data-action="random-code"]').addEventListener("click", randomizeCode);
    root.querySelector('[data-action="noise"]').addEventListener("click", regenerateNoise);
  }

  render();
}
