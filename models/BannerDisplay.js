var DBConfig  = require('../configs/database.configs');
var SZ        = require('sequelize');
var sequelize = new SZ(DBConfig.name, DBConfig.user, DBConfig.pass, DBConfig);
var _         = require('lodash');

var BannerDisplay = sequelize.define('banner_displays', {
	
    //For display: 
	id:            { type: SZ.BIGINT(20).UNSIGNED,  allowNull: false, autoIncrement: true, primaryKey: true, field: 'id'},
	banner_id:     { type: SZ.BIGINT(20).UNSIGNED,  allowNull: false },
    category_id:   { type: SZ.INTEGER(5).UNSIGNED,  allowNull: false },
    created:       { type: SZ.DATE, 			    allowNull: false, field: 'created'},
	modified:      { type: SZ.DATE, 			    allowNull: true,  field: 'modified'}
    
}, {
	timestamp: true, 
	createdAt:'created', 
	updatedAt:'modified'
});

BannerDisplay.sync();

module.exports = BannerDisplay;