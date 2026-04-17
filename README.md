# Wireless Communication Visualizer

무선 통신의 두 가지 트랙 — **전통 5G NR Uplink 프로토콜 스택**과 **차세대 Semantic Communication** — 을 브라우저에서 직접 조작하며 학습할 수 있는 인터랙티브 시각화 도구.

- 추가 패키지 설치 없이 **Python 표준 라이브러리**만으로 동작 (HTTP 서버) + 순수 **ES 모듈 JavaScript** (프레임워크 없음)
- 각 블록은 파라미터를 슬라이더/버튼으로 바꿔가며 실시간으로 파형·성상도·비트열을 관찰

---

## 빠른 실행

```bash
python main.py
```

브라우저에서 [http://127.0.0.1:8000](http://127.0.0.1:8000) 을 열면 트랙 선택 랜딩 페이지가 뜹니다. 카드를 클릭해 원하는 트랙으로 진입하세요.

| 경로 | 설명 |
| --- | --- |
| `/` | 트랙 선택 랜딩 |
| `/traditional` | 5G NR Uplink Protocol Stack Explorer |
| `/semcom` | Semantic Communication Explorer |

개별 서버로 실행하고 싶다면 다음 스크립트도 그대로 사용할 수 있습니다.

```bash
python traditional.py   # http://127.0.0.1:8000 (전통 통신 단독)
python semcom.py        # http://127.0.0.1:8001 (시맨틱 통신 단독)
```

환경 변수 `HOST`, `PORT` 로 바인딩 주소·포트를 바꿀 수 있습니다.

---

## 폴더 구조

```
wireless_communications_visualization/
├── main.py                       # 통합 런처 (랜딩 + 두 트랙 라우팅)
├── traditional.py                # 전통 통신 단독 서버
├── semcom.py                     # 시맨틱 통신 단독 서버
│
├── protocol_stack_overview.js    # [Traditional] 프로토콜 스택 전체 개요
├── O-RU/                         # O-RU (Low-PHY) 블록
│   ├── rf_adc_sampling.js
│   ├── cp_removal.js
│   ├── fft_ofdm.js
│   └── digital_beamforming.js
├── O-DU/                         # O-DU (High-PHY · MAC · RLC) 블록
│   ├── channel_estimation_equalization.js
│   ├── qam_demodulation_llr.js
│   ├── scrambling_descrambling_llr.js
│   ├── 5g_rate_matching_dematchning.js
│   ├── ldpc_decoding.js
│   ├── parity_crc_comparison.js
│   ├── MAC_HARQ_RLC_ARQ_comparison.js
│   └── rlc_mac_multiplexing.js
├── O-CU/                         # O-CU (PDCP · SDAP) 블록
│   ├── pdcp_reordering_deciphering.js
│   └── sdap_qos_mapping.js
│
└── semcom/                       # [Sem-Com] 시맨틱 통신 블록
    ├── semcom_overview.js        # 전체 파이프라인 개요 (엔트리)
    ├── semantic_encoder.js
    ├── vector_quantization.js
    ├── world_model_channel.js
    ├── semantic_decoder.js
    └── semcom_vs_bitcom.js
```

모든 `.js` 는 `export const metadata`, `export function mount(root)` 패턴의 ES 모듈입니다. 서버는 `/scripts/*` 요청을 프로젝트 루트에서 그대로 매핑합니다.

---

## Track 1 — 전통 5G NR Uplink Protocol Stack

O-RAN 분리 기준 (**O-RU → O-DU → O-CU**) 으로 업링크 수신 파이프라인을 14 개 블록으로 분해합니다.

| 영역 | 블록 | 포인트 |
| --- | --- | --- |
| **O-RU** Low-PHY | RF & ADC 샘플링 | 나이퀴스트 조건, 양자화 |
|  | CP 제거 | 다중경로 에코·ISI 보호 |
|  | FFT (OFDM) | 서브캐리어 진폭, DFT 시각화 |
|  | 디지털 빔포밍 | N-안테나 극좌표 빔 패턴, SINR |
| **O-DU** High-PHY | Channel Estimation / Equalization | Tx → Rx → Equalized 성상도 |
|  | QAM Demodulation | 16-QAM 드래그, 비트별 LLR |
|  | Descrambling | 코드 1 위치 LLR 부호 반전 |
|  | Rate Dematching | 펑처링·반복된 LLR 복원 |
|  | LDPC Decoding | Tanner graph, min-sum BP, 수렴 |
|  | CRC | 최종 무결성 판정 |
| **O-DU** MAC/RLC | MAC HARQ | ACK/NACK, 소프트 결합 |
|  | RLC / MAC 다중화 | 서비스별 LCID → Transport Block |
| **O-CU** PDCP/SDAP | PDCP | SN 재정렬, Deciphering, ROHC |
|  | SDAP | QFI/5QI → DRB 매핑 |

각 카드를 클릭하면 우측 패널에 해당 블록 시뮬레이터가 로드됩니다.

---

## Track 2 — Semantic Communication

AI(sLLM)와 Knowledge Base 를 활용해 **비트가 아닌 '의미'** 를 전송하는 하이브리드 통신 프레임워크.

| 단 | 블록 | 역할 |
| --- | --- | --- |
| **Tx** | sLLM Encoder | 문장·이미지 → 핵심 토큰 추출 |
| **Tx** | Vector Quantization | 연속 임베딩 → 코드북 인덱스(비트) |
| **Tx** | World Model | 채널 예측 → 변조·코드율·UEP 전략 |
| **Channel** | 기존 RAN 파이프라인 | LDPC·QAM·페이딩·잡음 (Track 1 재활용) |
| **Rx** | sLLM Decoder + KB | 손상 비트 → 문맥 기반 의미 복원 |
| **Benchmark** | Bit-Com vs Sem-Com | 동일 SNR 에서 BER vs Semantic Similarity 비교 |

오버뷰 상단에는 같은 문장 `"빨간 사과가 식탁 위에 있다"` 를 두 방식으로 각각 보냈을 때 **원본 → 인코더 → 채널(노이즈) → 디코더 → 복원 결과** 5 단계 스토리보드가 자동 재생됩니다. 전통 방식은 비트 몇 개 뒤집힘 → 문자 깨짐 → 재전송 필요, Sem-Com 은 토큰 인덱스 오류 → KB 문맥으로 복원 → 의미 유사도 99% 로 대비됩니다.

---

## 요구 사항

- **Python 3.9+** (표준 라이브러리 `http.server`, `pathlib`, `urllib` 만 사용)
- 모던 브라우저 (Chrome / Edge / Firefox 최신)
- 추가 npm/pip 패키지 없음

---

## 확장 방법

새 블록을 추가하려면:

1. `O-RU/`, `O-DU/`, `O-CU/`, `semcom/` 중 적절한 폴더에 `my_block.js` 생성
2. 파일 상단에 `export const metadata = { title: "…" };`
3. `export function mount(root) { … return () => { /* cleanup */ }; }` 구현
4. 해당 트랙의 오버뷰 (`protocol_stack_overview.js` 또는 `semcom/semcom_overview.js`) `components` / `blocks` 배열에 `{ id, title, file: "폴더/my_block.js", … }` 엔트리 추가

서버는 자동으로 `/scripts/폴더/my_block.js` 를 매핑합니다. 재시작은 필요 없고 브라우저 새로고침만으로 반영됩니다 (`Cache-Control: no-store`).
