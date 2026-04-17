# Wireless Communication Visualizer

Choose a language and run the simulator directly in your browser. No download, VS Code, Python, npm, or GitHub Pages setup is needed.

## Run the Simulator

| Language | Main Link | Backup Link |
| --- | --- | --- |
| English | [Run English Simulator](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/en/standalone.html) | [English backup](https://htmlpreview.github.io/?https://github.com/dimlight13/wireless-and-semantic-communication/blob/main/en/standalone.html) |
| Korean / 한국어 | [한국어 시뮬레이터 실행](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/ko/standalone.html) | [한국어 백업 링크](https://htmlpreview.github.io/?https://github.com/dimlight13/wireless-and-semantic-communication/blob/main/ko/standalone.html) |

The simulator runs on your device like a small web game after you click one of the links above.

## Direct Track Links

### English

- [Traditional 5G NR Uplink Stack](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/en/traditional.html)
- [Semantic Communication Explorer](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/en/semcom.html)

### Korean / 한국어

- [전통 통신: 5G NR Uplink Stack](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/ko/traditional.html)
- [시맨틱 통신: Semantic Communication Explorer](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/ko/semcom.html)

## What You Can Do

- Click each block to open its interactive simulator.
- Move sliders and press buttons to see how signal-processing parameters change the result.
- Compare a traditional bit pipeline with a semantic meaning-based pipeline.

## Local Run

Run the English version locally:

```bash
cd en
python main.py
```

Then open:

```text
http://127.0.0.1:8000
```

Run the Korean version locally:

```bash
cd ko
python main.py
```

## For Maintainers

- English standalone file: `en/standalone.html`
- Korean standalone file: `ko/standalone.html`
- English static pages: `en/traditional.html`, `en/semcom.html`
- Korean static pages: `ko/traditional.html`, `ko/semcom.html`

When JavaScript modules change, rebuild the standalone file for the version you edited:

```bash
python build_standalone.py
```
