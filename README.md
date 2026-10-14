# ai-anime

Draw simple cartoon characters as layered SVG shapes, then animate them into a video with [Remotion](https://www.remotion.dev). An AI agent writes a JSON spec: the shapes for each body part and the keyframes that move them. `ai-anime` checks the spec and renders it to an MP4.

```bash
node bin/ai-anime.mjs example                       # print an example spec
node bin/ai-anime.mjs check examples/walk.json      # validate, with clear errors
node bin/ai-anime.mjs render examples/walk.json -o out/walk.mp4
```

## How a spec works

- A **character** has an id, a position (`x`, `y`), a `scale`, and a list of **parts**.
- A **part** is drawn in list order, so later parts sit on top. It has an id, SVG shapes (`svg`), an optional pivot (`origin`), and optional **keyframes**.
- **Keyframes** map a property to `[frame, value]` pairs. Values are linear between keyframes and hold before the first and after the last. Properties: `x`, `y`, `rotate` (degrees), `scale`, and `opacity`.
- Allowed SVG: `g`, `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, and `polygon`, with the attributes listed in `lib/validate.mjs`. Scripts, images, links, event handlers, and text are refused.

See `examples/walk.json` for a walking character with a bobbing head.

## Setup

```bash
node bin/ai-anime.mjs setup
```

This checks for Node.js 20 or newer, runs `npm install` (which downloads Remotion from npm), and prints Remotion's licence notice. Remotion includes the ffmpeg it needs.

Remotion is not included in this repository. Its licence does not allow copying its code into other projects, so each user installs it from npm.

## Licence

The code in this repository is MIT (see [LICENSE](LICENSE)). It uses Remotion, which has its own licence. Remotion is free for teams of up to three people; larger companies need a paid licence. Check [remotion.dev/license](https://www.remotion.dev/license) before commercial use.

## Limits

- The drawings are simple, flat cartoon shapes. They are not a substitute for hand-drawn anime.
- Each part moves as one piece. There is no skeleton, no lip-sync, and no in-between drawing.
- The spec is limited to 20 characters, 100 parts per character, and 3,600 frames.

## Tests

```bash
npm test
```
