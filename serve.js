var fs   = require('fs');
var http = require('http');

var videoUtils = require('./videoUtils');



var files = {
	'/':                        ['text/html',              fs.readFileSync('page.html').toString()],
	'/MediaStreamRecorder.js':  ['application/javascript', fs.readFileSync('node_modules/msr/MediaStreamRecorder.js').toString()]
};

var mimeTypes = {
	'js':   'application/javascript',
	'html': 'text/html',
	'ts':   'video/mp2t',
	'mp4':  'video/mp4',
	'webm': 'video/webm',
	'm3u8': 'application/x-mpegURL'
};

var fileDataArrs = {};

var PORT = 8001;
var LIVE = true;
var PREV_ITEMS_IN_LIVE = 4;



function lastN(arr, n) { // non-destructive
	arr = arr.slice();
	var l = arr.length;
	var i = l - n;
	if (i < 0) { i = 0; }
	return arr.splice(i, n);
}



function respond(res, pair, code) {
	res.writeHeader(
		code || 200,
		{
			'Content-Type':                pair[0],
			'Access-Control-Allow-Origin': '*'
		}
	);
	res.write(pair[1]);  
	res.end();
}

http.createServer(function(req, res) {
	var u = req.url;
    console.log(u);
    var f = files[u];
    if (f) {
    	respond(res, f);	
    }
    else if ((/^\/videos\/?$/).test(u)) {
    	fs.readdir('videos', function(err, dirs) {
    		if (err) {
    			return respond(res, ['text/plain', err.toString(), 500]);
    		}
    		dirs = JSON.stringify(dirs);
    		respond(res, ['application/json', dirs]);
    	});
    }
    else if (u.indexOf('/chunk/') === 0) {
    	var parts = u.split('/');
    	var prefix = parts[2];
    	var num = parts[3];
    	var isFirst = false;
    	var isLast = !!parts[4];

    	if ((/^0+$/).test(num)) {
    		fs.mkdirSync('videos/' + prefix);
    		isFirst = true;
    	}

    	var fp = 'videos/' + prefix + '/' + num + '.webm';
    	var msg = 'got ' + fp;
		console.log(msg);
		console.log('isFirst:%s, isLast:%s', isFirst, isLast);

		var stream = fs.createWriteStream(fp, {encoding:'binary'});
		/*stream.on('end', function() {
			respond(res, ['text/plain', msg]);
		});*/
		
		//req.setEncoding('binary');
		
		req.pipe(stream);
		req.on('end', function() {
			respond(res, ['text/plain', msg]);

			if (!LIVE) { return; }

			videoUtils.findVideoDuration(fp, function(err, duration) {
				if (err) { return console.error(err); }
				console.log('duration: %s', duration.toFixed(2));

				var fd = {
					fileName: num + '.webm',
					filePath: fp,
					duration: duration
				};

				var fileDataArr;
				if (isFirst) {
					fileDataArr = [];
					fileDataArrs[ prefix ] = fileDataArr;
				}
				else {
					fileDataArr = fileDataArrs[ prefix ];
				}
				fileDataArr.push(fd);

				videoUtils.computeStartTimes(fileDataArr);

				videoUtils.webm2Mpegts(fd, function(err, mpegtsFp) {
					if (err) { return console.error(err); }
					console.log('created %s', mpegtsFp);
					
					var playlistFp = 'videos/' + prefix + '/playlist.m3u8';

					var fileDataArr2 = (isLast ? fileDataArr : lastN(fileDataArr, PREV_ITEMS_IN_LIVE));

					var action = (isFirst ? 'created' : (isLast ? 'finished' : 'updated') );

					videoUtils.generateM3u8Playlist(fileDataArr2, playlistFp, !isLast, function(err) {
						console.log('playlist %s %s', playlistFp, (err ? err.toString() : action) );
					});
				});
			});
		});
    }
    else {
    	// serve files, supporting ranged requests

    	var path = u.substring(1);
    	var mimeType = mimeTypes[ u.split('.').pop() ];

    	fs.stat('./' + path, function(err, stats) {
    		if (err) {
    			return respond(res, ['text/plain', '404', 404]);
    		}

    		var total = stats.size;

			if (req.headers.range) { // ranged request
				var range        = req.headers.range;
				var parts        = range.replace(/bytes=/, '').split('-');
				var partialStart = parts[0];
				var partialEnd   = parts[1];
				var start        = parseInt(partialStart, 10);
				var end          = partialEnd ? parseInt(partialEnd, 10) : total-1;
				var chunkSize    = (end - start) + 1;

				var fStream = fs.createReadStream(path, {
					start: start,
					end:   end
				});

				var rangeS = ['bytes ', start, '-', end, '/', total].join('');

				res.writeHead(206, { // ranged download
					'Content-Range':               rangeS,
					'Accept-Ranges':               'bytes',
					'Content-Length':              chunkSize,
					'Content-Type':                mimeType,
					'Access-Control-Allow-Origin': '*'
				});

				console.log([u, 206, mimeType, rangeS].join(' '));
				fStream.pipe(res);
			}
			else { // regular request
				res.writeHead(200, { // regular download
					'Content-Length':              total,
					'Content-Type':                mimeType,
					'Access-Control-Allow-Origin': '*'
				});
				console.log([u, 200, mimeType, 'all'].join(' '));
				fs.createReadStream(path).pipe(res);
			}
    	});
    }
}).listen(PORT);  
console.log('webcam2hls server listening on port %s...', PORT);
