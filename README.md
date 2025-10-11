# Rating

## Required packages

```bash
apt-get install imagemagick bc
```

## Graph

- Graph is a chart prepared by LibreOffice Calc using data.
  - Remove the advertisement periods. keep the initial 2 mins.
  - Copy the last minute data to the initial minute of advertisement.
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
