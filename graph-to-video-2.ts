// -----------------------------------------------------------------------------
// required packages:
//   apt-get install imagemagick
//
// usage:
//   deno run --allow-run --allo-read --allow-write graph-to-video-2.ts
//
// notes:
//   - graph is a chart prepared by LibreOffice Calc using the rating data
//     - first, save as ODS (minutes.ods)
//     - Copy the sheet as 'rating'.
//     - don't remove the advertisement periods.
//     - start ~10 min earlier (select an even minute)
//     - stop after ~2 min (select an even minute)
//   - Create an empty sheet, graph
//     - Insert chart
//     - Line -> Lines only, Line type: smooth or straight
//     - Data series in columns
//     - Display the legend at top
//     - Make full screen with even numbers in X axis.
//     - Space between X axis and the bottom to make it visible all the time.
//   - graph is captured by scrot while zooming (ctrl+shift+j) in Calc
//   - graph is a chart modified by GIMP
//     - it should have the same resolution with the source video (ex 1920x1080)
//     - First, calculate PPS
//     - X axis should be shifted to the left by 30 seconds since the value of
//       point is the average rating of the next minute.
//     - Start and end time with color #0815ca (delete and fill)
//     - add advertisement periods by putting rectangle areas with color #d9e303
//       on a layer with 40% transparency
//     - inverted color (merge layers before inverting)
//     - graph should be transparent, remove black area
//
//   - GRAPH is the path of PNG.
//   - X0 is the pixel coordinate for starting point on X axis
//     Use minus 1 pixel because the vertical line's width is 2 pixels.
//   - PPS is the pixels per second
//     - Select a long range such as 21:00 and 24:00
//     - Get the pixel difference of these two points
//     - Calculate the pixels per second
//     - PPS = number_of_pixels / time_difference_as second
//     - See PPS line and use bc with correct values
//   - Y0 is the pixel coordinate for top point of the slider on Y axis
//   - Y1 is the pixel coordinate for bottom point of the slider on Y axis
//   - SECONDS is the length of the video (MP4 file) in seconds
//   - FRAMERATE is the number of frames per second (default 0.5)
//   - set BREAKS
//
// video:
//   FRAMERATE=0.5
//   ffmpeg -r $FRAMERATE -i frames/%06d.png -vcodec h264 -y /tmp/timer.mp4
//
//   # Watch and check /tmp/timer.mp4
//   mpv /tmp/timer.mp4
//
//   ffmpeg -i source.mp4 -r $FRAMERATE -i frames/%06d.png \
//       -filter_complex "overlay=0:0" -y output/graph-0.mp4
//   ffmpeg -i output/graph-0.mp4 -c:v libx264 -b:v 2000k -pix_fmt yuv420p \
//       -y output/graph-1.mp4
//   ffmpeg -i output/graph-1.mp4 -c copy -movflags faststart \
//       -y output/graph-2.mp4
//
// upload:
//   manually clear the remote folder before uploading
//
//   mkdir split
//   cd split
//   split -b 10M ../output/graph-1.mp4
//   rsync -ave "ssh -p 22" ../split/ remote-host:/mnt/store/project-name/split/
//
// on remote:
//   cd /mnt/store/project-name
//   cat split/* >graph-1.mp4
//   md5sum graph-1.mp4
// -----------------------------------------------------------------------------
// Pixel coordinate of the starting point (minus 1) on X axis, e.g. 120
const X0 = 110;
// Pixels per second, e.g. 0.150
// pixels_difference_of_two_points / time_in_sec
const PPS = (1886 - 218) / (3 * 3600);
// Pixel coordinate of the top point of the slider on Y axis, e.g. 90
const Y0 = 72;
// Pixel coordinate of the bottom point of the slider on Y axis, e.g. 1010
const Y1 = 948;
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
