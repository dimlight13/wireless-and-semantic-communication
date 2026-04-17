# Wireless Communication Visualizer

Interactive browser visualizers for wireless communication concepts.

- **Traditional 5G NR uplink stack**: O-RU, O-DU, MAC/RLC, PDCP, SDAP
- **Semantic communication**: semantic encoding, vector quantization, world model channel adaptation, semantic decoding, and Bit-Com vs Sem-Com comparison

## Open In Browser

If this repository is published with GitHub Pages, users can open the visualizer by clicking the Pages link:

```text
https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/
```

Replace the placeholders with your actual GitHub username and repository name after enabling GitHub Pages.

Direct pages:

- `index.html`: track selection page
- `traditional.html`: 5G NR uplink protocol stack explorer
- `semcom.html`: semantic communication explorer

## Enable GitHub Pages

1. Push this repository to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings` -> `Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Select the branch, usually `main`.
6. Select `/ (root)` as the folder.
7. Click `Save`.
8. Wait for GitHub to show the published Pages URL.

After that, put the published URL near the top of this README so users can click it directly.

Example:

```md
[Open the Wireless Communication Visualizer](https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/)
```

## Why README Alone Cannot Run It

GitHub README files cannot execute arbitrary JavaScript applications directly. A README can only link to a runnable page. GitHub Pages hosts the HTML and JavaScript files as a static website, so the visualizer can run in the browser with one click.

## Local Run

You can still run the Python server locally:

```bash
python main.py
```

Then open:

```text
http://127.0.0.1:8000
```

Standalone local servers are also available:

```bash
python traditional.py
python semcom.py
```

## Project Structure

```text
wireless_communications_visualization/
├── index.html                     # Static GitHub Pages landing page
├── traditional.html               # Static Traditional visualizer page
├── semcom.html                    # Static Semantic Communication visualizer page
├── main.py                        # Local integrated Python server
├── traditional.py                 # Local Traditional-only Python server
├── semcom.py                      # Local Sem-Com-only Python server
├── protocol_stack_overview.js     # Traditional stack overview
├── O-RU/                          # O-RU / Low-PHY visual blocks
├── O-DU/                          # O-DU / High-PHY, MAC, RLC visual blocks
├── O-CU/                          # O-CU / PDCP, SDAP visual blocks
└── semcom/                        # Semantic communication visual blocks
```

## Requirements

For GitHub Pages:

- A modern browser
- No Python
- No VS Code
- No npm install
- No build step

For local Python server:

- Python 3.9+

## Notes For Maintainers

The static HTML pages import ES modules directly with relative paths. This is what makes the project work on GitHub Pages, where there is no `/scripts/...` Python route.

When adding a new block:

1. Add a `.js` module under `O-RU/`, `O-DU/`, `O-CU/`, or `semcom/`.
2. Export `metadata` and `mount(root)`.
3. Add the block to `protocol_stack_overview.js` or `semcom/semcom_overview.js`.
4. Use relative module paths so the block works both locally and on GitHub Pages.
