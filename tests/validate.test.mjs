import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSpec, checkSvg } from "../lib/validate.mjs";

const base = () => ({
  width: 1280, height: 720, fps: 30, duration: 60, background: "#ffffff",
  characters: [{ id: "hero", x: 100, y: 200, parts: [
    { id: "head", svg: '<circle cx="0" cy="0" r="40" fill="#f5c28b" stroke="#222" stroke-width="4" />' },
  ] }],
});

test("a valid spec has no errors", () => {
  assert.deepEqual(validateSpec(base()), []);
});

test("bad frame rate and size are reported", () => {
  const spec = base();
  spec.fps = 0;
  spec.width = 9000;
  const errors = validateSpec(spec);
  assert.ok(errors.some((e) => e.includes("fps")));
  assert.ok(errors.some((e) => e.includes("width")));
});

test("keyframes must be ordered and inside the duration", () => {
  const spec = base();
  spec.characters[0].parts[0].keyframes = { x: [[10, 0], [5, 3]], y: [[70, 1]] };
  const errors = validateSpec(spec);
  assert.ok(errors.some((e) => e.includes("frames must increase")));
  assert.ok(errors.some((e) => e.includes("outside 0-60")));
});

test("unknown keyframe properties are refused", () => {
  const spec = base();
  spec.characters[0].parts[0].keyframes = { color: [[0, 1]] };
  assert.ok(validateSpec(spec).some((e) => e.includes("is not a property")));
});

test("duplicate ids are refused", () => {
  const spec = base();
  spec.characters.push(base().characters[0]);
  assert.ok(validateSpec(spec).some((e) => e.includes("used twice")));
});

test("allowed shapes pass the SVG check", () => {
  assert.deepEqual(checkSvg('<g><path d="M0 0 L10 10" stroke="#000" /><ellipse cx="1" cy="2" rx="3" ry="4" /></g>'), []);
});

test("scripts, foreign objects, and event handlers are refused", () => {
  assert.ok(checkSvg('<script>alert(1)</script>').length > 0);
  assert.ok(checkSvg('<foreignObject width="10" height="10" />').length > 0);
  assert.ok(checkSvg('<circle cx="0" cy="0" r="5" onload="alert(1)" />').some((p) => p.includes("event handler")));
});

test("links and embedded images are refused", () => {
  assert.ok(checkSvg('<path d="M0 0" fill="url(#x)" />').some((p) => p.includes("not allowed")));
  assert.ok(checkSvg('<image href="http://example.com/a.png" />').length > 0);
});

test("the <svg> wrapper and comments are refused", () => {
  assert.ok(checkSvg('<svg><circle r="1" /></svg>').some((p) => p.includes("<svg>")));
  assert.ok(checkSvg('<!-- hi --><circle r="1" />').some((p) => p.includes("comments")));
});

test("unclosed groups are reported", () => {
  assert.ok(checkSvg('<g><circle r="1" />').some((p) => p.includes("not closed")));
});
