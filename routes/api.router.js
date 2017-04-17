'use strict';
var express = require('express');
var bcrypt  = require('bcrypt-nodejs');
var _       = require('lodash');
	
//shared auth fucntion
var _do_validate = function(req, res){
	
	var username = req.session.username;
	var token    = req.query.token;
	var result   = {
		success: false,
		message: '',
		user_id: null
	};

	return {
		success: true,
		message: 'testing...',
		user_id: 9
	}

	if(!username){
		result.success = false;
		result.message = 'Please login first';
	} else if(username !== token){
		result.success = false;
		result.message = 'Invalid token';
	} else {
		result.success = true;
		result.message = 'This due is cool';
		result.user_id = req.session.user_id;
	}

	return result;
}

//Configurations
var configs = require('../configs/global.configs');

//Models
var User    = require('../models/User');
var Article = require('../models/Article');

//Controllers
var UserCtrl      = require('./users.router')(_do_validate);
var CategoryCtrl  = require('./categories.router')(_do_validate);
var ArticleCtrl   = require('./articles.router')(_do_validate);
var SelectionCtrl = require('./selections.router')(_do_validate);
var ImgCtrl       = require('./images.router')(_do_validate);

//init router
var router = express.Router();

router.use(UserCtrl);
router.use(CategoryCtrl);
router.use(ArticleCtrl);
router.use(SelectionCtrl);
router.use(ImgCtrl);

/**
 * *********
 * POST ZONE
 * *********
 */
router.post('/login', function(req, res, next) {

	var username = req.body.username;
	var password = req.body.password;

	var result = {
		success: false,
		message: ''
	};

	User.findOne({ where: {email: username, password: password}})
		.then(function(user){
			if(user === null){
				result.success = false;
				result.message = (_.template('Username: <%= username %> does not exist!'))({username:username});
			} else {

				var token = bcrypt.hashSync(username);

				req.session.user_id  = user.id;
				req.session.username = token;
				result.success       = true;
				result.message       = (_.template('Username: <%= username %> is found.'))({username:username});
				result.token         = token;

				console.info('req.session.username:', req.session.username);
			}

			res.json(result);
		});
});

/**
 * ********
 * GET ZONE
 * ********
 */
router.get('/component', function(req, res, next) {

	var result = _do_validate(req, res);

	if(!result.success){
		res.json(result);
	} else {

		var function_name  = req.query.function_name;
		var container_type = req.query.container_type;

		console.info('function_name:', function_name);

		res.render('template', {
			app_name:       configs.site_title, 
			container_type: container_type,
			function_name:  function_name
		}, function(err, html){

			if(err){
				next(err);
			}

			result.success = true;
			result.message = 'Component is served: ' + function_name;
			result.html    = html;

			res.json(result);
		});
	}

});

router.get('/logout', function(req, res, next) {
	
	var result = _do_validate(req, res);
	
	if(result.success){
		req.session.destroy();

		result.success = true;
		result.message = 'Logout';
	}

	res.json(result);
	
});

router.get('/get_grid_params', function(req, res, next) {
	var result        = _do_validate(req, res);
	var function_name = req.query.function_name;

	if(_.isUndefined(function_name)){
		result.success = false;
		result.message = 'Function name required';
	}

	if(result.success){
		result.success     = true;
		result.message     = 'Fields for ' + function_name;
		result.fields      = Article.show_fields;
		result.grid_params = Article.grid_params;
	}

	res.json(result);
});

module.exports = router;