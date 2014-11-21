var fs = require('fs');
var child_process = require('child_process');

var async = require('async');

var THREADS = 1;
var FPS = 25;

//console.log(process.argv);

var prefix = process.argv.pop();

var files = fs.readdirSync('.');
var regex = new RegExp('^' + prefix + '_\\d+\\.webm');
files = files.filter(function(f) {
	var m = regex.exec(f);
	var f2 = !!m;
	regex.lastIndex = 0;
	return f2;
});
//console.log(files);


var maxOfArr = function(arr) {
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
	return arr.reduce(function(prev, curr/*, idx, arr*/) {
		return Math.max(prev, curr);
	});
};

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

// o is an object with keys f and t0
var convertWebmToHtmlts = function(o, cb) {
	// var out = [];
	// var err = [];

	var t0 = o.t0;
	var fp = __dirname + '/' + o.f;
	var fp2 = fp.replace('.webm', '.ts');

	var args = [
		'/opt/ffmpeg/bin/ffmpeg',
		'-i', fp, // inpuf file(s)
		'-vcodec', 'libx264', // video codec
		'-acodec', 'libfaac', // audio codec
		// '-tune', 'zerolatency', // optimize for streaming?
		'-r', FPS, // frame rate (fps)
		'-profile:v', 'baseline', // ?
		'-b:v', '800k', // video bitrate
		'-b:a', '48k', // audio bitrate
		'-f', 'mpegts', // desired format
		// '-fflags', '+igndts', // WTF?! https://trac.ffmpeg.org/ticket/3558
		'-strict', 'experimental', // https://trac.ffmpeg.org/ticket/1839
		'-mpegts_copyts', '1',
		// '-filter:v', "'setpts=10+PTS'", // https://www.ffmpeg.org/ffmpeg-filters.html#toc-setpts_002c-asetpts
		'-filter:v', 'setpts=PTS+' + t0 + '/TB',
		//-async 1
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

var frameTime = 1 / FPS; // TODO not sure this is the best approach, adding one fictitious frame

async.mapLimit(files, THREADS, computeDuration, function(err, durations) {
	// console.log(err, durations);

	var t = 0;
	var objs = files.map(function(f, idx) {
		var o = {
			f: f,
			t0: t/* + frameTime*/
		};
		t += durations[idx] + frameTime;
		return o;
	});

	async.mapLimit(objs, THREADS, convertWebmToHtmlts, function(err, tsFiles) {
		// console.log(err, tsFiles);

		var maxT = maxOfArr(durations);

		var meta = [
			'#EXTM3U',
			'#EXT-X-VERSION:3',
			'#EXT-X-MEDIA-SEQUENCE:0',
			'#EXT-X-ALLOW-CACHE:YES',
			'#EXT-X-TARGETDURATION:' + Math.ceil(maxT),
		];

		for (var i = 0, I = durations.length; i < I; ++i) {
			meta.push('#EXTINF:' + durations[i] + ',');
			meta.push( tsFiles[i].split('/').pop() );
		}

		meta.push('#EXT-X-ENDLIST');
		meta.push('');

		meta = meta.join('\n');
		metaFile = prefix + '.m3u8';

		fs.writeFile(metaFile, meta, function(err) {
			console.log(err ? err : metaFile + ' and ' + prefix + '_*.ts files created');
		});
	});
});
