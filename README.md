# Rating

## Required packages

```bash
apt-get install imagemagick bc
```

## Graph

- Graph is a chart prepared by LibreOffice Calc using data.
  - Remove the advertisement periods. keep the initial 2 mins.
  - Copy the last minute data to the initial minute of advertisement.
  - Chart with:
    - Line
    - Line only
    - Dislay legend: Top
- Graph is captured by scrot while zooming (ctrl+shift+j) in Calc.
- Graph is a chart modified by GIMP
  - It should have the same resolution with the source video (ex. 1920x1080)
  - Glue the advertisement edges. Remove the second minute of advertisement.
  - Graph should be transparent
  - Inverted color may be better

## Parameters

- `X0` is the pixel coordinate for starting point on X axis.
- `X1` is the pixel coordinate for ending point on X axis.
- `Y0` is the pixel coordinate for top point of the slider on Y axis.
- `Y1` is the pixel coordinate for bottom point of the slider on Y axis.
- `SECONDS` is the X axis length of the active part [`X0`, `X1`] as seconds.
- `FRAMERATE` is the number of frames per second (_default 0.5_).

## Video

```bash
FRAMERATE=0.5
ffmpeg -r $FRAMERATE -i frames/%06d.png -vcodec h264 -y /tmp/timer.mp4
ffmpeg -i source.mp4 -r $FRAMERATE -i frames/%06d.png \
  -filter_complex "overlay=0:0" -y graph-0.mp4
ffmpeg -i graph-0.mp4 -c copy -movflags faststart -y graph-1.mp4
```

## Upload

Manually clear the remote folder before uploading.

```bash
mkdir split
cd split
split -b 10M ../graph-1.mp4
rsync -ave "ssh -p 22" ../split/ remote-host:/mnt/store/project-name/split/
```

## On remote

```bash
cd /mnt/store/project-name
cat split/* >graph-1.mp4
md5sum graph-1.mp4
```
