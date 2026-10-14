#!/usr/bin/env node
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateSpec } from "../lib/validate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [command, ...args] = process.argv.slice(2);

function load(path) {
  if (!path || !existsSync(path)) fail(`no such file: ${path ?? "(none)"}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`ai-anime: draw cartoon characters as layered SVG and animate them with Remotion

  ai-anime example                      print an example spec (examples/walk.json)
  ai-anime check SPEC.json              validate a spec; prints problems and exits 1 if any
  ai-anime render SPEC.json -o OUT.mp4  validate, then render an MP4 with Remotion

A spec is JSON. Each part is a list of SVG shapes (path, circle, ellipse, rect, line,
polyline, polygon, and g), with keyframes for x, y, rotate, scale, and opacity.`);
}

if (command === "example") {
  console.log(readFileSync(resolve(root, "examples/walk.json"), "utf8"));
} else if (command === "check") {
  const spec = load(args[0]);
  const errors = validateSpec(spec);
  if (errors.length) {
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
  console.log("valid");
} else if (command === "render") {
  const specPath = resolve(args[0] ?? "");
  const spec = load(specPath);
  const errors = validateSpec(spec);
  if (errors.length) {
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
  const outIndex = args.indexOf("-o");
  if (outIndex < 0 || !args[outIndex + 1]) fail("render needs -o OUT.mp4");
  const output = resolve(args[outIndex + 1]);
  mkdirSync(dirname(output), { recursive: true });
  const result = spawnSync(
    process.execPath,
    [resolve(root, "node_modules/@remotion/cli/remotion-cli.js"), "render", "Scene", output, `--props=${specPath}`],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) fail("rendering failed");
  console.log(JSON.stringify({ output, frames: spec.duration, fps: spec.fps, size: [spec.width, spec.height] }, null, 2));
} else {
  usage();
  process.exit(command ? 1 : 0);
}
