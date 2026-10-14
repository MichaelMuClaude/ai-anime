import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export type Keyframes = Partial<Record<"x" | "y" | "rotate" | "scale" | "opacity", [number, number][]>>;

export type Part = {
  id: string;
  svg: string; // shape elements only; validated before rendering
  origin?: [number, number];
  keyframes?: Keyframes;
};

export type Character = {
  id: string;
  x?: number;
  y?: number;
  scale?: number;
  keyframes?: Keyframes;
  parts: Part[];
};

export type SceneProps = {
  width: number;
  height: number;
  fps: number;
  duration: number;
  background?: string;
  characters: Character[];
};

// Value of a property at a frame: linear between keyframes, held before the first and after the last.
export function valueAt(keys: [number, number][] | undefined, frame: number, fallback: number): number {
  if (!keys || keys.length === 0) return fallback;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f0, v0] = keys[i - 1];
    const [f1, v1] = keys[i];
    if (frame <= f1) return interpolate(frame, [f0, f1], [v0, v1]);
  }
  return keys[keys.length - 1][1];
}

export const Scene: React.FC<SceneProps> = ({ width, height, background = "#ffffff", characters }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {characters.map((character) => {
          const k = character.keyframes;
          const x = valueAt(k?.x, frame, character.x ?? 0);
          const y = valueAt(k?.y, frame, character.y ?? 0);
          const s = valueAt(k?.scale, frame, character.scale ?? 1);
          return (
            <g key={character.id} transform={`translate(${x} ${y}) scale(${s})`}>
              {character.parts.map((part) => {
                const pk = part.keyframes;
                const [ox, oy] = part.origin ?? [0, 0];
                const rotate = valueAt(pk?.rotate, frame, 0);
                const scale = valueAt(pk?.scale, frame, 1);
                const px = valueAt(pk?.x, frame, 0);
                const py = valueAt(pk?.y, frame, 0);
                const opacity = valueAt(pk?.opacity, frame, 1);
                return (
                  <g
                    key={part.id}
                    opacity={opacity}
                    transform={`translate(${px} ${py}) rotate(${rotate} ${ox} ${oy}) translate(${ox} ${oy}) scale(${scale}) translate(${-ox} ${-oy})`}
                    dangerouslySetInnerHTML={{ __html: part.svg }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
