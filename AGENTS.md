# AGENTS.md — guide for AI agents contributing to ai-anime

This file is for AI coding agents that read, test, or change this project. The human-facing rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

## What this project is

`ai-anime` turns a JSON spec of layered SVG shapes into an MP4 with Remotion. The spec is the interface that agents write.

## Promises to keep

1. **Validate before rendering.** `bin/ai-anime.mjs render` must run `validateSpec` and stop on any error.
2. **SVG allow-list only.** Element names and attributes come from `lib/validate.mjs`. Adding one needs a test showing it is safe.
3. **No scripts or external content.** Never allow `script`, `foreignObject`, `image`, `use`, `url(`, `javascript:`, or event-handler attributes.
4. **Deterministic output.** The same spec must render the same frames.

## Layout

```
lib/validate.mjs     spec and SVG checks (pure functions)
src/Scene.tsx        the Remotion composition that draws a spec frame by frame
src/Root.tsx         registers the "Scene" composition and its metadata
bin/ai-anime.mjs     commands: example, check, render
examples/walk.json   example spec
tests/               node:test suite for the checks
```

## Setup and checks

```bash
npm install
npm test
node bin/ai-anime.mjs check examples/walk.json
node bin/ai-anime.mjs render examples/walk.json -o out/walk.mp4
```

Rendering needs Remotion's bundled ffmpeg, which `npm install` provides.

## Rules for changes

- One change per pull request, with tests for each validation rule.
- Keep the spec format backward compatible. Add optional fields rather than renaming them.
- Do not commit rendered videos (the `out/` folder is ignored).

## Security

Do not report vulnerabilities in a public issue. Use a private security advisory on GitHub.
