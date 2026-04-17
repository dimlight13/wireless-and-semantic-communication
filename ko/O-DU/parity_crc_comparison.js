export const metadata = {
  title: "패리티 검사 vs CRC 검사",
};

export function mount(root) {
  const originalData = [1, 0, 1, 1, 0, 0, 1, 0];
  const generator = [1, 0, 0, 1, 1]; // x^4 + x + 1
  const parityBit = originalData.reduce((sum, bit) => sum + bit, 0) % 2;
  const crcBits = computeCrcBits(originalData, generator);
  let receivedData = [...originalData];

  function mod2Divide(bits, divisor) {
    const work = [...bits];
    for (let i = 0; i <= work.length - divisor.length; i += 1) {
      if (work[i] === 1) {
        for (let j = 0; j < divisor.length; j += 1) {
          work[i + j] ^= divisor[j];
        }
      }
    }
    return work.slice(work.length - (divisor.length - 1));
  }

  function computeCrcBits(data, divisor) {
    const padded = [...data, ...Array(divisor.length - 1).fill(0)];
    return mod2Divide(padded, divisor);
  }

  function hasNonZero(bits) {
    return bits.some((bit) => bit !== 0);
  }

  function render() {
    const errorPositions = receivedData
      .map((bit, index) => bit !== originalData[index] ? index : null)
      .filter((index) => index !== null);
    const errorCount = errorPositions.length;
    const parityRemainder = [...receivedData, parityBit].reduce((sum, bit) => sum + bit, 0) % 2;
    const parityDetectsError = parityRemainder !== 0;
    const crcRemainder = mod2Divide([...receivedData, ...crcBits], generator);
    const crcDetectsError = hasNonZero(crcRemainder);
    const parityState = parityDetectsError ? "fail" : (errorCount > 0 ? "fatal" : "pass");
    const crcState = crcDetectsError ? "fail" : "pass";

    root.innerHTML = `
      <style>
        .crc-demo h2 { margin:0; font-size:32px; }
        .crc-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; }
        .error-panel h3, .result h3 { margin:0 0 12px; font-size:23px; }
        .bit-buttons { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .crc-bit {
          min-width:58px;
          min-height:58px;
          border:2px solid #cbd6e4;
          border-radius:8px;
          background:#eef3fa;
          color:#14212f;
          font-size:24px;
          font-weight:900;
          cursor:pointer;
          transition:transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }
        .crc-bit:hover { transform:translateY(-2px); border-color:var(--blue); }
        .crc-bit.error { background:#d94242; border-color:#d94242; color:#fff; box-shadow:0 0 0 5px rgba(217,66,66,.15); }
        .code-row { display:flex; flex-wrap:wrap; gap:7px; align-items:center; margin-top:12px; }
        .code-row span { padding:8px 10px; border-radius:8px; background:#f1f5fa; border:1px solid #d5dfeb; font-weight:900; }
        .result-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .result {
          border:3px solid #ccd7e4;
          border-radius:8px;
          padding:16px;
          min-height:230px;
          transition:background 200ms ease, border-color 200ms ease;
        }
        .result.pass { background:#edf9f2; border-color:#11865a; }
        .result.fail { background:#fff0f0; border-color:#d94242; }
        .result.fatal { background:#fff6db; border-color:#d9991d; }
        .result strong { display:block; margin:8px 0; font-size:26px; }
        .result.pass strong { color:#0d6744; }
        .result.fail strong { color:#a02828; }
        .result.fatal strong { color:#9a6510; }
        .result p { margin:8px 0; font-size:18px; line-height:1.42; font-weight:800; }
        .formula { padding:12px; border-radius:8px; background:#fff; border:1px solid #d5dfeb; font-family:Consolas, "Cascadia Mono", monospace; font-size:17px; font-weight:900; }
        .fatal-text { font-weight:900; color:#9a251f; }
        @media (max-width: 850px) { .result-grid { grid-template-columns:1fr; } }
      </style>

      <div class="vis-panel crc-demo">
        <section>
          <h2>에러 검출: 패리티 검사 vs CRC 검사</h2>
          <p class="hint">데이터 비트를 클릭해 무선 채널 오류를 만들면, 짝수 개 오류에서 패리티가 왜 오판할 수 있는지 확인할 수 있습니다.</p>
        </section>

        <section class="vis-card error-panel">
          <h3>무선 채널 에러 발생기</h3>
          <div class="bit-buttons">
            ${receivedData.map((bit, index) => `
              <button class="crc-bit ${bit !== originalData[index] ? "error" : ""}" data-index="${index}" type="button">${bit}</button>
            `).join("")}
          </div>
          <div class="code-row">
            <span>원본 데이터: ${originalData.join(" ")}</span>
            <span>현재 오류: ${errorCount}개${errorCount ? ` (${errorPositions.map((i) => i + 1).join(", ")}번 비트)` : ""}</span>
            <span>짝수 패리티 비트: ${parityBit}</span>
            <span>CRC 생성 다항식: 10011</span>
            <span>CRC 비트: ${crcBits.join("")}</span>
          </div>
          <div class="vis-row" style="margin-top:12px">
            <button class="vis-button" data-action="reset" type="button">오류 초기화</button>
            <button class="vis-button red" data-action="two" type="button">2비트 오류 예시 만들기</button>
          </div>
        </section>

        <section class="result-grid">
          <article class="result ${parityState}">
            <h3>패리티 검사 결과</h3>
            <div class="formula">수신 데이터 + 패리티의 1 개수 mod 2 = ${parityRemainder}</div>
            <strong>${parityDetectsError ? "에러 감지" : (errorCount > 0 ? "정상 (치명적 오판!)" : "정상 (Pass)")}</strong>
            <p>${errorCount === 2 && !parityDetectsError ? `<span class="fatal-text">2비트 오류는 1의 개수 짝/홀이 그대로라 패리티가 놓쳤습니다.</span>` : "짝수 패리티는 홀수 개 오류에는 반응하지만, 짝수 개 오류에는 취약합니다."}</p>
          </article>

          <article class="result ${crcState}">
            <h3>CRC 검사 결과</h3>
            <div class="formula">나머지 = ${crcRemainder.join("")}</div>
            <strong>${crcDetectsError ? "에러 감지" : "정상 (Pass)"}</strong>
            <p>수신 데이터와 원래 CRC 비트를 생성 다항식 10011로 나누어 실제 나머지를 계산합니다.</p>
          </article>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        receivedData[index] = receivedData[index] === 1 ? 0 : 1;
        render();
      });
    });
    root.querySelector('[data-action="reset"]').addEventListener("click", () => {
      receivedData = [...originalData];
      render();
    });
    root.querySelector('[data-action="two"]').addEventListener("click", () => {
      receivedData = [...originalData];
      receivedData[1] ^= 1;
      receivedData[4] ^= 1;
      render();
    });
  }

  render();
}
