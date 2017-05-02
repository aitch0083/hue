'use strict';

var express      = require('express');
var configs      = require('../configs/global.configs');
var Article      = require('../models/Article');
var User         = require('../models/User');
var Category     = require('../models/Category');
var _            = require('lodash');
var moment       = require('moment');
var path         = require('path');
var fs           = require('fs');
var cheerio      = require('cheerio');
var sanitizeHtml = require('sanitize-html');

var router = express.Router();

Article.belongsTo(User, {foreignKey:'user_id', as:'User'});
Article.belongsTo(Category, {foreignKey:'category_id', as:'Category'});

module.exports = function(validator){

	router.get('/articles/new', function(req, res, next){ //create placeholder for new article
		var result = validator(req, res);

		if(result.success){

			let now = moment();

			Article.create({
				title: 'new article',
				valid: 1,
				start_time: now.format('YYYY-MM-DD HH:mm:ss'),
				approved: 0,
				at_top: 0,
				user_id: result.user_id
			})
			.then(function(article){
				article.category_id = null;
				res.json({
					success: true,
					message: 'Article created',
					record: article
				});
			})
			.catch(function(error){
				res.json({
					success: false,
					error: error,
					message: 'Unable to create article'
				});
			});

		} else {
			res.json(result);
		}
	});

	router.get('/articles/:id', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var id = req.params.id;

			if(!id){
				throw new Error('Invalid article ID');
			} 

			Article.findOne({where: {id: id}, valid: 1}).then(function(result){

				if(!result){
					throw new Error('Invalid article');
				}

				res.json({
					success: true,
					record: result
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

	router.get('/articles', function(req, res, next) {

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

						if(filter === 'category_name'){
							category_conditions['title'] = { '$like': '%' + f_value + '%' }
						} else if(filter === 'author'){
							user_conditions['username'] = { '$like': '%' + f_value + '%' }
						} else {
							conditions[filter] = { '$like': '%' + f_value + '%' };
						}
					}
				}
			}

			if(sortField){
				if(sortField === 'category_name'){
					sortField = '`Category`.`title`';
				}

				if(sortField === 'author'){
					sortField = '`User`.`username`';
				}
				order = sortField + ' ' + sortOrder;
			}

			pageIndex = !isNaN(pageIndex) ? pageIndex - 1 : 0;
			pageSize  = !isNaN(pageSize) ? pageSize : 20;

			Article.findAndCountAll({
				where:   conditions,
				order:   order,
				offset:  (pageIndex * pageSize),
				limit:   pageSize,
				attributes:['title', 'id', 'abstract', 'created', 'modified', 'thumbnail', 'video_url', 'at_top'],
				include: [
					{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] },
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

	router.put('/articles', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var record = req.body;
			var id     = record.id;

			Article.find({where:{id:id}})
			.then(function(article){

				//find the first image in the content
				var $document = cheerio.load(record.content);
				var first_img = $document('img').first();

				if(first_img){
					record.thumbnail = first_img.attr('src');
				}
				
				record.content = sanitizeHtml(record.content, {
					allowedTags: [ 
					  'h1','h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
					  'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'hr', 'br', 'div', 'img',
					  'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe',
					  'font', 'span'
					],
					allowedAttributes: {
					  a:    [ 'href', 'name', 'target', 'title'],
					  img:  [ 'src', 'style', 'class' ],
					  font: [ 'face', 'style'],
					  span: [ 'style'],
					  div:  [ 'style', 'class' ],
					  iframe: ['style', 'src', 'width', 'height', 'frameborder', 'allowfullscreen']
					},
					// Lots of these won't come up by default because we don't allow them 
					selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
					// URL schemes we permit 
					allowedSchemes: [ 'http', 'https', 'mailto' ],
					allowProtocolRelative: true
				});

				article.updateAttributes(record).then(function(article){

					//clear the cache if any
					var cache_file_name = path.join(__dirname, '../public/articles/read', id + '.html');

					if(fs.existsSync(cache_file_name)){
						fs.unlink(cache_file_name);
					}

					res.json({
						success: true,
						record: article
					});
				})

				.catch(function(error){

					console.info('error @ /articles PUT:', error);

					res.json({
						success: false,
						error: error 
					});
				});
			})
			.catch(function(error){

				console.info('error @ /articles PUT:', error);

				res.json({
					success: false,
					error: error 
				});
			});

		}else {
			res.json(result);
		}
	});

	router.delete('/articles', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var record = req.body;
			var id     = record.id;

			Article.find({where:{id:id}})
			.then(function(article){

				article.updateAttributes({valid:0})
				.then(function(article){
					res.json(article);
				})
				.catch(function(error){
					console.info('Error @article delete:', error);
					res.json({
						success: false,
						error: error 
					});
				});
			})
			.catch(function(error){
				console.info('Error @article delete:', error);
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