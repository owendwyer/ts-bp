
var gulp = require('gulp');
var concat = require('gulp-concat');

var myFiles=[
	"src/*.js"
];

function combine(cb){
	gulp.src(myFiles)
	.pipe(concat('all.js'))
	.pipe(gulp.dest('./dist/js'))
	.on('end',function(){
		console.log('Simple concat completed - ./dist/all.js');
		console.log('You should check that all folders are listed in myFiles in gulpfile')
		cb();
	});
}

module.exports={
	combine:combine
}
