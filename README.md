Trying to send webcam video to node.js for video recording on server-side.

Using [MediaStreamRecorder](https://github.com/streamproc/MediaStreamRecorder).

Using the ffmpeg toolset to do the lifting.

**NOTE:** On Chrome only video is encoded, on firefox both video and audio.

The plans are to convert the webm files into HLS metadata + MPEG-TS files.



## TODO

* fix borked ts or m3u8 (the playback is weird)
* learn how to generate this tasks in the bg
* offer API to query for task completion
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
* EXTINF http://tools.ietf.org/html/draft-pantos-http-live-streaming-13#section-3.3.2
