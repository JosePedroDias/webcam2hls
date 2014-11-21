var fs = require('fs');
var http = require('http');

var files = {
	'/':                        ['text/html',              fs.readFileSync('page.html').toString()],
	'/MediaStreamRecorder.js':  ['application/javascript', fs.readFileSync('node_modules/msr/MediaStreamRecorder.js').toString()]
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
    	var fn = n + '_' + c + '.webm';
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
    	respond(res, ['text/plain', '404', 404]);
    }
}).listen(PORT);  
console.log('MediaStreamRecorder app listening to port %s...', PORT);
