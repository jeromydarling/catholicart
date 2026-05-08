# Tools

## 1code

[21st-dev/1code](https://github.com/21st-dev/1code) — desktop client for running Claude Code / Codex agents locally. Cloned into `tools/1code/` (gitignored).

Re-install:

```bash
git clone https://github.com/21st-dev/1code.git tools/1code
cd tools/1code
bun install --ignore-scripts
bun run claude:download
bun run codex:download   # may 403 without auth; optional
bun run build
```
