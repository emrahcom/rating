// -----------------------------------------------------------------------------
// required packages:
//   apt-get install imagemagick
//
// usage:
//   deno run --allow-run --allow-read --allow-write graph-to-video.ts <GRAPH>
// -----------------------------------------------------------------------------
// Pixel coordinate of the starting point (minus 1) on X axis, e.g. 120
const X0 = 145;
// Pixels per second, e.g. 0.150
// pixels_difference_of_two_points / time_in_sec
const PPS = (1879 - 151) / (3 * 3600);
// Pixel coordinate of the top point of the slider on Y axis, e.g. 90
const Y0 = 83;
// Pixel coordinate of the bottom point of the slider on Y axis, e.g. 1010
const Y1 = 934;
// Length of the video (MP4 file) in second, e.g. 9112
const SECONDS = 8227;
// Number of frames per second (default 0.5)
const FRAMERATE = 0.5;

// Breaks
// - Seconds are the second in the video (MP4 file), not in the timeline...
//   - The video doesn't contain advertisements
//   - Be careful if the next part repeats the same scenes. Use the coordinate
//     of the next scene.
// - Advertisements are the lenght of the break in seconds.
// - Pixels are the length of the break in pixels.
// - Update the codes in loop if the number of breaks is more than 4.

// First break
const SEC1 = 112;
const ADV1 = 812;
const PXL1 = PPS * ADV1;

// Second break
const SEC2 = 4678;
const ADV2 = 860;
const PXL2 = PPS * ADV2;

// Third break
const SEC3 = 8132;
const ADV3 = 919;
const PXL3 = PPS * ADV3;

// Fourth break
const SEC4 = 9900;
const ADV4 = 0;
const PXL4 = PPS * ADV4;

const FRAMES_DIR = "frames";
const BOX_COLOR = "rgb(255, 0, 0)";
const BOX_WIDTH = 2;

// -----------------------------------------------------------------------------
// Fail if no argument.
if (Deno.args.length === 0) {
  console.error("Missing argument. Usage:");
  console.error("  deno run --allow-run -RW graph-to-video-2.ts <GRAPH>");
  Deno.exit(1);
}
const GRAPH = Deno.args[0];

// Fail if no file.
const graphStatus = await Deno.stat(GRAPH);
if (!graphStatus.isFile) {
  console.error("No file");
  Deno.exit(1);
}

// Fail if the frame directory is no writable.
try {
  await Deno.mkdir(FRAMES_DIR, { recursive: true });

  const command = new Deno.Command("find", {
    args: [FRAMES_DIR, "-name", "*.png", "-delete"],
  });
  await command.output();
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

  // Create each frame.
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
