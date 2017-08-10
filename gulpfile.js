var gulp = require('gulp'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  minify = require('gulp-minify'),
  replace = require('gulp-replace')
  inject = require('gulp-inject-string'),
  indent = require("gulp-indent"),
  del = require("del"),
  runSequence = require('run-sequence'),
  fs = require('fs'),
  package = JSON.parse(fs.readFileSync('./package.json')),
  webPage = package.homepage ? package.homepage : "";


 var to_inject = function()
    {
    	var headerComment = "/*! " + package.name 
      + " v" + package.version + " © 2017 " + package.author 
      + ". " + webPage
   		+ " License: "+package.license 
  		+ " */\n";
      return [headerComment + '(new function(win) { \n', "\nwin.oring = new Oring(_core);  \n}(window));\n"];
    } 


gulp.task('cleanup:before', function () {
  return del([
    'build/*'
  ]);
});

gulp.task('cleanup:after', function () {
  return del([
    'build/_*'
  ]);
});

// Copy deferred.js and replace the (global) with (this),
// so we can use it internally in the dialog
gulp.task('update-deferred-js',  function() {
	 return gulp.src([
      'node_modules/deferred-js/js/deferred.js'
		])
	 .pipe(concat('_deferred_temp.js'))
	 .pipe(replace(/\(window\);/, '(_core);'))
	 .pipe(gulp.dest('build'))
});

gulp.task('build-core-js',  function() {
   return gulp.src([
      'src/lib/Client/Oring.js',
      'src/lib/Client/OringClient.Core.js',
      'node_modules/js-extend/extend.js',
      'build/_deferred_temp.js',
      'src/lib/Client/OringClient.Core.*.js'
    ])
   .pipe(concat('_oring.core.js'))
   .pipe(gulp.dest('build'))
});



function rip(r) {

}


// Concatenate JS Files
gulp.task('scripts', function() {
    return gulp.src([
          'build/_oring.core.js',
          'src/lib/Client/OringClient.js'
      		])
      .pipe(concat('oring.js'))
    	.pipe(inject.wrap(to_inject()[0], to_inject()[1]))

    	//.pipe(jshint())
    	//.pipe(jshint.reporter('default'))
      .pipe(indent({
          tabs:false,
          amount:2
      }))
      .pipe(gulp.dest('build'))

      
      // Shorten some strings for a smaller minified file
      // Replace some long internal messages to something shorter
      //.pipe(replace("'dialogr.set-text'", "'$a'"))

      //.pipe(rename({suffix: '.min'}))
      .pipe(minify({
        ext : {
          min : '.min.js'
        }
      }))
      .pipe(inject.prepend(';'))
      //.pipe(inject.wrap(to_inject_min()[0], to_inject()[1]))
      .pipe(gulp.dest('build'));
});

gulp.task('build', function() {

  runSequence(
      'cleanup:before',
      'update-deferred-js',
      'build-core-js',
      'scripts',
      'cleanup:after'
      );

});

 // Default Task
gulp.task('default', ['build']);