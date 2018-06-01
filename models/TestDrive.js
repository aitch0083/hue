var DBConfig  = require('../configs/database.configs');
var SZ        = require('sequelize');
var _         = require('lodash');
var sequelize = new SZ(DBConfig.name, DBConfig.user, DBConfig.pass, DBConfig);

var TestDrive = sequelize.define('test_drives', {
	
    //For display: 
	id:       { type: SZ.BIGINT(20).UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true, field: 'id'},
	name:     { type: SZ.STRING(30),         allowNull: false, defaultValue: '' },
    title:    { type: SZ.STRING(10),         allowNull: false, defaultValue: '' },
    phone:    { type: SZ.STRING(10),         allowNull: false, defaultValue: '' },
    
    created:  { type: SZ.DATE, 			      allowNull: false, field: 'created'},
	modified: { type: SZ.DATE, 			      allowNull: false, field: 'modified'},
    start:    { type: SZ.DATE,                allowNull: true},
    end:      { type: SZ.DATE,                allowNull: true},

    //no display fields
    article_id: { type: SZ.BIGINT(20).UNSIGNED, allowNull: false },
    user_id:    { type: SZ.BIGINT(20).UNSIGNED, allowNull: false },
    valid:      { type: SZ.BOOLEAN, allowNull: false, defaultValue: 1}
    
}, {
	timestamp: true, 
	createdAt:'created', 
	updatedAt:'modified',
    hooks: {}//eo hooks
});

TestDrive.show_fields = [//follow jsGrid's definition
    { name: 'id',       title: 'ID', width: 20 },
    { name: 'title',    title: 'Title', width: 150, type: 'text' },
    { name: 'user_id',  title: 'Author', width: 50, type: 'text'},
    { name: 'start',    title: 'Start', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center'},
    { name: 'end',      title: 'End', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center'},
    { name: 'created',  title: 'Created', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center' },
    { name: 'modified', title: 'Modified', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center' },
    { type: 'control',  modeSwitchButton: false, clearFilterButton: false, width: 50, editing: true }
];

TestDrive.grid_params = {
    height:      'auto',
    width:       '100%',
    sorting:     true,
    paging:      true,
    editing:     true,
    inserting:   false,
    autoload:    true,
    pageLoading: true,
    filtering:   true,
    pageSize:    50,
    pageButtonCount: 5,
    deleteConfirm: "Are you sure?",
    onItemEditing: (function(args){
        args.cancel = true;//overwrite the editing behavior
        app.$router.replace('/app/testdrives/' + args.item.id);
    }).toString(),
    controller: {
        loadData: (function(filter) {
            return $.ajax({
                type: "GET",
                url: "/api/testdrives",
                data: filter
            });
        }).toString(),
        insertItem: (function(item) {
            return $.ajax({
                type: "POST",
                url: "/api/testdrives",
                data: item
            });
        }).toString(),
        updateItem: (function(item) {
            return $.ajax({
                type: "PUT",
                url: "/api/testdrives",
                data: item
            });
        }).toString(),
        deleteItem: (function(item) {
            return $.ajax({
                type: "DELETE",
                url: "/api/testdrives",
                data: item
            });
        }).toString()
    },
    // fields: fields
};

TestDrive.sync();

module.exports = TestDrive;