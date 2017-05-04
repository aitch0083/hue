var path    = require('path');
var gulp    = require('gulp');
var through = require('through2');
var gutil   = require('gulp-util');
var gm      = require('gulp-gm');
var watch   = require('gulp-watch');

var debug          = false;
var PluginError    = gutil.PluginError;
var dirname        = __dirname;
var parent_dir     = path.dirname(dirname);
var source_dir     = parent_dir + '/hue/public/images/uploaded/';
var debug_dir      = parent_dir + '/hue/opt/images/';
var production_dir = parent_dir + '/hue/public/images/uploaded/';
var target_dir     = (debug ? debug_dir : production_dir);

/**
 * Optimise the images
 */
gulp.task('image-opt', function(cb) {

	return watch(source_dir + '*.*', function(vinyl){
		
		// console.info('from:', source_dir, ', to:', target_dir);
		// console.info('vinyl:', vinyl.event, ', path:',vinyl.path);

		if(vinyl.event === 'add'){

			gulp.src(vinyl.path) //only take care of the newly added images
				.pipe(gm(function(gm_file, done){

					gm_file.format(function(err, format){
			    		
			    		// console.info('go go go:', format);

			    		if(format === 'JPEG'){
			    			done(null, gm_file.strip().quality(90).colorspace('RGB').interlace('Line').samplingFactor(2, 1).noProfile());
			    		} else if(format === 'PNG'){
			    			done(null, gm_file.type('PaletteMatte').strip().noProfile());
			    		} else {
			    			done(null, gm_file.strip());
			    		}
			    	});
			    }, {imageMagick: true}))
			    .pipe(gulp.dest(target_dir));

		}

	});
});

gulp.task('force-image-opt', function(cb){
	gulp.src(source_dir + '*.*') //all images
		.pipe(gm(function(gm_file, done){

			gm_file.format(function(err, format){
	    		
	    		if(format === 'JPEG'){
	    			done(null, gm_file.strip().quality(90).colorspace('RGB').interlace('Line').samplingFactor(2, 1).noProfile());
	    		} else if(format === 'PNG'){
	    			done(null, gm_file.type('PaletteMatte').strip().noProfile());
	    		} else {
	    			done(null, gm_file.strip());
	    		}
	    	});
	    }, {imageMagick: true}))
	    .pipe(gulp.dest(target_dir));
});

gulp.task('default', ['image-opt']);