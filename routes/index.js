var express = require('express');
var router  = express.Router();
var configs = require('../configs/global.configs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: configs.site_title });
});

module.exports = router;
