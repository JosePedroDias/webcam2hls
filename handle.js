var fs = require('fs');
var child_process = require('child_process');

var async = require('async');

//console.log(process.argv);

var prefix = process.argv.pop();

var files = fs.readdirSync('.');
var regex = new RegExp('^' + prefix + '_');
files = files.filter(function(f) {
	var m = regex.exec(f);
	var f2 = !!m;
	regex.lastIndex = 0;
	return f2;
});
//console.log(files);

var computeDuration = function(f, cb) {
	var out = [];

	var fp = __dirname + '/' + f;

	var args = [
		'/opt/ffmpeg/bin/ffprobe',
		'-v', 'quiet', // less verbose
		'-print_format', 'json', // output json
		'-show_format', // return format info
		// '-show_streams',
		fp
	];

	console.log(args.join(' '));

	var cmd = args.shift();

	var proc = child_process.spawn(cmd, args);

	proc.stdout.on('data', function(data) {
		out.push( data.toString() );
	});

	/*proc.stderr.on('data', function(data) {
		// out.push( data.toString() );
	});*/

	proc.on('close', function() {
		//console.log('close');
		out = out.join('');

		out = JSON.parse(out);
		var d = parseFloat( out.format.duration );

		cb(null, d);
	});
};

var convertWebmToHtmlts = function(f, cb) {
	// var out = [];
	// var err = [];

	var fp = __dirname + '/' + f;
	var fp2 = fp.replace('.webm', '.ts');

	var args = [
		'/opt/ffmpeg/bin/ffmpeg',
		'-i', fp, // inpuf file(s)
		'-vcodec', 'libx264', // video codec
		'-acodec', 'libfaac', // audio codec
		// '-tune', 'zerolatency', // optimize for streaming?
		'-r', '25', // frame rate (fps)
		'-profile:v', 'baseline', // ?
		'-b:v', '800k', // video bitrate
		'-b:a', '48k', // audio bitrate
		'-f', 'mpegts', // desired format
		'-y', // overwrite output files
		fp2 // output file
	];

	console.log(args.join(' '));

	var cmd = args.shift();

	var proc = child_process.spawn(cmd, args);

	/*proc.stdout.on('data', function(data) {
		out.push( data.toString() );
	});

	proc.stderr.on('data', function(data) {
		err.push( data.toString() );
	});
*/
	proc.on('close', function() {
		// console.log('\nOUT\n' + out.join('')+ '\n\n');
		// console.log('\nERR\n' + err.join('')+ '\n\n');

		cb(null, fp2);
	});
};

async.mapLimit(files, 1, computeDuration, function(err, durations) {
	// console.log(err, durations);

	async.mapLimit(files, 1, convertWebmToHtmlts, function(err, tsFiles) {
		// console.log(err, tsFiles);

		var meta = [
			'#EXTM3U',
			'#EXT-X-VERSION:3',
			'#EXT-X-MEDIA-SEQUENCE:0',
			'#EXT-X-ALLOW-CACHE:YES',
			'#EXT-X-TARGETDURATION:3'
		];

		for (var i = 0, I = durations.length; i < I; ++i) {
			meta.push('#EXTINF:' + durations[i] + ',');
			meta.push( tsFiles[i].split('/').pop() );
		}

		meta.push('');

		meta = meta.join('\n');
		metaFile = prefix + '.m3u8';

		fs.writeFile(metaFile, meta, function(err) {
			console.log(err ? err : metaFile + ' and ' + prefix + '_*.ts files created');
		});
	});
});
