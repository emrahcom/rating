// Graph's path such as /tmp/graph.png
const GRAPH = "/home/emrah/test/tbd/08/graph-0-1080i.png";
// Pixel coordinate of the starting point (minus 1) on X axis, e.g. 120
const X0 = 144;
// Pixels per second, e.g. 0.150
// pixels_difference_of_two_points / time_in_sec
const PPS = (1821 - 294) / (3 * 3600);
// Pixel coordinate of the top point of the slider on Y axis, e.g. 90
const Y0 = 72;
// Pixel coordinate of the bottom point of the slider on Y axis, e.g. 1010
const Y1 = 934;
// Length of the video (MP4 file) in second, e.g. 9112
const SECONDS = 9085;
// Number of frames per second (default 0.5)
const FRAMERATE = 0.5;

// Breaks
// - Seconds are the second in the video (MP4 file), not in the timeline...
//   - The video doesn't contain advertisements
//   - Be careful if the next part repeats the same scenes. Use the coordinate
//     of the next scene.
// - Advertisements are the lenght of the break in seconds.
// - Pixels are the length of the break in pixels.
// - Update the codes in loop if the number of breaks is updated.
const SEC1 = 125;
const ADV1 = 803;
const PXL1 = PPS * ADV1;

// Seconds from the start, minus previous advertisement times.
const SEC2 = 5390;
const ADV2 = 927;
const PXL2 = PPS * ADV2;

// Third from the start, minus previous advertisement times.
const SEC3 = 8982;
const ADV3 = 768;
const PXL3 = PPS * ADV3;

// Forth from the start, minus previous advertisement times.
const SEC4 = 9100;
const ADV4 = 0;
const PXL4 = PPS * ADV4;

const FRAMES_DIR = "frames";
const BOX_COLOR = "rgb(255, 0, 0)";
const BOX_WIDTH = 2;

// -----------------------------------------------------------------------------
try {
  await Deno.remove(FRAMES_DIR, { recursive: true });
} catch {
  // do nothing
}

try {
  await Deno.mkdir(FRAMES_DIR, { recursive: true });
} catch {
  console.error("Error while creating the directory");
  Deno.exit(1);
}

const lastFrame = SECONDS * FRAMERATE;
for (let i = 0; i <= lastFrame; i++) {
  // Second of the video. not the timeline...
  const sec = i / FRAMERATE;

  let x0 = X0 + PPS * i / FRAMERATE;
  // Add the break1 time if the second is bigger than the breakpoint's time
  if (sec > SEC1) {
    x0 = x0 + PXL1;
  }
  // Add the break2 time if the second is bigger than the breakpoint's time
  if (sec > SEC2) {
    x0 = x0 + PXL2;
  }
  // Add the break3 time if the second is bigger than the breakpoint's time
  if (sec > SEC3) {
    x0 = x0 + PXL3;
  }
  // Add the break4 time if the second is bigger than the breakpoint's time
  if (sec > SEC4) {
    x0 = x0 + PXL4;
  }

  const x1 = x0 + BOX_WIDTH;

  console.log(`${i} [${sec} s]: ${x0.toFixed(6)} - ${x1.toFixed(6)}`);

  const command = new Deno.Command("convert", {
    args: [
      GRAPH,
      "-fill",
      BOX_COLOR,
      "-draw",
      `rectangle ${x0},${Y0} ${x1},${Y1}`,
      `frames/${i.toString().padStart(6, "0")}.png`,
    ],
  });
  command.output();
}
