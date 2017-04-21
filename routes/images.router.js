'use strict';

var express    = require('express');
var configs    = require('../configs/global.configs');
var Article    = require('../models/Article');
var Image      = require('../models/Image');
var _          = require('lodash');
var formidable = require('formidable');
var moment     = require('moment');
var util       = require('util');
var fs         = require('fs-extra');
var fss        = require('filesize');
var iss        = require('image-size');
var path       = require('path');
var gm         = require('gm').subClass({imageMagick: true});

var router  = express.Router();
var wm_path = path.join(__dirname, '../public/images/watermark.png');//watermark path

module.exports = function(validator){

	//process the uploaded images
	router.post('/images', function(req, res, next) {

		var result = validator(req, res);

		if(result.success){

			var form            = new formidable.IncomingForm();
			form.uploadDir      = path.dirname(__dirname) + '/public/images/uploaded';
			form.keepExtensions = true;

			var preset_filenames = [];
			var model_name = '';
			var record_id  = '';
			var type       = '';
			var watermark  = true;
			var user_id    = result.user_id;
			var ip = req.headers['x-forwarded-for'] || 
				     req.connection.remoteAddress || 
				     req.socket.remoteAddress ||
				     req.connection.socket.remoteAddress;

			form.parse(req, function(err, fields, files){
				model_name = fields.model_name;
				record_id  = fields.record_id;
				type       = fields.type || 'usual';
				watermark  = fields.watermark !== undefined && fields.watermark === 'no' ? false : true;
			});

			form.on('end', function(fields, files) {

				var returned_files = [];
				var images         = [];
				var file_num       = this.openedFiles.length;

				//console.info('file_num:', file_num);

				_.each(this.openedFiles, function(file, idx){

			        var now          = moment();
					var ext          = path.extname(file.name);
					var img_name     = 'IMG' + now.format('YYYYMMDDHHmmss') + 'I' + _.padStart(_.random(10000, 99999), 5, '0') + 'U' + result.user_id + ext;
					var public_path  = configs.image_prefix + 'images/uploaded/' + img_name;
					var af_real_path = form.uploadDir + "/" + img_name;
					var size         = fss(fs.statSync(file.path).size);
					var dim          = iss(file.path);

					returned_files.push(public_path);

					fs.rename(file.path, af_real_path, function(error){
						
						if(error){
							console.info('Error happened while processing the uploaded image: ', file.path, ', Error:', error);
						}

						if(watermark){
							gm(af_real_path).draw(['gravity SouthEast image Over 0,0 87,41 "' + wm_path + '"']).write(af_real_path, function(e){
								if(e){
									console.error(af_real_path, ' cannot be merged with watermark:', e);
								}

								file_num--;

								if(file_num <= 0){
									res.json({
								    	success: true,
								    	urls: returned_files
								    });
								}
							});
						} else {//skip watermark
							file_num--;

							if(file_num <= 0){
								res.json({
							    	success: true,
							    	urls: returned_files
							    });
							}
						}
						
					});

					images.push({
						ip:       ip,
						size:     size,
						width:    dim.width,
						height:   dim.height,
						name:     file.name,
						path:     public_path,
						user_id:  user_id,
						model:    model_name,
						model_id: record_id
					});
					
				});

				// console.info('images:', images);
				if(images.length){
					Image.bulkCreate(images);
				}
            	
        	});

		} else {
			res.json(result);
		}
	});

	router.get('/images/getlist', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){
			var model_id   = req.query.model_id;
			var model_name = req.query.model_name;

			if(!model_id || !model_name){
				throw new Error('Invalid target');
			} 	

			Image.findAll({ 
				where: {
					valid: 1,
					model: model_name,
					model_id: model_id
				}, 
				order:'id asc'
			}).then(function(images){

				res.json({
					success: true,
					message: 'Images found',
					images: images
				});

			}).catch(function(error){
				console.error('Something went wrong@images/getlist', error);
				res.json({
					success: false,
					error: error,
					message: 'Unable to get the images'
				});
			});

		} else {
			res.json(result);
		}
	});

	return router;
}