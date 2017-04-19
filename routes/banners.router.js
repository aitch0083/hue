'use strict';

var express       = require('express');
var SZ            = require('sequelize');
var configs       = require('../configs/global.configs');
var Article       = require('../models/Article');
var User          = require('../models/User');
var Category      = require('../models/Category');
var Banner        = require('../models/Banner');
var BannerDisplay = require('../models/BannerDisplay');
var _             = require('lodash');
var moment        = require('moment');
var path          = require('path');
var fs            = require('fs');
var cheerio       = require('cheerio');

var router  = express.Router();
var Promise = SZ.Promise;

Banner.belongsTo(User, {foreignKey:'creator_id', as:'User'});
// Article.belongsTo(Category, {foreignKey:'category_id', as:'Category'});

module.exports = function(validator){

	router.get('/banners/new', function(req, res, next){ //create placeholder for new banner
		var result = validator(req, res);

		if(result.success){

			let now = moment();

			Banner.create({
				description: '',
				valid:       1,
				online:      0,
				start_time:  now.format('YYYY-MM-DD HH:mm:ss'),
				end_time:    now.format('YYYY-MM-DD HH:mm:ss'),
				creator_id:  result.user_id,
				img1:        '',
				url:         ''
			})
			.then(function(banner){
				
				res.json({
					success: true,
					message: 'Banner created',
					record: banner
				});

			})
			.catch(function(error){
				res.json({
					success: false,
					error: error,
					message: 'Unable to create banner'
				});
			});

		} else {
			res.json(result);
		}
	});

	router.get('/banners/:id', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var id = req.params.id;

			if(!id){
				throw new Error('Invalid banner ID');
			} 

			Promise.join(

				Banner.findOne({where: {id: id}, valid: 1}),
				BannerDisplay.findAll({
					where: {
						banner_id: id
					}
				})

			).spread(function(banner, related_cates){
				
				if(!banner){
					throw new Error('Invalid banner');
				}

				var result = banner;

				var category_id = [];
				if(related_cates && _.isArray(related_cates)){
					_.each(related_cates, function(rec){
						category_id.push(rec.category_id);
					});
				}

				result.setDataValue('category_id', category_id);

				res.json({
					success: true,
					record: result
				});
			})
			.catch(function(error){
				console.error(error);

				res.json({
					success: false,
					error: error 
				});
			});

		} else {
			res.json(result);
		}
	});

	router.get('/banners', function(req, res, next) {

		var result = validator(req, res);

		if(result.success){

			var pageIndex  = parseInt(req.query.pageIndex);
			var pageSize   = parseInt(req.query.pageSize);
			var sortField  = _.trim(_.escape(req.query.sortField));
			var sortOrder  = _.trim(_.escape(req.query.sortOrder));

			var conditions          = { valid: 1 };
			var category_conditions = { valid: 1 };
			var user_conditions     = { valid: 1 };
			var order               = 'id desc';
			var filter              = '';
			
			for(filter in req.query){
				if(_.indexOf(['pageIndex','pageSize', 'sortField', 'sortOrder'], filter) === -1){

					var f_value = _.trim(_.escape(req.query[filter]));

					if(f_value){

						if(filter === 'author'){
							user_conditions['username'] = { '$like': '%' + f_value + '%' }
						} else {
							conditions[filter] = { '$like': '%' + f_value + '%' };
						}
					}
				}
			}

			if(sortField){
				if(sortField === 'author'){
					sortField = '`User`.`username`';
				}
				order = sortField + ' ' + sortOrder;
			}

			pageIndex = !isNaN(pageIndex) ? pageIndex - 1 : 0;
			pageSize  = !isNaN(pageSize) ? pageSize : 20;

			Banner.findAndCountAll({
				where:   conditions,
				order:   order,
				offset:  pageIndex,
				limit:   pageSize,
				attributes:['id', 'description', 'img1', 'url', 'type', 'position', 'start_time', 'end_time', 'created','modified'],
				include: [
					{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id'] }
				]
			}).then(function(result){

				res.json({
					success:    true,
					data:       result.rows,
					itemsCount: result.count
				});

			}).catch(function(error){

				console.error(error);

				res.json({
					success: false,
					error: error 
				});
			});

		} else {
			res.json(result);
		}
	});

	router.put('/banners', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var record = req.body;
			var id     = record.id;

			Banner.find({where:{id:id}})
			.then(function(banner){

				banner.updateAttributes(record).then(function(banner){

					if(_.isArray(record.category_id)){

						var displays = [];

						_.each(record.category_id, function(cate_id){
							displays.push({
								category_id: cate_id,
								banner_id: record.id
							});
						});

						if(displays.length){
							BannerDisplay.destroy({
								where: {
									banner_id: record.id	
								}
							}).then(function(){
								BannerDisplay.bulkCreate(displays);
							});
						}
					}

					res.json({
						success: true,
						record: banner
					});
				})

				.catch(function(error){

					console.info('error @ /banners PUT:', error);

					res.json({
						success: false,
						error: error 
					});
				});

			})
			.catch(function(error){

				console.info('error @ /banners PUT:', error);

				res.json({
					success: false,
					error: error 
				});
			});

		}else {
			res.json(result);
		}
	});

	router.delete('/banners', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var record = req.body;
			var id     = record.id;

			Banner.find({where:{id:id}})
			.then(function(banner){

				banner.updateAttributes({valid:0})
				.then(function(banner){
					res.json(banner);
				})
				.catch(function(error){
					console.info('Error @banner delete:', error);
					res.json({
						success: false,
						error: error 
					});
				});
			})
			.catch(function(error){
				console.info('Error @banner delete:', error);
				res.json({
					success: false,
					error: error 
				});
			});

		}else {
			res.json(result);
		}
	});

	return router;
}