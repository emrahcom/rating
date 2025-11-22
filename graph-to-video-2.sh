#!/bin/bash
set -e

# ------------------------------------------------------------------------------
# required packages:
#   apt-get install imagemagick bc
#
# usage:
#   bash graph-to-video-2.sh <GRAPH>
#
# notes:
#   - graph is a chart prepared by LibreOffice Calc using the rating data
#     - first, save as ODS (minutes.ods)
#     - Copy the sheet as 'rating'.
#     - don't remove the advertisement periods.
#     - start ~10 min earlier (select an even minute)
#     - stop after ~2 min (select an even minute)
#   - Create an empty sheet, graph
#     - Insert chart
#     - Line -> Lines only, Line type: smooth
#     - Data series in columns
#     - Display the legend at top
#     - Make full screen with even numbers in X axis.
#     - Space between X axis and the bottom to make it visible all the time.
#   - graph is captured by scrot while zooming (ctrl+shift+j) in Calc
#   - graph is a chart modified by GIMP
#     - it should have the same resolution with the source video (ex. 1920x1080)
#     - First, calculate PPS
#     - X axis should be shifted to the left by 30 seconds since the value of
#       point is the average rating of the next minute.
#     - Start and end time with color #0815ca (delete and fill)
#     - add advertisement periods by putting rectangle areas with color #d9e303
#       on a layer with 40% transparency
#     - inverted color (merge layers before inverting)
#     - graph should be transparent, remove black area
#
#   - X0 is the pixel coordinate for starting point on X axis
#     Use minus 1 pixel because the vertical line's width is 2 pixels.
#   - PPS is the pixels per second
#     - Select a long range such as 21:00 and 24:00
#     - Get the pixel difference of these two points
#     - Calculate the pixels per second
#     - PPS = number_of_pixels / time_difference_as second
#     - See PPS line and use bc with correct values
#   - Y0 is the pixel coordinate for top point of the slider on Y axis
#   - Y1 is the pixel coordinate for bottom point of the slider on Y axis
#   - SECONDS is the length of the video (MP4 file) in seconds
#   - FRAMERATE is the number of frames per second (default 0.5)
#   - set BREAKS
#
# video:
#   FRAMERATE=0.5
#   ffmpeg -r $FRAMERATE -i frames/%06d.png -vcodec h264 -y /tmp/timer.mp4
#
#   # Watch and check /tmp/timer.mp4
#   mpv /tmp/timer.mp4
#
#   ffmpeg -i source.mp4 -r $FRAMERATE -i frames/%06d.png \
#       -filter_complex "overlay=0:0" -y output/graph-0.mp4
#   ffmpeg -i output/graph-0.mp4 -c copy -movflags faststart \
#       -y output/graph-1.mp4
#
# upload:
#   manually clear the remote folder before uploading
#
#   mkdir split
#   cd split
#   split -b 10M ../output/graph-1.mp4
#   rsync -ave "ssh -p 22" ../split/ remote-host:/mnt/store/project-name/split/
#
# on remote:
#   cd /mnt/store/project-name
#   cat split/* >graph-1.mp4
#   md5sum graph-1.mp4
# ------------------------------------------------------------------------------
mkdir -p frames
rm -f frames/*.png

# Graph's path such as /tmp/graph.png
GRAPH=$1
# Pixel coordinate of the starting point (minus 1) on X axis, e.g. 120
X0=131.83
# Pixels per second, e.g. 0.150
# pixels_difference_of_two_points / time_in_sec
PPS=$(bc <<< "scale=6; (1798 - 154) / (3 * 3600)")
# Pixel coordinate of the top point of the slider on Y axis, e.g. 90
Y0=68
# Pixel coordinate of the bottom point of the slider on Y axis, e.g. 1010
Y1=973
# Length of the video (MP4 file) in second, e.g. 9112
SECONDS=9261
# Number of frames per second (default 0.5)
FRAMERATE=0.5

# Breaks
# - Seconds are the second in the video (MP4 file), not in the timeline...
#   - The video doesn't contain advertisements
#   - Be careful if the next part repeats the same scenes. Use the coordinate
#     of the next scene.
# - Advertisements are the lenght of the break in seconds.
# - Pixels are the length of the break in pixels.
# - Update the codes in loop if the number of breaks is updated.
SEC1=116
ADV1=946
PXL1=$(bc <<< "scale=6; $PPS * $ADV1")

# Seconds from the start, minus previous advertisement times.
SEC2=9168
ADV2=644
PXL2=$(bc <<< "scale=6; $PPS * $ADV2")

if [[ $# -ne 1 ]]; then
  echo "Missing argument"
  echo "bash $0 <GRAPH>"
  exit 1
fi

BOXCOLOR="rgb(255, 0, 0)"
BOXWIDTH=2

SEQ_END=$(bc <<< "scale=0; $SECONDS*$FRAMERATE")
for i in $(seq -f "%06g" 0 $SEQ_END); do
    x0=$(bc <<< "scale=4; $X0 + $PPS*$i/$FRAMERATE")

    # second of the video. not the timeline...
    sec=$(bc <<< "scale=4; $i/$FRAMERATE")

    # Add the break1 time if the second is bigger than the breakpoint's time
    COMP=$(bc <<< "$sec > $SEC1")
    if [[ "$COMP" -eq 1 ]]; then
      x0=$(bc <<< "scale=4; $x0 + $PXL1")
    fi

    # Add the break2 time if the second is bigger than the breakpoint's time
    COMP=$(bc <<< "$sec > $SEC2")
    if [[ "$COMP" -eq 1 ]]; then
      x0=$(bc <<< "scale=4; $x0 + $PXL2")
    fi

    x1=$(bc <<< "scale=4; $x0 + $BOXWIDTH")

    echo $i [$sec s]: $x0 - $x1

    convert $GRAPH -fill "$BOXCOLOR" -draw "rectangle $x0,$Y0 $x1,$Y1" \
        frames/$i.png
done
