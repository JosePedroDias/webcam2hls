Trying to send webcam video to node.js for video recording on server-side.

Using [MediaStreamRecorder](https://github.com/streamproc/MediaStreamRecorder).

On Chrome only video is encoded, on firefox both video and audio.

The plans are to convert the webm files into HLS metadata + MPEG-TS files.
	
	ffprobe 48vofi_0.webm
	ffprobe 48vofi_1.webm
	ffprobe 48vofi_2.webm

	# -force_key_frames 50 ?
    ffmpeg -i 48vofi_0.webm -vcodec libx264 -acodec libfaac -tune zerolatency -r 25 -profile:v baseline -b:v 800k -b:a 48k -f mpegts 48vofi_0.ts
    ffmpeg -i 48vofi_1.webm -vcodec libx264 -acodec libfaac -tune zerolatency -r 25 -profile:v baseline -b:v 800k -b:a 48k -f mpegts 48vofi_1.ts
    ffmpeg -i 48vofi_2.webm -vcodec libx264 -acodec libfaac -tune zerolatency -r 25 -profile:v baseline -b:v 800k -b:a 48k -f mpegts 48vofi_2.ts


## TODO

* measure chunk durations (at least the last one) via ffprobe
* autogen m3u8 file and ffmpeg script


## HLS NOTES

Sample

* http://www.flashls.org/playlists/test_001/stream.m3u8
* http://www.flashls.org/playlists/test_001/stream_1000k_48k_640x360.m3u8
* http://www.flashls.org/playlists/test_001/stream_1000k_48k_640x360_000.ts

Spec notes

* EXT-X-TARGETDURATION http://tools.ietf.org/html/draft-pantos-http-live-streaming-13#section-3.4.2
* EXTINF http://tools.ietf.org/html/draft-pantos-http-live-streaming-13#section-3.3.2
