import React from 'react';
import { Composition, staticFile, getInputProps } from 'remotion';
import { Reel } from './templates.jsx';

const FPS = 30;

// Входные данные приходят из scripts/render.mjs: brief (сценарий), timing (тайминги строк), audio (имя файла в public/)
export const RemotionRoot = () => {
  const props = getInputProps();
  const brief = props.brief || { template: 'frontpage', lines: [{ say: 'This newspaper has exactly one reader.', head: 'One reader' }] };
  const timing = props.timing || { duration: 6, lines: [{ i: 0, start: 0.3, end: 3 }] };
  const audio = props.audio ? staticFile(props.audio) : null;
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={Math.ceil(timing.duration * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ brief, timing, audio }}
    />
  );
};
