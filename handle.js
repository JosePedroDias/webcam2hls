var fs    = require('fs');
var async = require('async');

var videoUtils = require('./videoUtils');



var THREADS =  1;



//console.log(process.argv);

var prefix = process.argv.pop();

var files = fs.readdirSync('videos/' + prefix);
//console.log(files);
var regex = new RegExp('^\\d+\\.webm');
files = files.filter(function(f) {
	var m = regex.exec(f);
	var f2 = !!m;
	regex.lastIndex = 0;
	return f2;
});

var fileDataArr = files.map(function(f) {
	return {
		filePath: 'videos/' + prefix + '/' + f,
		fileName: f
	};
});
//console.log(fileDataArr);



function findVideoDuration2(fileData, cb) {
	videoUtils.findVideoDuration(fileData.filePath, function(err, duration) {
		if (err) { return cb(err); }
		fileData.duration = duration;
		cb(null, duration);
	});
}





async.mapLimit(fileDataArr, THREADS, findVideoDuration2, function(err, durations) {
	// console.log(err, durations);

	videoUtils.computeStartTimes(fileDataArr);

	async.mapLimit(fileDataArr, THREADS, videoUtils.webm2Mpegts, function(err, tsFiles) {
		var playlistFp = 'videos/' + prefix + '/playlist.m3u8';
		videoUtils.generateM3u8Playlist(fileDataArr, playlistFp, false, function(err) {
			console.log(err ? err : 'ALL DONE!');
		});
	});
});
