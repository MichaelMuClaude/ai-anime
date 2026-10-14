// Checks an animation spec before it reaches Remotion. Pure functions, no I/O.

export const ALLOWED_PROPERTIES = ["x", "y", "rotate", "scale", "opacity"];
const ALLOWED_TAGS = new Set(["g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon"]);
const ALLOWED_ATTRIBUTES = new Set([
  "d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points",
  "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-opacity",
  "stroke-opacity", "opacity", "transform",
]);
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const COLOUR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})$/;

export function validateSpec(spec) {
  const errors = [];
  const fail = (message) => errors.push(message);

  if (!isObject(spec)) return ["the spec must be a JSON object"];

  for (const key of ["width", "height"]) {
    if (!Number.isInteger(spec[key]) || spec[key] < 16 || spec[key] > 3840) {
      fail(`${key} must be a whole number from 16 to 3840`);
    }
  }
  if (!Number.isInteger(spec.fps) || spec.fps < 1 || spec.fps > 60) fail("fps must be a whole number from 1 to 60");
  if (!Number.isInteger(spec.duration) || spec.duration < 1 || spec.duration > 3600) {
    fail("duration (in frames) must be a whole number from 1 to 3600");
  }
  if (spec.background !== undefined && !(typeof spec.background === "string" && COLOUR.test(spec.background))) {
    fail("background must be a colour such as #f4f1e8");
  }

  if (!Array.isArray(spec.characters) || spec.characters.length === 0) {
    fail("characters must be a non-empty list");
    return errors;
  }
  if (spec.characters.length > 20) fail("at most 20 characters");

  const characterIds = new Set();
  spec.characters.forEach((character, ci) => {
    const where = `characters[${ci}]`;
    if (!isObject(character)) return fail(`${where} must be an object`);
    if (!ID.test(character.id ?? "")) fail(`${where}.id must be 1-40 letters, digits, _ or -`);
    if (characterIds.has(character.id)) fail(`${where}.id "${character.id}" is used twice`);
    characterIds.add(character.id);
    for (const key of ["x", "y", "scale"]) {
      if (character[key] !== undefined && !Number.isFinite(character[key])) fail(`${where}.${key} must be a number`);
    }
    checkKeyframes(character.keyframes, `${where}.keyframes`, spec.duration, fail);

    if (!Array.isArray(character.parts) || character.parts.length === 0) {
      return fail(`${where}.parts must be a non-empty list`);
    }
    if (character.parts.length > 100) fail(`${where} has more than 100 parts`);

    const partIds = new Set();
    character.parts.forEach((part, pi) => {
      const partWhere = `${where}.parts[${pi}]`;
      if (!isObject(part)) return fail(`${partWhere} must be an object`);
      if (!ID.test(part.id ?? "")) fail(`${partWhere}.id must be 1-40 letters, digits, _ or -`);
      if (partIds.has(part.id)) fail(`${partWhere}.id "${part.id}" is used twice in this character`);
      partIds.add(part.id);
      if (typeof part.svg !== "string" || part.svg.trim() === "") {
        fail(`${partWhere}.svg must be SVG shape elements`);
      } else {
        for (const problem of checkSvg(part.svg)) fail(`${partWhere}.svg: ${problem}`);
      }
      if (part.origin !== undefined && !(Array.isArray(part.origin) && part.origin.length === 2 && part.origin.every(Number.isFinite))) {
        fail(`${partWhere}.origin must be [x, y]`);
      }
      checkKeyframes(part.keyframes, `${partWhere}.keyframes`, spec.duration, fail);
    });
  });

  return errors;
}

export function checkSvg(markup) {
  const problems = [];
  if (/<\s*\/?\s*svg[\s>]/i.test(markup)) problems.push("do not include the <svg> element; list the shapes only");
  if (/<!|<\?|<!\[CDATA/i.test(markup)) problems.push("comments, declarations, and CDATA are not allowed");

  const stack = [];
  const tagPattern = /<(\/?)([A-Za-z][A-Za-z0-9-]*)([^>]*?)(\/?)>/g;
  let match;
  let consumed = "";
  while ((match = tagPattern.exec(markup)) !== null) {
    consumed += markup.slice(consumed.length, match.index);
    const [, closing, name, attributes, selfClosing] = match;
    const tag = name.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      problems.push(`<${name}> is not allowed (allowed: ${[...ALLOWED_TAGS].join(", ")})`);
      continue;
    }
    if (closing) {
      if (stack.pop() !== tag) problems.push(`mismatched closing tag </${name}>`);
      continue;
    }
    for (const attr of attributes.matchAll(/([A-Za-z:-]+)\s*=\s*("[^"]*"|'[^']*')/g)) {
      const attrName = attr[1];
      const value = attr[2].slice(1, -1);
      if (!ALLOWED_ATTRIBUTES.has(attrName)) problems.push(`attribute "${attrName}" is not allowed`);
      if (/javascript:|url\(|<|&#|expression\(/i.test(value)) problems.push(`value of "${attrName}" is not allowed`);
    }
    if (/\son[a-z]+\s*=/i.test(attributes)) problems.push(`event handler attributes are not allowed on <${name}>`);
    if (!selfClosing && tag === "g") stack.push(tag);
    if (!selfClosing && tag !== "g") problems.push(`<${name}> must be self-closing, like <${name} ... />`);
    consumed = markup.slice(0, tagPattern.lastIndex);
  }
  if (stack.length) problems.push("a <g> element is not closed");
  if (/<\s*[A-Za-z]/.test(markup.replace(tagPattern, "")) && !/^\s*$/.test(markup.replace(tagPattern, "").trim())) {
    problems.push("text outside shapes is not allowed");
  }
  return [...new Set(problems)];
}

function checkKeyframes(keyframes, where, duration, fail) {
  if (keyframes === undefined) return;
  if (!isObject(keyframes)) return fail(`${where} must be an object of property -> [[frame, value], ...]`);
  for (const [property, points] of Object.entries(keyframes)) {
    if (!ALLOWED_PROPERTIES.includes(property)) {
      fail(`${where}.${property} is not a property (allowed: ${ALLOWED_PROPERTIES.join(", ")})`);
      continue;
    }
    if (!Array.isArray(points) || points.length === 0) {
      fail(`${where}.${property} must be a non-empty list of [frame, value]`);
      continue;
    }
    let previous = -1;
    for (const point of points) {
      if (!Array.isArray(point) || point.length !== 2 || !Number.isInteger(point[0]) || !Number.isFinite(point[1])) {
        fail(`${where}.${property}: each entry must be [whole frame number, number]`);
        break;
      }
      if (point[0] < 0 || point[0] > duration) fail(`${where}.${property}: frame ${point[0]} is outside 0-${duration}`);
      if (point[0] <= previous) fail(`${where}.${property}: frames must increase`);
      previous = point[0];
    }
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
