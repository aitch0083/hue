'use strict';

var express  = require('express');
var Article  = require('../models/Article');
var User     = require('../models/User');
var Category = require('../models/Category');
var _        = require('lodash');

var router = express.Router();

var process_tree = function(rows){
	
	var tree = [];
	
	var render = function(id, title, level, node){

		var span = '';

		for(var i=level ; i > 1 ; i--){
			span += ' > -- ';
		}

		tree.push({ label: (span + title), value: id });

		if(_.isArray(node.Children) && node.Children.length){
			_.each(node.Children, function(child, idx){
				var _s = render(child.ID, child.Title, child.Level, child);
				if(_s){
					tree.push(_s);
				}
			});
		}

		return false;
	};
	
	_.forEach(rows, function(node, idx){
		var id       = node.ID;
		var title    = node.Title;
		var level    = node.Level;

		render(id, title, level, node);
	});

	return tree;
};

module.exports = function(validator){

	var _template = _.template('<el-select v-model="<%=model_name%>" placeholder="Select <%=model_label%>..."><el-option v-for="item in remote_options" :key="item.value" :label="item.label" :value="item.value"></el-option></el-select>');

	//generate category combo selections
	router.get('/selections/category', function(req, res, next) {

		var result = validator(req, res);

		if(result.success){

			var level      = req.query.level || 1;
			var model_name = req.query.model_name || 'category_id';

			//fetch filters from query if any
			var conditions = { valid: 1, level: level };
			var order      = 'position asc';

			Category.findAndCountAll({
				where:  conditions,
				order:  order,
				include: [{model:Category, as:'Children', required: false, where: {valid: 1}}]
			}).then(function(result){

				res.json({
					success:  true,
					template: _template({
						model_label: 'category',
						model_name: model_name
					}),
					remote_options: process_tree(result.rows),
					// preset_value: 393, for debug
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

	router.get('/selections/user', function(req, res, next) {

		var result  = validator(req, res);
		var user_id = result.user_id;

		if(result.success){

			var model_name = req.query.model_name || 'user_id';

			//fetch filters from query if any
			var conditions = { valid: 1 };
			var order      = 'id asc';

			User.findAndCountAll({
				where: conditions,
				order: order
			}).then(function(result){

				res.json({
					success:  true,
					template: _template({
						model_label: 'user',
						model_name: model_name
					}),
					remote_options: _.map(result.rows, function(user){
						return {
							label: user.Name,
							value: user.ID
						}
					}),
					preset_value: user_id //default value for "model_name"
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

	return router;
}