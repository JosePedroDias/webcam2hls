My idea is to make use of the [MediaStream Recording API](http://www.w3.org/TR/mediastream-recording/)
to stream desktop or mobile videos on the fly to the [HTTP Live Streaming](https://developer.apple.com/streaming/) format.

Trying to send webcam video to node.js for video recording and conversion on server-side.

Using [MediaStreamRecorder](https://github.com/streamproc/MediaStreamRecorder) to polyfill the MediaStream Recording API,
capturing `video/webm` 10 second files to the server.

Using the [ffmpeg toolset](https://www.ffmpeg.org/) to do the video processing heavy-lifting tasks.

**NOTE:** For capturing purposes, Google Chrome only captures video, while Firefox captures both video and audio.

The plans are to convert the webm files into HLS metadata + MPEG-TS files on the fly.



## How to install


### FFMPEG on Mac OSX

	brew install ffmpeg --with-fdk-aac --with-ffplay --with-freetype --with-frei0r --with-libass --with-libcaca --with-libquvi --with-libvidstab --with-libvo-aacenc --with-libvorbis --with-libvpx --with-opencore-amr --with-openjpeg --with-openssl --with-opus --with-rtmpdump --with-speex --with-theora --with-tools --with-x265


### FFMPEG on Ubuntu Linux

get up-to-date additional dependencies

	sudo add-apt-repository ppa:mc3man/trusty-media

	sudo apt-get update

	sudo apt-get dist-upgrade

	sudo apt-get install faac libde265 libquvi-dev libvncserver-dev libvpx-dev x264 x265 libass-dev libfdk-aac-dev libcaca-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev libopus-dev librtmp-dev libtheora-dev libvorbis-dev libvo-aacenc-dev libvo-amrwbenc-dev libwebp-dev libx265-dev

we will now compile ffmpeg from source

	wget https://www.ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2

	tar xf ffmpeg-snapshot.tar.bz2

	cd ffmpeg

	./configure --enable-version3 --enable-gpl --enable-nonfree --enable-shared --enable-libcaca --enable-libass --enable-libfaac --enable-libfdk-aac --enable-libfreetype --enable-libmp3lame --enable-libopencore-amrnb --enable-libopencore-amrwb --enable-libopus --enable-libquvi --enable-librtmp --enable-libtheora --enable-libv4l2 --enable-libvo-aacenc --enable-libvorbis --enable-libvo-aacenc --enable-libvo-amrwbenc --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-x11grab --disable-avutil

	make

	sudo make install


### Additional dependencies

	npm install



## How to use

	node serve.js &

in the browser, visit `http://127.0.0.1:8001`

accept video and mic sharing notification

press start

...press stop after some packets have been sent

copy the handle.js invocation call to your console, ex:

    node handle.js <name>

play the resulting HLS video:
	
	ffplay|vlc|mplayer <name>.m3u8

Besides the app at / and the MediaStreamRecorder script,
the server also serves video files correctly
(with ranged request support and correct mime types for `mp4`, `webm`, `m3u8` and `ts` files).



## TODO

### m3u8 integrity

m3u8 almost perfect

	ffprobe -v quiet -show_entries format=start_time,duration <file>.ts

start_time accumulation logic not clear

https://trac.ffmpeg.org/ticket/3353

### firefox sent files not correctly processed

### bg tasks

* learn how to generate this tasks in the bg
* offer API to query for task completion

### live streaming

* support live streaming



## Example ffmpeg commands

	ffprobe -v quiet -print_format json -show_format j6cffc_0.ts

	ffmpeg -i j6cffc_0.webm -vcodec libx264 -acodec libfaac -r 25 -profile:v baseline -b:v 800k -b:a 48k -f mpegts -y j6cffc_0.ts



## HLS NOTES

Sample HLS files:

* http://www.flashls.org/playlists/test_001/stream.m3u8
* http://www.flashls.org/playlists/test_001/stream_1000k_48k_640x360.m3u8
* http://www.flashls.org/playlists/test_001/stream_1000k_48k_640x360_000.ts


Spec notes

* EXT-X-TARGETDURATION http://tools.ietf.org/html/draft-pantos-http-live-streaming-13#section-3.4.2
* EXT-X-ALLOW-CACHE http://www.wowza.com/forums/content.php?496-How-to-control-Apple-HLS-client-caching-%28EXT-X-ALLOW-CACHE%29
* EXTINF http://tools.ietf.org/html/draft-pantos-http-live-streaming-13#section-3.3.2
