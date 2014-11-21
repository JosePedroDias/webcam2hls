var fs = require('fs');
var http = require('http');

var files = {
	'/':                        ['text/html',              fs.readFileSync('page.html').toString()],
	'/MediaStreamRecorder.js':  ['application/javascript', fs.readFileSync('node_modules/msr/MediaStreamRecorder.js').toString()]
};

var PORT = 8000;

var respond = function(res, pair) {
	res.writeHeader(200, {'Content-Type': pair[0]});
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
    	var p = u.split('/');
    	var n = p[1];
    	var c = p[2];
    	var f = n + '_' + c + '.webm';
		console.log('got chunk %s %s', n, c);
		var stream = fs.createWriteStream(f);
		stream.on('end', function() {
			respond(res, ['text/plain', ['GOT', n, c, '->', f].join(' ') ] );
		});
		req.setEncoding('binary');
		req.pipe(stream);
    }
    else {
    	respond(res, ['text/plain', 'WAT? ' + u]);
    }
}).listen(PORT);  
console.log('MediaStreamRecorder app listening to port %s...', PORT);
