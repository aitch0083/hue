var DBConfig  = require('../configs/database.configs');
var SZ        = require('sequelize');
var sequelize = new SZ(DBConfig.name, DBConfig.user, DBConfig.pass, DBConfig);


var Category = sequelize.define('categories', {
	//For display: 
	ID:            { type: SZ.BIGINT(20).UNSIGNED,  allowNull: false, autoIncrement: true, primaryKey: true, field: 'id'},
	Title:         { type: SZ.STRING(35),           allowNull: false, field: 'title'},
	Level:         { type: SZ.STRING(40), 		    allowNull: false, field: 'level'},
	Description:   { type: SZ.STRING(40), 		    allowNull: false, field: 'description'},
	Dispaly:       { type: SZ.BOOLEAN,    		    allowNull: false, defaultValue: 1, field: 'display'},
	Admin:         { type: SZ.BOOLEAN,    		    allowNull: false, defaultValue: 0, field: 'for_admin'},
	Count:         { type: SZ.INTEGER(10).UNSIGNED, allowNull: false, defaultValue: 0, field: 'count'},
	TotalCount:    { type: SZ.INTEGER(10).UNSIGNED, allowNull: false, defaultValue: 0, field: 'total_count'},
	Position:      { type: SZ.INTEGER(10).UNSIGNED, allowNull: false, defaultValue: 0, field: 'position'},
	Created:       { type: SZ.DATE, 			    allowNull: false, field: 'created'},
	Modified:      { type: SZ.DATE, 			    allowNull: true,  field: 'modified'},

	//Not for display:
	parent_id: { type: SZ.BIGINT(20).UNSIGNED, allowNull: false, defaultValue: 0},
	valid: { type: SZ.BOOLEAN, allowNull: false, defaultValue: 1},
	
}, {
	timestamp: true, 
	createdAt:'Created', 
	updatedAt:'Modified'
});

Category.belongsToMany(Category, { foreignKey:'parent_id', otherKey:'id', through:Category, as:'Children'});

Category.grid_params = {
	controller: {
        loadData: (function(filter) {
        	return $.ajax({
                type: "GET",
                url: "/api/categories",
                data: filter
            });
        }).toString(),
        insertItem: (function(item) {
            return $.ajax({
                type: "POST",
                url: "/api/categories",
                data: item
            });
        }).toString(),
        updateItem: (function(item) {
            return $.ajax({
                type: "PUT",
                url: "/api/categories",
                data: item
            });
        }).toString(),
        deleteItem: (function(item) {
            return $.ajax({
                type: "DELETE",
                url: "/api/categories",
                data: item
            });
        }).toString()
    },
	// fields: fields
};

Category.sync();

module.exports = Category;