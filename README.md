Trying to send webcam video to node.js for video recording on server-side.

Using [MediaStreamRecorder](https://github.com/streamproc/MediaStreamRecorder).

Using the ffmpeg toolset to do the lifting.

**NOTE:** On Chrome only video is encoded, on firefox both video and audio.

The plans are to convert the webm files into HLS metadata + MPEG-TS files.



## How to use

	node serve &

in the browser, visit `http://127.0.0.1:8001`

accept video and mic sharing notification

press start

...press stop after some 3s packets have been sent

copy the handle.js invocation call to your console
	
	ffplay|vlc|mplayer <name>.m3u8



## TODO

### 1

m3u8 almost perfect

	ffprobe -v quiet -show_entries format=start_time,duration <file>.ts

start_time accumulation logic not clear

https://trac.ffmpeg.org/ticket/3353

### 2 bg tasks

* learn how to generate this tasks in the bg
* offer API to query for task completion

### 3 live 

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
