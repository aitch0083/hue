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
			    			done(null, gm_file.strip().quality(85).interlace('Line').samplingFactor(4, 1).noProfile());
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

			console.info('source:', gm_file.source);

			gm_file.format(function(err, format){
	    		
	    		if(format === 'JPEG'){
	    			done(null, gm_file.strip().quality(85).interlace('Line').samplingFactor(4, 1).noProfile());
	    		} else if(format === 'PNG'){
	    			done(null, gm_file.type('PaletteMatte').strip().noProfile());
	    		} else {
	    			done(null, gm_file.strip());
	    		}
	    	});
	    }, {imageMagick: true}))
	    .pipe(gulp.dest(target_dir));
});

//old files:
gulp.task('force-image-opt-old', function(cb){
	gulp.src([
		'/var/www/html/car/app/webroot/files/lian-car/**/*.jpg',
		'/var/www/html/car/app/webroot/files/lian-car/**/*.jpeg',
		'/var/www/html/car/app/webroot/files/lian-car/**/*.png',
		'/var/www/html/car/app/webroot/files/lian-car/**/*.JPG',
		'/var/www/html/car/app/webroot/files/lian-car/**/*.JPEG',
		'/var/www/html/car/app/webroot/files/lian-car/**/*.PNG'
		]) //all old images
		.pipe(gm(function(gm_file, done){

			console.info('source:', gm_file.source);

			gm_file.format(function(err, format){

				if(err){
					console.error('Error happended when compressing the image:', err);
					return done(null, gm_file);
				}
	    		
	    		if(format === 'JPEG'){
	    			done(null, gm_file.strip().quality(85).interlace('Line').samplingFactor(4, 1).noProfile());
	    		} else if(format === 'PNG'){
	    			done(null, gm_file.type('PaletteMatte').strip().noProfile());
	    		} else {
	    			done(null, gm_file.strip());
	    		}
	    	});
			
	    }, {imageMagick: true}))
	    .pipe(gulp.dest(function(file){
	    	return file.base;
	    }));
});

gulp.task('default', ['image-opt']);