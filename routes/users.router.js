'use strict';

var express = require('express');
var bcrypt  = require('bcrypt-nodejs');
var configs = require('../configs/global.configs');
var User    = require('../models/User');
var _       = require('lodash');

var router = express.Router();

module.exports = function(validator){

	router.get('/users', function(req, res, next) {

		var result = validator(req, res);

		if(result.success){

			var pageIndex = parseInt(req.query.pageIndex);
			var pageSize  = parseInt(req.query.pageSize);
			var sortField = _.trim(_.escape(req.query.sortField));
			var sortOrder = _.trim(_.escape(req.query.sortOrder));

			pageIndex = pageIndex >= 1 ? pageIndex - 1 : pageIndex;

			//fetch filters from query if any
			var conditions = { valid: 1 };
			var order      = [];
			var filter     = '';
			for(filter in req.query){
				if(_.indexOf(['pageIndex', 'pageSize', 'sortField', 'sortOrder','Type', 'Sex'], filter) === -1){
					var f_value = _.trim(_.escape(req.query[filter]));

					if(f_value){
						conditions[filter] = { '$like': '%' + f_value + '%' };
					}
				}
			}

			if(sortField){
				order = sortField + ' ' + sortOrder;
			}

			User.findAndCountAll({
				where:  conditions,
				offset: pageIndex,
				limit:  pageSize,
				order:  order
			}).then(function(result){
				res.json({
					data: result.rows,
					itemsCount: result.count
				});
			}).catch(function(error){
				res.json({
					success: false,
					error: error 
				});
			});

		} else {
			res.json(result);
		}
	});

	router.post('/users', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var user_record = req.body;
			var email       = user_record.Email;

			if(_.trim(_.escape(email)) === ''){
				res.json({
					result: false,
					message: 'Email cannot be null'
				});
			}

			User.find({where:{email:email}})
			.then(function(user){
				if(user){
					res.json({
						success: false,
						message: _.template('Email <%=email%> exists')({email:email})
					});
				} else {

					user_record['username'] = email;

					User.create(user_record).then(function(user){
						res.json(user);
					}).catch(function(error){
						res.json({
							success: false,
							error: error 
						});
					});
				}
			})
			.catch(function(error){
				res.json({
					success: false,
					error: error 
				});
			});

		}else {
			res.json(result);
		}
	});

	router.put('/users', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var user_record = req.body;
			var ID          = user_record.ID;

			User.find({where:{ID:ID}})
			.then(function(user){

				user.updateAttributes(user_record).then(function(user){
					res.json(user_record);
				})
				.catch(function(error){
					res.json({
						success: false,
						error: error 
					});
				});
			})
			.catch(function(error){
				res.json({
					success: false,
					error: error 
				});
			});

		}else {
			res.json(result);
		}
	});

	router.delete('/users', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var user_record = req.body;
			var ID          = user_record.ID;

			User.find({where:{ID:ID}})
			.then(function(user){

				user.updateAttributes({valid:0})
				.then(function(user){
					res.json(user_record);
				})
				.catch(function(error){
					res.json({
						success: false,
						error: error 
					});
				});
			})
			.catch(function(error){
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