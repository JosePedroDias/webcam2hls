var fs = require('fs');

var express = require('express');

var pageContent = fs.readFileSync('page.html').toString();

var PORT = 8000;

var app = express();

app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.get('/', function(req, res) {
    res.end(pageContent);
});

app.post('/chunk/:name/:count', function(req, res) {

	try {
		var n = req.params.name;
		var c = req.params.count;
		var f = n + '_' + c + '.webm';

		console.log('got chunk %s %s', n, c);

		var stream = fs.createWriteStream(f);

		stream.on('end', function() {
			res.end([ 'GOT', n, c, '->', f].join(' '));
		});

		//console.log(req); res.end(':P');

		req.socket.pipe(stream);
	} catch (ex) {
		res.end('ERROR: ' + ex.message);
	}
});

var server = app.listen(PORT, function() {
    console.log('MediaStreamRecorder app listening to port %s...', PORT);
});
