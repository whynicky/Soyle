// All timing for the film lives here. Frames at 30 fps.
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const S1 = { start: 0, end: 150 };      // The opening
export const S2 = { start: 150, end: 300 };    // The idea
export const S3 = { start: 300, end: 480 };    // Introducing Söyle
export const S4 = { start: 480, end: 790 };    // The learning experience
export const S5 = { start: 790, end: 990 };    // Parents and specialists
export const S6 = { start: 990, end: 1320 };   // The brand reveal (holds for the last spoken line)
export const TOTAL = S6.end;

// Beats inside scene 4.
export const B = {
  words: { start: 480, end: 552 },
  tasks: { start: 552, end: 622 },
  play: { start: 622, end: 684 },
  voice: { start: 684, end: 790 },
};
