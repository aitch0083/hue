var DBConfig  = require('../configs/database.configs');
var SZ        = require('sequelize');
var sequelize = new SZ(DBConfig.name, DBConfig.user, DBConfig.pass, DBConfig);
var _         = require('lodash');

var Banner = sequelize.define('banners', {
	
    //For display: 
	id:            { type: SZ.BIGINT(20).UNSIGNED,  allowNull: false, autoIncrement: true, primaryKey: true, field: 'id'},
	description:   { type: SZ.STRING(100),          allowNull: false, defaultValue: '' },
    position:      { type: SZ.ENUM('1', '2', '3'),  allowNull: false , defaultValue: '1' },
    created:       { type: SZ.DATE, 			    allowNull: false, field: 'created'},
	modified:      { type: SZ.DATE, 			    allowNull: true,  field: 'modified'},

    //no display fields
    valid:      { type: SZ.BOOLEAN, allowNull: false, defaultValue: 1},
    img1:       { type: SZ.STRING(155), allowNull:false },
    url:        { type: SZ.STRING(155), allowNull: false },
    plain_url:  { type: SZ.VIRTUAL },
    target:     { type: SZ.ENUM('_self','_blank'), allowNull: false , defaultValue: '_blank' },
    online:     { type: SZ.BOOLEAN, allowNull: false },
    start_time: { type: SZ.DATE, allowNull: false , defaultValue: '0000-00-00 00:00:00' },
    end_time:   { type: SZ.DATE, allowNull: false , defaultValue: '0000-00-00 00:00:00' },
    type:       { type: SZ.ENUM('huge','medium','small'), allowNull: false , defaultValue: 'medium' },
    
    is_youtube: { type: SZ.BOOLEAN , defaultValue: 0 },
    creator_id: { type: SZ.BIGINT(20).UNSIGNED, allowNull: false }

    // desprecated fields
    // img2:        { type: SZ.STRING(155) },
    // img3:        { type: SZ.STRING(155) },
    // img4:        { type: SZ.STRING(155) },
    // img5:        { type: SZ.STRING(155) },
    // img6:        { type: SZ.STRING(155) },
    // mimg:        { type: SZ.STRING(155) },
    // display_old: { type: SZ.BOOLEAN, allowNull: false , defaultValue: 0 },
    
}, {
	timestamp: true, 
	createdAt:'created', 
	updatedAt:'modified',
    hooks: {

        afterFind: function(result, options){//combine the virtual fields
            if(_.isArray(result)){
                _.each(result, function(ele, idx){
                    // You can do this evil thing: ele.dataValues.User.dataValues.author = "aitch", but don't
                    // You can also read like this: ele.dataValues.User.dataValues.author, but don't
                        
                    var user         = ele.getDataValue('User');
                    var id           = ele.getDataValue('id');
                    var url          = ele.getDataValue('url');
                    // var thumbnail = ele.getDataValue('thumbnail');
                    // var video_url = ele.getDataValue('video_url');

                    var seasoned_url = _.template('<a href="<%=href%>" target="_blank"><%=title%></a>')({
                        title: url,
                        href: url
                    });

                    ele.setDataValue('plain_url', url);
                    ele.setDataValue('url', seasoned_url);

                    if(user){
                        ele.setDataValue('author', user.get('username'));
                    } else {
                        ele.setDataValue('author', 'N/A');
                    }
                });
            }
        }//eo afterFind
    }//eo hooks
});

Banner.show_fields = [//follow jsGrid's definition
    { name: 'id',             title: 'ID', width: 20 },
    { name: 'description',    title: 'Description', width: 150, type: 'text' },
    { name: 'url',            title: 'URL', width: 250, type: 'text' },
    { name: 'type',           title: 'Type', width: 50 },
    { name: 'position',       title: 'Postiion', width: 50 },
    { name: 'author',         title: 'Author', width: 50, type: 'text'},
    { name: 'start_time',     title: 'Start Time', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center'},
    { name: 'end_time',       title: 'End Time', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center'},
    { name: 'created',        title: 'Created', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center' },
    { name: 'modified',       title: 'Modified', itemTemplate: (function(v) { return v ? v.substring(0, 10) : ''; }).toString(), width: 50, align:'center' },
    { type: 'control',        modeSwitchButton: false, clearFilterButton: false, width: 50, editing: true }
];

Banner.grid_params = {
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
        app.$router.replace('/app/banneredit/' + args.item.id);
    }).toString(),
    controller: {
        loadData: (function(filter) {
            return $.ajax({
                type: "GET",
                url: "/api/banners",
                data: filter
            });
        }).toString(),
        insertItem: (function(item) {
            return $.ajax({
                type: "POST",
                url: "/api/banners",
                data: item
            });
        }).toString(),
        updateItem: (function(item) {
            return $.ajax({
                type: "PUT",
                url: "/api/banners",
                data: item
            });
        }).toString(),
        deleteItem: (function(item) {
            return $.ajax({
                type: "DELETE",
                url: "/api/banners",
                data: item
            });
        }).toString()
    },
    // fields: fields
};

Banner.sync();

module.exports = Banner;