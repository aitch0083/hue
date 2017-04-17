'use strict';

var express     = require('express');
var bcrypt      = require('bcrypt-nodejs');
var configs     = require('../configs/global.configs');
var Category    = require('../models/Category');
var _           = require('lodash');

var router = express.Router();

var process_tree = function(rows){
	
	var tree     = [];
	var id       = null;
	var title    = '';
	var desc     = '';
	var position = '';
	var children = [];

	_.forEach(rows, function(node, idx){
		id       = node.ID;
		title    = node.Title;
		desc     = node.Description;
		position = node.Position;

		children = null;

		// console.info('node:', node.getChildren());
		if(node.Children){
			children = [];
			_.forEach(node.Children, function(child){
				children.push({
					id:       child.ID,
					title:    child.Title,
					desc:     child.Description,
					position: child.Position
				});
			})
		}

		tree.push({
			id: id,
			title: title,
			desc: desc,
			position: position,
			children: children
		});
	});

	return tree;
};

module.exports = function(validator){

	router.get('/categories', function(req, res, next) {

		var result = validator(req, res);

		if(result.success){

			var level = req.query.level || 1;

			//fetch filters from query if any
			var conditions = { valid: 1, level: level };
			var order      = 'position asc';

			Category.findAndCountAll({
				where:  conditions,
				order:  order,
				include: [{model:Category, as:'Children', required: false, where: {valid: 1}}]
			}).then(function(result){

				res.json({
					success:    true,
					data:       process_tree(result.rows),
					itemsCount: result.count
				});

			}).catch(function(error){

				console.error(arguments);

				res.json({
					success: false,
					error: error 
				});
			});

		} else {
			res.json(result);
		}
	});

	router.get('/categories/get_subnodes', function(req, res, next){
		var result = validator(req, res);

		if(result.success){

			var parent_ids = req.query.parent_ids;

			if(_.isUndefined(parent_ids)){
				result.success = false;
				result.message = 'Invalid sub node query';
				res.json(result);
			} else {

				var conditions = { 
					valid: 1, 
				    parent_id: { 
				   		'$in' : parent_ids.split(',') 
				   	} 
				};

				var order = 'position asc';

				Category.findAndCountAll({
					where:  conditions,
					order:  order,
					include: [{model:Category, as:'Children', required: false}]
				}).then(function(result){
					res.json({
						success:    true,
						data:       process_tree(result.rows),
						itemsCount: result.count
					});
				}).catch(function(error){

					console.error(arguments);

					res.json({
						success: false,
						error: error 
					});
				});

			}

		} else {
			res.json(result);
		}
	});

	router.post('/categories', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var record    = req.body;
			var title     = _.trim(_.escape(record.title));
			var desc      = _.trim(_.escape(record.desc));
			var id        = record.id;
			var position  = record.position;
			var level     = record.level;
			var parent_id = record.parent_id;

			var to_save = {
				Title:       title,
				Description: desc,
				Level:       level,
				Position:    position,
				parent_id:   parent_id
			};


			if(_.trim(_.escape(title)) === ''){
				res.json({
					result: false,
					message: 'Title cannot be null'
				});
			}

			if(!id){//create
				Category.find({where:{title:title}})
				.then(function(category){
					if(category){
						res.json({
							success: false,
							message: _.template('Category name <%=title%> exists')({title:title})
						});
					} else {
						Category.create(to_save)
						.then(function(category){
							res.json({
								success: true,
								message: 'Category created',
								category: category
							});
						})
						.catch(function(error){
							res.json({
								success: false,
								error: error,
								message: 'Unable to create category'
							});
						});
					}
				});
			} else { //update
				Category.find({where:{id:id}})
				.then(function(category){
					if(!category){
						res.json({
							success: false,
							message: _.template('Category name <%=title%> cannot be updated')({title:title})
						});
					} else {

						to_save.parent_id = category.parent_id;
						to_save.Level     = category.Level;

						category.updateAttributes(to_save)
						.then(function(category){
							res.json({
								success: true,
								message: 'Category updated',
								category: category
							});
						})
						.catch(function(error){
							res.json({
								success: false,
								error: error,
								message: 'Unable to update category'
							});
						});
					}
				});
			}

		} else {
			res.json(result);
		}
	});

	router.delete('/categories', function(req, res, next) {
		var result = validator(req, res);

		if(result.success){

			var record = req.body;
			var ID     = record.ID;

			Category.find({where: {ID:ID}})
			.then(function(category){

				category.updateAttributes({valid:0})
				.then(function(category){
					res.json(category);
				})
				.catch(function(error){

					console.error('error:', error);

					res.json({
						success: false,
						error: error 
					});
				});
			})
			.catch(function(error){

				console.error('error:', error);

				res.json({
					success: false,
					error: error 
				});
			});

		} else {
			res.json(result);
		}
	});

	return router;
}