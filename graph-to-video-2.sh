#!/bin/bash
set -e

# ------------------------------------------------------------------------------
# required packages:
#   apt-get install imagemagick bc
#
# usage:
#   bash graph-to-video.sh <GRAPH>
#
# notes:
#   - graph is a chart prepared by LibreOffice Calc using data
#     - don't remove the advertisement periods.
#     - start ~10 min earlier (select an even minute)
#     - stop after ~2 min (select an even minute)
#   - graph is captured by scrot while zooming (ctrl+shift+j) in Calc
#   - graph is a chart modified by GIMP
#     - it should have the same resolution with the source video (ex. 1920x1080)
#     - add advertisement periods by putting rectangle areas with color #d9e303
#       on a layer with 40% transparency
#     - inverted color
#     - graph should be transparent, remove black area
#
#   - X0 is the pixel coordinate for starting point on X axis
#     Use minus 1 pixel because the vertical line's width is 2 pixels.
#   - PPS is the pixels per second
#     - Select a long range such as 21:00 and 24:00
#     - Get the pixel difference of these two points
#     - Calculate the pixels per second
#     - PPS = number_of_pixels / time_difference_as second
#   - Y0 is the pixel coordinate for top point of the slider on Y axis
#   - Y1 is the pixel coordinate for bottom point of the slider on Y axis
#   - SECONDS is the X axis length of the active part [X0, X1] as seconds
#   - FRAMERATE is the number of frames per second (default 0.5)
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

# Graph path such as /tmp/graph.png
GRAPH=$1
# Pixel coordinate of the starting point on X axis, e.g. 120
X0=136
# Pixel per second, e.g. 0.150
PPS=$(bc <<< "scale=6; (1750 - 139) / (3 * 3600)")
# Pixel coordinate of the top point of the slider on Y axis, e.g. 90
Y0=96
# Pixel coordinate of the bottom point of the slider on Y axis, e.g. 1010
Y1=954
# Length of the video as second, e.g. 9112
SECONDS=9112
# Number of frames per second (default 0.5)
FRAMERATE=0.5

# Breaks
# Seconds are the second in video, not in the timeline...
# Pixels are the length of the break as pixel.
SEC1=20
PXL1=150.66
SEC2=8984
PXL2=247
SEC3=9044
PXL3=9

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

    sec=$(bc <<< "scale=4; $i/$FRAMERATE")

    COMP=$(bc <<< "$sec > $SEC1")
    if [[ "$COMP" -eq 1 ]]; then
      x0=$(bc <<< "scale=4; $x0 + $PXL1")
    fi

    COMP=$(bc <<< "$sec > $SEC2")
    if [[ "$COMP" -eq 1 ]]; then
      x0=$(bc <<< "scale=4; $x0 + $PXL2")
    fi

    COMP=$(bc <<< "$sec > $SEC3")
    if [[ "$COMP" -eq 1 ]]; then
      x0=$(bc <<< "scale=4; $x0 + $PXL3")
    fi

    x1=$(bc <<< "scale=4; $x0 + $BOXWIDTH")

    echo $i [$sec s]: $x0 - $x1

    convert $GRAPH -fill "$BOXCOLOR" -draw "rectangle $x0,$Y0 $x1,$Y1" \
        frames/$i.png
done
