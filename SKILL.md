---
name: ai-anime
description: Draw simple cartoon characters as layered SVG shapes and animate them into an MP4 video with Remotion. Use when the user asks for an animated cartoon, a simple character video, or a motion clip made from drawn shapes.
---

# ai-anime

## Workflow

1. Write a spec as JSON. Start from `node bin/ai-anime.mjs example`.
2. Check it: `node bin/ai-anime.mjs check spec.json`. Fix every error it lists.
3. Render it: `node bin/ai-anime.mjs render spec.json -o out/clip.mp4`.
4. Extract a frame to look at it, for example with `node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg -ss 1 -i out/clip.mp4 -frames:v 1 frame.png`, and view the image.

## Writing a spec

- Draw each body part as SVG shapes in one `svg` string, with no `<svg>` wrapper.
- Use `<g>` to group shapes, and close every `<g>`.
- Keep the head, body, arms, and legs as separate parts so they can move independently.
- Set `origin` to the joint the part rotates around. Legs should use their hip as the origin, not the body centre.
- Keyframe frames run from 0 to `duration`, in increasing order.
- Give ids as letters, digits, `_` or `-`, unique within their list.

## Rules

- Only the SVG shapes and attributes listed in `lib/validate.mjs` are allowed. Do not add scripts, images, links, or text.
- Keep `width`, `height`, `fps`, and `duration` within the limits the checker reports.
- Run `check` before `render`. Rendering a spec that fails the check is refused.

## Limits

- Flat, simple shapes only. No lip-sync, skeletal rigs, or hand-drawn animation.
