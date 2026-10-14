import { Composition } from "remotion";
import { Scene, SceneProps } from "./Scene";

const defaults: SceneProps = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 60,
  background: "#ffffff",
  characters: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Scene"
      component={Scene}
      defaultProps={defaults}
      fps={30}
      width={1280}
      height={720}
      durationInFrames={60}
      calculateMetadata={({ props }) => ({
        width: props.width,
        height: props.height,
        fps: props.fps,
        durationInFrames: props.duration,
      })}
    />
  );
};
