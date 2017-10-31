'use strict';
var SZ           = require('sequelize');
var express      = require('express');
var bcrypt       = require('bcrypt-nodejs');
var _            = require('lodash');
var fs           = require('fs');
var path         = require('path');
var moment       = require('moment');
var RSSFeed      = require('feed');
var striptags    = require('striptags');
var xmlescape    = require('xml-escape');
var xmlbuilder   = require('xmlbuilder');
var sanitizeHtml = require('sanitize-html');

//Configurations
var configs  = require('../configs/global.configs');
var Article  = require('../models/Article');
var User     = require('../models/User');
var Category = require('../models/Category');
var Banner   = require('../models/Banner');

Article.belongsTo(User, {foreignKey:'user_id', as:'User'});
Article.belongsTo(Category, {foreignKey:'category_id', as:'Category'});

//init router
var router  = express.Router();
var Promise = SZ.Promise;
var now     = moment().format('YYYY-MM-DD HH:mm:ss');

//GLOBAL conditions
var banner_conditions = { 
	valid: 1, 
	online: 1, 

	start_time: { 
		$or: {
			$eq: null,
			$lte: now
		}
	},

	end_time: {
		$or: {
			$eq: null,
			$gte: now
		}
	}
};
var category_conditions = { valid: 1, level: 1, for_admin: 0 };
var article_conditions  = { valid: 1, approved: 1};
var user_conditions     = { valid: 1 };

var display_time = function(time){
	return moment(time).format('DD MMMM YYYY');
};

var article_read_hanlder = function(req, res, next) {

	var id                  = parseInt(req.params.id);
	var article_conditions  = { id: id, valid: 1, approved: req.query.approved || 1 };
	var category_conditions = { valid: 1 };
	var user_conditions     = { valid: 1 };
	var cache_file_name     = path.join(__dirname, '../public/articles/read', id + '.html');

	// console.info('cache_file_name:', cache_file_name);

	//find the html cache file, if there is none, then create one
	if(fs.existsSync(cache_file_name)){

		res.sendFile(cache_file_name);

	} else {

		Promise.join(

			Article.findOne({ 
				where: article_conditions,
				include: [
					{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] },
					{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
				]
			}),

			Article.findAll({
				where: {valid: 1, approved: 1, '$not': {id: id}},
				limit: configs.latest_artcile_no,
				order: 'id desc',
				include: [
					{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] }
				]
			}),

			Banner.findAll({
				where: banner_conditions,
				limit: 100,
				order: 'id desc'
			})

		).spread(function(article, latest_articles, banners){

			if(!article || article === null){
				var error = new Error('Invalid article');
				console.error('Invalid article caught:', id);
				next(error);
				return;
			}

			var category_id = article.Category.get('id');
			var title = article.get('title');

			//find the artciles under the same category
			Article.findAll({ 
				where: {
					valid: 1, 
					approved: 1, 
					category_id: category_id
				},
				limit: configs.same_cate_article_no,
				order: 'RAND()',
				include: [
					{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] }
				]
			}).then(function(same_cate_artciles){

				if(!article.start_time || article.start_time === '0000-00-00 00:00:00'){
					article.start_time = article.created;
				}

				res.locals.banners            = banners;
				res.locals.same_cate_artciles = same_cate_artciles;
				res.locals.latest_articles    = latest_articles;
				res.locals.article            = article;
				res.locals.title              = title || configs.site_title;
				res.locals.configs            = configs;
				res.locals.meta               = {
					title:       article.title || configs.site_title,
					url:         configs.site_url + '/articles/read/' + article.id,
					image:       article.thumbnail,
					site_name:   configs.site_title,
					description: article.abstraction,
					fb_id:       configs.fb_id
				};
				res.locals.display_time = display_time;
				res.locals._ = _;

				res.render('article_read', function(error, html){
					if(error){	
						next(error);
					}

					fs.writeFile(cache_file_name, html);
					res.send(html);
				});
			});
			
		}).catch(function(error){
			next(error);
		}); //eo Promise

	}
};

var category_read_handler = function(req, res, next){
	var id                  = parseInt(req.params.id);
	var page                = parseInt(req.params.page);
	var article_conditions  = { id: id, valid: 1, approved: 1 };
	var category_conditions = { valid: 1, id: id };
	var user_conditions     = { valid: 1 };

	if(isNaN(page) || page <= 0){
		page = 0;
	} 

	var offset = page * configs.category_artcile_no;
	
	Promise.join(

		Category.findOne({
			where: category_conditions
		}),

		Article.findAndCountAll({
			where: {valid: 1, approved: 1, category_id: id},
			limit: configs.category_artcile_no,
			offset: offset,
			order: 'id desc',
			include: [
				{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] },
				{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
			]
		}),

		Article.findAll({
			where: {valid: 1, approved: 1, '$not': {category_id: id}},
			limit: configs.latest_artcile_no,
			order: 'id desc',
			include: [
				{ model:Category, as:'Category', required: true, where: { valid: 1 }, attributes:['title', 'id'] },
				{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
			]
		}),

		Banner.findAll({
			where: banner_conditions,
			limit: 100,
			order: 'id desc'
		})

	).spread(function(category, cate_articles, latest_articles, banners){

		if(!category || category === null){
			var error = new Error('Invalid Category');
			console.error('Invalid category caught:', id);
			next(error);
			return;
		}

		res.locals.banners         = banners;
		res.locals.category        = category;
		res.locals.cate_articles   = cate_articles.rows;
		res.locals.cate_article_no = cate_articles.count;
		res.locals.latest_articles = latest_articles;
		res.locals.title           = configs.site_title;
		res.locals.configs         = configs;

		var total_page = Math.ceil(cate_articles.count / configs.category_artcile_no);

		res.locals.meta = {
			title:       category.title,
			url:         configs.site_url + '/categories/index/' + category.id,
			site_name:   configs.site_title,
			description: category.title,
			fb_id:       configs.fb_id
		};

		res.locals.display_time = display_time;
		res.locals._ = _;

		var main_content_only = page >= 1 ? true : false;
		var show_page_anchor  = page < total_page ? true : false;

		res.render( main_content_only ? 'cate_ajax_content' : 'category_index', {show_page_anchor:show_page_anchor, page: page + 1});
	});

};

/**
 * ********
 * GET ZONE
 * ********
 */
router.get('/', function(req, res, next){

	var cache_file_name = path.join(__dirname, '../public', 'index.html');

	if(fs.existsSync(cache_file_name)){

		res.sendFile(cache_file_name);

	} else {

		res.locals.title   = configs.site_title;
		res.locals.configs = configs;
		
		res.locals.meta = {
			title:       configs.site_title,
			url:         configs.site_url,
			site_name:   configs.site_title,
			description: configs.site_description,
			fb_id:       configs.fb_id,
			image:       configs.logo
		};

		res.locals._      = _;
		res.locals.page   = 0;
		res.locals.layout = 'masonry';

		res.render('masonry', function(error, html){
			if(error){	
				next(error);
			}

			fs.writeFile(cache_file_name, html);
			res.send(html);
		});
	}
});

router.get('/menu', function(req, res, next){

	var cache_file_name = path.join(__dirname, '../public/categories', 'menuitems.html');

	//find the html cache file, if there is none, then create one
	if(fs.existsSync(cache_file_name)){
		res.sendFile(cache_file_name);
	} else {

		//read categories
		Promise.join(
			Category.findAll({where: category_conditions})
		).spread(function(categories){

			res.locals.categories = categories;
			res.locals._          = _;

			res.render('topmenu_items', function(error, html){
				if(error){	
					next(error);
				}

				fs.writeFile(cache_file_name, html);
				res.send(html);
			});
			
		});

	}
});

router.get('/articles/index/:page', function(req, res, next){

	var article_conditions  = { valid: 1, approved: 1 };
	var category_conditions = { valid: 1 };
	var user_conditions     = { valid: 1 };
	var page                = parseInt(req.params.page);
	var layout              = req.query.layout || '';

	layout = layout === '' ? '' : '_' + layout;

	if(isNaN(page) || page <= 0){
		page = 0;
	} 

	var offset = page * configs.home_latest_artcile_no;

	Promise.join(

		Article.findAndCountAll({
			where: {valid: 1, approved: 1, at_top: 0},
			limit: configs.home_latest_artcile_no,
			offset: offset,
			order: 'id desc',
			include: [
				{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] },
				{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
			]
		}),

		Banner.findAll({
			where:  banner_conditions,
			limit:  100,
			//offset: offset,
			order:  'id desc'
		}),

		Article.findOne({
			where: {valid: 1, approved: 1, at_top: 1},
			order: 'id desc',
			include: [
				{ model:Category, as:'Category', required: true, where: category_conditions, attributes:['title', 'id'] },
				{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
			]
		})

	).spread(function(latest_articles, banners, hotlines){

		res.locals.title             = configs.site_title;
		res.locals.configs           = configs;
		res.locals.latest_articles   = latest_articles.rows;
		res.locals.latest_article_no = latest_articles.count;
		res.locals.banners           = banners;
		res.locals.hotlines          = hotlines;

		//console.info('hotlines:', hotlines.length);

		res.locals.meta = {
			title:       configs.site_title,
			url:         configs.site_url,
			site_name:   configs.site_title,
			description: configs.site_description,
			fb_id:       configs.fb_id
		};

		res.locals._ = _;

		res.locals.max_page = Math.ceil(latest_articles.count / configs.home_latest_artcile_no);

		res.render('artc_ajax_content' + layout, {page: page + 1});

	});

});

router.get('/articles/rssFeed/:cate_id/:page_size', function(req, res, next){
	var cate_id   = parseInt(req.params.cate_id);
	var page_size = parseInt(req.params.page_size);

	if(isNaN(cate_id) || isNaN(page_size)){
		var error = new Error('Invalid RSS invocation');
		error.status = 404;

		next(error);
	}

	if(cate_id > 0){
		article_conditions['category_id'] = cate_id;
	} 

	var cache_file_name = path.join(__dirname, '../public/articles', 'rss_feed_'+cate_id+'s'+page_size+'.xml');

	//find the XML cache file, if there is none, then create one
	if(fs.existsSync(cache_file_name)){
		res.sendFile(cache_file_name);
	} else {

		Article.findAll({
			where: article_conditions,
			limit: page_size,
			order: 'id desc',
			include: [
				{ model:Category, as:'Category', required: true, where: { valid: 1 }, attributes:['title', 'id'] },
				{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
			]
		}).then(function(articles){
			
			var feed = new RSSFeed({
			  title:       configs.site_title + ' RSS Feed',
			  description: configs.site_description,
			  id:          configs.site_public_url,
			  link:        configs.site_public_url,
			  image:       configs.site_public_url + '/images/biglogo.png',
			  copyright:   'All rights reserved ' + moment().format('YYYY'),
			  updated:     new Date(),
			  author:      configs.site_author
			});

			_.each(articles, function(article){

				var URI = configs.site_public_url + '/articles/read/' + article.id + '.html';
				var clean_desc = sanitizeHtml(article.content, {
					allowedTags: [ 
					  'h1','h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'ul', 'ol',
					  'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'hr', 'div', 'img',
					  'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe',
					  'font', 'span'
					],
					allowedAttributes: {
					  a:    [ 'href', 'name', 'target', 'title'],
					  img:  [ 'src', 'style', 'class' ],
					  font: [ 'face', 'style'],
					  span: [ 'style'],
					  div:  [ 'style', 'class' ],
					  iframe: ['style', 'src', 'width', 'height', 'frameborder', 'allowfullscreen', 'class']
					},
					// Lots of these won't come up by default because we don't allow them 
					selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
					// URL schemes we permit 
					allowedSchemes: [ 'http', 'https', 'mailto' ],
					allowProtocolRelative: true
				});

				feed.addItem({
					title:       article.plain_title,
					id:          URI,
					link:        URI,
					description: clean_desc,
					content:     clean_desc,
					date:        moment(article.created, 'YYYY-MM-DD HH:mm:ss').toDate(),
					image:       configs.site_public_url + '/' + article.thumbnail
				});

			});

			var rss = feed.rss2();

			fs.writeFile(cache_file_name, rss);

			res.set('Content-Type', 'text/xml');
			res.send(rss);
		});

	}
});

//RSS feed for Line
router.get('/articles/lineRssFeed/:cate_id/:page_size', function(req, res, next){
	
	var cate_id   = parseInt(req.params.cate_id);
	var page_size = parseInt(req.params.page_size);

	if(isNaN(cate_id) || isNaN(page_size)){
		var error = new Error('Invalid RSS invocation');
		error.status = 404;

		next(error);
	}

	if(cate_id > 0){
		article_conditions['category_id'] = cate_id;
	} 

	var cache_file_name = path.join(__dirname, '../public/articles', 'line_rss_feed_'+cate_id+'s'+page_size+'.xml');

	//find the XML cache file, if there is none, then create one
	if(fs.existsSync(cache_file_name)){
		res.sendFile(cache_file_name);
	} else {

		Article.findAll({
			where: article_conditions,
			limit: page_size,
			order: 'id desc',
			include: [
				{ model:Category, as:'Category', required: true, where: { valid: 1 }, attributes:['title', 'id'] },
				{ model:User, as:'User', required: true, where: user_conditions, attributes:['username', 'id', 'name'] }
			]
		}).then(function(articles){

			res.set('Content-Type', 'text/xml');
			
			var this_moment = moment();
			var UUID        = 'WWWLIANCARCOM' + this_moment.format('YYYY');
			var xml         = xmlbuilder.create('articles');
			
			xml.ele('UUID', null, UUID)
			   .ele('tmie', null, this_moment.valueOf());

			_.each(articles, function(article){

				var URI        = configs.site_public_url + '/articles/read/' + article.id + '.html';
				var ID         = 'WWWLIANCARCOMARTICLE'+article.id;
				var start_time = article.start_time && article.start_time !== '0000-00-00 00:00:00' ? moment(article.start_time, 'YYYY-MM-DD HH:mm:ss') : moment(article.created, 'YYYY-MM-DD HH:mm:ss');
				var end_time   = start_time.add('1', 'year');

				if(!article.video_url){
					var format_content = '<div width="width:100%; max-width: 100%;"><img src="'+article.thumbnail+'" style="width:100%; max-width: 100%;"/></div><div>' + article.abstract + '</div>';
				} else {
					var format_content = '<div width="width:100%; max-width: 100%;"><iframe frameborder="0" src="'+article.video_url+'" height="360" class="note-video-clip" style="width:100%; max-width: 100%;"></iframe></div>' + article.abstract + '</div>';
				}

				format_content += '<div width="width:100%; max-width: 100%;"><p><a href="' + URI + '" class="btn_txt" target="_blank">繼續閱讀</a></p><p><a href="' + configs.site_public_url + '" class="btn_txt" target="_blank">”閱讀更多汽車新聞</a></p></div>';

				// var clean_desc = sanitizeHtml(article.content, {
				// 	allowedTags: [ 
				// 	  'h1','h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'ul', 'ol',
				// 	  'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'hr', 'div', 'img',
				// 	  'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe',
				// 	  'font', 'span'
				// 	],
				// 	allowedAttributes: {
				// 	  a:    [ 'href', 'name', 'target', 'title'],
				// 	  img:  [ 'src', 'style', 'class' ],
				// 	  font: [ 'face', 'style'],
				// 	  span: [ 'style'],
				// 	  div:  [ 'style', 'class' ],
				// 	  iframe: ['style', 'src', 'width', 'height', 'frameborder', 'allowfullscreen', 'class']
				// 	},
				// 	// Lots of these won't come up by default because we don't allow them 
				// 	selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
				// 	// URL schemes we permit 
				// 	allowedSchemes: [ 'http', 'https', 'mailto' ],
				// 	allowProtocolRelative: true
				// });
				
				xml.ele('article')
				   .ele('ID', null, ID).up()
				   .ele('nativeCountry', null, 'TW').up()
				   .ele('language', null, 'zh').up()
				   .ele('startYmdtUnix', null, start_time.valueOf()).up()
				   .ele('endYmdtUnix', null, end_time.valueOf()).up()
				   .ele('title', null, article.plain_title).up()
				   .ele('category', null, article.Category.get('title')).up()
				   .ele('publishTimeUnix', null, start_time.valueOf()).up()
				   .ele('contentType', null, 0).up()
				   .ele('thumbnail', null, article.thumbnail).up()
				   .ele('contents')
				   	.ele('image')
				   		.ele('title',     article.plain_title).up()
				   		.ele('url',       article.thumbnail).up()
				   		.ele('thumbnail', article.thumbnail).up()
				   		.up()
				   	.ele('text')
				   		.ele('content').dat(format_content).up()
				   	.up();

			});//eo _.each

			var xml_string = xml.end({allowEmpty: true, pretty:false});

			fs.writeFile(cache_file_name, xml_string);

			// console.info('Line XML: ', xml_string);
			
			res.send(xml_string);
		});

	}
});

router.get('/articles', function(req, res, next) {
	var error = new Error('No aritcle ID');
	error.status = 404;

	next(error);
});

router.get('/categories', function(req, res, next) {
	var error = new Error('No category ID');
	error.status = 404;

	next(error);
});

router.get('/layout/:name', function(req, res, next){

	var supported_layouts = ['masonry'];
	var name              = req.params.name;

	if(_.indexOf(supported_layouts, name) === -1){
		var error = new Error('Invalid layout name: ' + name);
		error.status = 404;
		next(error);
	}

	res.locals.title   = configs.site_title;
	res.locals.configs = configs;
	
	res.locals.meta = {
		title:       configs.site_title,
		url:         configs.site_url,
		site_name:   configs.site_title,
		description: configs.site_description,
		fb_id:       configs.fb_id
	};

	res.locals._      = _;
	res.locals.page   = 0;
	res.locals.layout = name;

	res.render(name);
});

router.get('/articles/:id', article_read_hanlder);
router.get('/articles/read/:id', article_read_hanlder);
router.get('/categories/:id', category_read_handler);
router.get('/categories/index/:id', category_read_handler);
router.get('/categories/main/:id', category_read_handler);
router.get('/categories/index/:id/:page', category_read_handler);
router.get('/categories/main/:id/:page', category_read_handler);


module.exports = router;