var DBConfig  = require('../configs/database.configs');
var SZ        = require('sequelize');
var sequelize = new SZ(DBConfig.name, DBConfig.user, DBConfig.pass, DBConfig);


var User = sequelize.define('users', {
	//For display:
	ID:       { type: SZ.BIGINT(20).UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true, field: 'id'},
	Name:     { type: SZ.STRING(35), allowNull: false, field: 'name'},
	Email:    { type: SZ.STRING(40), allowNull: false, field: 'email'},
	Created:  { type: SZ.DATE, allowNull: false, field: 'created'},
	Modified: { type: SZ.DATE, allowNull: true, field: 'modified'},
	Password: { type: SZ.STRING(40), allowNull: true, field: 'password'},
	About:    { type: SZ.STRING(255), allowNull: true, field: 'about_me'},
	Type:     { type: SZ.ENUM('usual','vip','vvip','candidate','candidate_dealer','dealer','category_admin','employee','manager','editor','financial','admin'), defaultValue: 'usual', field:'type'},
	Sex:      { type: SZ.ENUM('male','female','unknown'), allowNull: false, defaultValue: 'unknown', field: 'sex'},

	//Not for display:
	fb_id:         { type: SZ.STRING(50), allowNull: true},
	category_id:   { type: SZ.INTEGER(5).UNSIGNED, allowNull: true},
	product_id:    { type: SZ.BIGINT(20).UNSIGNED, allowNull: true},
	username:      { type: SZ.STRING(35), allowNull: false,},
	password:      { type: SZ.STRING(40), allowNull: true},
	pic_small:     { type: SZ.STRING(120), allowNull: true},
	pic_big:       { type: SZ.STRING(120), allowNull: true},
	pic_square:    { type: SZ.STRING(120), allowNull: true},
	pic:           { type: SZ.STRING(120), allowNull: true},
	birthday:      { type: SZ.DATEONLY, allowNull: true},
	quotes:        { type: SZ.STRING(255), allowNull: true},
	profile_url:   { type: SZ.STRING(255), allowNull: true},
	locale:        { type: SZ.STRING(15), allowNull: true},
	address:       { type: SZ.STRING(100), allowNull: true},
	zip:           { type: SZ.STRING(5), allowNull: true,},
	phones:        { type: SZ.STRING(35), allowNull: true},
	receiver_name: { type: SZ.STRING(35), allowNull: true},
	block:         { type: SZ.BOOLEAN, allowNull: false, defaultValue: 0},
	valid:         { type: SZ.BOOLEAN, allowNull: false, defaultValue: 1},
	block_due:     { type: SZ.DATEONLY, allowNull: true},
	blocker:       { type: SZ.BIGINT(20).UNSIGNED, allowNull: true},
	cover_photo:   { type: SZ.STRING(155), allowNull: true},
	company:       { type: SZ.STRING(30), allowNull: true, defaultValue: ''},
	vat_num:       { type: SZ.STRING(10), allowNull: true, defaultValue: ''},
	
}, {
	timestamp: true, 
	createdAt:'Created', 
	updatedAt:'Modified',
	indexes: [
		{
			unique: true,
			fields: ['email']
		}
	]
});

User.show_fields = [//follow jsGrid's definition
 	{ name: 'ID', 		width: 50 },
 	{ name: 'Name', 	type: 'text', width: 50 },
 	{ name: 'Email', 	type: 'text', width: 150 },
 	{ name: 'Password', type: 'textarea', width: 150 },
 	{ name: 'Type', 	type: 'select', items: [ {id:'usual', name:'usual'}, {id:'admin',name:'admin'}], valueField: "id", textField: "name" },
 	{ name: 'Sex', 		type: 'select', items: [ {id:'male', name:'M'},{id:'female',name:'F'}, {id:'unknown', name:'I don\'t know'}], valueField: "id", textField: "name" },
 	{ name: 'About',    type: 'textarea', width: 150 },
 	{ name: 'Created', 	itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString() },
 	{ name: 'Modified', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString() },
 	{ type: 'control',  modeSwitchButton: false, clearFilterButton: false, width: 50 }
];

User.grid_params = {
	height:      'auto',
	width:       '100%',
	sorting:     true,
	paging:      true,
	editing:     true,
	inserting: 	 true,
	autoload:    true,
	pageLoading: true,
	filtering:   true,
	pageSize:    20,
	pageButtonCount: 5,
	deleteConfirm: "Are you sure?",
	controller: {
        loadData: (function(filter) {
        	return $.ajax({
                type: "GET",
                url: "/api/users",
                data: filter
            });
        }).toString(),
        insertItem: (function(item) {
            return $.ajax({
                type: "POST",
                url: "/api/users",
                data: item
            });
        }).toString(),
        updateItem: (function(item) {
            return $.ajax({
                type: "PUT",
                url: "/api/users",
                data: item
            });
        }).toString(),
        deleteItem: (function(item) {
            return $.ajax({
                type: "DELETE",
                url: "/api/users",
                data: item
            });
        }).toString()
    },
	// fields: fields
};

User.sync({force: false});

module.exports = User;