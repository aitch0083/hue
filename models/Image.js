var DBConfig  = require('../configs/database.configs');
var SZ        = require('sequelize');
var sequelize = new SZ(DBConfig.name, DBConfig.user, DBConfig.pass, DBConfig);

var Image = sequelize.define('images', {
	//For display: 
	id:        { type: SZ.BIGINT(20).UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
	name:      { type: SZ.STRING(125), allowNull: false },
	path:      { type: SZ.STRING(255), allowNull: false },
	ip:        { type: SZ.STRING(45), allowNull: false },
	size:      { type: SZ.STRING(45), allowNull: false },
	width:     { type: SZ.STRING(5), allowNull: false },
	height:    { type: SZ.STRING(5), allowNull: false },
	user_id:   { type: SZ.BIGINT(20).UNSIGNED, allowNull: false, defaultValue: 0},
	model:     { type: SZ.STRING(50), allowNull: false, defaultValue: ''},
	model_id:  { type: SZ.BIGINT(20).UNSIGNED, allowNull: false, defaultValue: 0},
	created:   { type: SZ.DATE, allowNull: false, field: 'created'}
}, {
	timestamp: true, 
	createdAt:'created', 
	updatedAt:'modified',
	indexes: [
		{
			unique: true,
			fields: ['path']
		},
		{
			fields: ['model', 'model_id'],
			name: 'model_key'
		}
	]
});

Image.sync();

module.exports = Image;