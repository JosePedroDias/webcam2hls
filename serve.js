var fs = require('fs');
var http = require('http');

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

var PORT = 8001;

var respond = function(res, pair, code) {
	res.writeHeader(code || 200, {'Content-Type': pair[0]});
	res.write(pair[1]);  
	res.end();
};

http.createServer(function(req, res) {
	var u = req.url;
    console.log(u);
    var f = files[u];
    if (f) {
    	respond(res, f);	
    }
    else if (u.indexOf('/chunk/') === 0) {
    	var parts = u.split('/');
    	var n = parts[2];
    	var c = parts[3];

    	if (c === '00000') {
    		fs.mkdirSync('videos/' + n);
    	}

    	var fn = 'videos/' + n + '/' + c + '.webm';
    	var msg = ['got', n, c, '->', fn].join(' ');
		console.log(msg);

		var stream = fs.createWriteStream(fn, {encoding:'binary'});
		/*stream.on('end', function() {
			respond(res, ['text/plain', msg]);
		});*/
		
		//req.setEncoding('binary');
		
		req.pipe(stream);
		req.on('end', function() {
			respond(res, ['text/plain', msg]);
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
					'Content-Range':  rangeS,
					'Accept-Ranges':  'bytes',
					'Content-Length': chunkSize,
					'Content-Type':   mimeType
				});

				console.log([u, 206, mimeType, rangeS].join(' '));
				fStream.pipe(res);
			}
			else { // regular request
				res.writeHead(200, { // regular download
					'Content-Length': total,
					'Content-Type':   mimeType
				});
				console.log([u, 200, mimeType, 'all'].join(' '));
				fs.createReadStream(path).pipe(res);
			}
    	});
    }
}).listen(PORT);  
console.log('webcam2hls server listening on port %s...', PORT);
