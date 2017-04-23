import Vue 	 from 'vue';
import axios from 'axios';
import _     from 'lodash';

let _bus = new Vue();

let _common_logout = function() {

	let token = this.$getState().$get('token');
	let app   = this;

	axios.get('/api/logout', {
		params: {
			token
		},
		withCredentials: true
	})
	.then((result) => {
		if(result.status === 200 && result.data.success){
			app.$router.replace('/');
			app.$message({message:'logout', type:'success'});
		} else {
			app.$alert(result.data.message, 'Error');	
		}
	})
	.catch((error) => {
		_.delay(() => {
			app.$alert('System is unable to logout', 'Error');
			app.$router.replace('/');
		}, 1000);
	});
};

let _common_cleancache = function() {

	let token = this.$getState().$get('token');
	let app   = this;

	axios.get('/api/cleancaches', {
		params: {
			token
		},
		withCredentials: true
	})
	.then((result) => {
		if(result.status === 200 && result.data.success){
			app.$alert(result.data.message, 'Success');	
		} else {
			app.$alert(result.data.message, 'Error');	
		}
	})
	.catch((error) => {
		_.delay(() => {
			app.$alert('System is unable to clean the cache', 'Error');
		}, 1000);
	});
};

let $shared = {

	index(obj,is, value) { //access the object via dot notation, like obj["a.b.c"] = "hi", like: obj["a"]["b"]["c"] = "hi"
	    if (typeof is == 'string')
	        return $shared.index(obj,is.split('.'), value);
	    else if (is.length == 1 && value !== undefined)
	        return obj[is[0]] = value;
	    else if (is.length == 0)
	        return obj;
	    else
	        return $shared.index(obj[is[0]],is.slice(1), value);
	},

	data(){
		return { 
			title: 'loading...',
			currentView: null,
			state: 1
		}
	},

	updated() {
	},

	mounted(component, container_type) {
		let token = this.$getState().$get('token');
		let app   = this;

		// if(token === null){ //not login yet
		if(false){ //debug for now
			this.$router.replace('/');
		} else {
			
			let function_name = this.$route.path.substring(5);
			container_type = container_type || 'grid';

			//load the dashboard
			axios.get('/api/component', {
				params: {
					token,
					function_name,
					container_type
				},
				withCredentials: true
			})
			.then((result) => {
				if(result.status === 200 && result.data.success){

					let TmpComponent = {
						template: result.data.html,
						methods:  component.methods,
						data:     component.data,
						mounted:  component.init_dyn_component
					};
					
					app.currentView = TmpComponent;
					app.state = 2;

				} else {
					app.$alert(result.data.message, 'Error');
				}
			})
			.catch((error) => {

				console.info('error:', error);

				_.delay(() => {
					app.$alert('System is unable to initialize the dashboard', 'Error');
				}, 1000);
			});
		}
	},//eo mounted

	methods: {
		
		onMenuClick(menu_path) {

			let function_name = menu_path;
			let method_name   = 'on' + _.capitalize(menu_path.substring(5)) + 'Click';

			// console.info('method_name:', method_name, ', okay? ', _.isFunction(component[method_name]));

			if(method_name === 'onLogoutClick'){
				_common_logout.apply(this);
			} else if(method_name === 'onCleancacheClick'){
				_common_cleancache.apply(this);
			} else if(_.isFunction(this[method_name])){
				this[method_name].apply();
			} else {
				this.$router.push(menu_path);
			}
		},//eo onMenuClick

		onLogoutClick() {
			_common_logout.apply(this);
		},//eo onLogoutClick

		onCleancacheClick(){
			_common_cleancache.apply(this);
		}

	},//eo methods

	init_dyn_component () {
		
		let function_name = this.$route.path.substring(5);
		let token         = this.$getState().$get('token');
		let app           = this;

		axios.get('/api/get_grid_params', {
			params: {
				token,
				function_name
			},
			withCredentials: true
		})
		.then( (result) => {
			if(result.status === 200 && result.data.success){

				let fields      = result.data.fields;
				let grid_params = result.data.grid_params;
				let api_methods = ['loadData', 'insertItem', 'updateItem', 'deleteItem'];

				if(!_.isEmpty(fields)){
					_.forEach(fields, ( field, index ) => {
						if( !_.isUndefined(field['itemTemplate']) ){
							field.itemTemplate = eval('(' + field.itemTemplate + ')');
						}
					});
				}

				if(!_.isEmpty(grid_params)){
					_.forEach(api_methods, function(method, idx){
						if( !_.isUndefined(grid_params['controller'][method]) ){
							grid_params.controller[method] = eval('(' + grid_params.controller[method] + ')');
						}

						if( !_.isUndefined(grid_params['onItemEditing']) ){
							grid_params['onItemEditing'] = eval('('+grid_params['onItemEditing']+')');
						}
					});
				}

				if(grid_params) {

					grid_params.fields = fields;

					$('#jsGrid').jsGrid(grid_params);
				}

			} else {
				app.$alert(result.data.message, 'Error');	
			}

			$('[data-toggle="tooltip"]').tooltip();
		})
		.catch((error) => {
			console.error('Something wrong:', error);
		});
	},//eo init_dyn_component

	get_selections(model, mount_component, model_name, component_ref, original_store, cb, multiple) {
		
		let token = this.$getState().$get('token');
		let app   = this;
		multiple  = multiple || false;
		
		// bus = bus || _bus;

		if(!model){

			app.$message({type: 'error', message: 'invalid get_selections() invocation'});

			return false;
		}

		cb = _.isFunction(cb) ? cb : null;

		return axios.get('/api/selections/' + model, {
			params: {
				token,
				model_name,
				multiple
			},
			withCredentials: true
		}).then((result) => {

			if(result.status === 200 && result.data.success){
				
				let org_data = original_store;
				let new_data = () => {
					
					//let _r               = org_data;
					org_data['remote_options'] = result.data.remote_options;

					//if there is any default value, then assign the value to field referred by "model_name"
					if(model_name && result.data.preset_value){
						let previous_value = $shared.index(org_data, model_name);

						if(!previous_value){
							$shared.index(org_data, model_name, result.data.preset_value);
						}
					}

					return org_data;
				}

				var default_cb = () => { console.info('['+model_name+'].default_cb()') };

				let TempComponent = {
					template: result.data.template,
					methods:  component_ref.methods,
					data:     new_data,
					mounted:  cb !== null ? cb.bind(this, org_data) : default_cb.bind(this)
				};

				app[mount_component] = TempComponent;
				
				org_data.bus.$on('set.' + model_name, function(value){
					$shared.index(org_data, model_name, value);
				});

			} else {
				app.$message({type: 'error', message: 'Unable to create the ComboBox for ' + model});
			}

		}).catch((error)=>{
			console.info('error:', error);
			app.$message({type: 'error', message: 'Unable to fetch the categoies'});
		});
	},//eo get_selections

	uploadImage(files, $editor, record_id, model_name, cb, with_watermark) {

		let formData = new FormData();
		
		_.each(files, (file, idx) => {
			formData.append('file[]', file);
		});

		formData.append('record_id', record_id);
		formData.append('model_name', model_name);
		formData.append('watermark', with_watermark ? 'yes' : 'no')

		// console.info('with_watermark:',with_watermark);return;

	    axios.post('/api/images', formData)
	    .then((result) => {
	    	// console.info('result@uploading the image:', result);

	    	if(result.status === 200 && result.data.success){
	    		_.each(result.data.urls, (url) => {
	    			$editor.summernote('insertImage', url);
	    		});

	    		cb.apply();

	    		// console.info('editor:', this);
	    		// editor.insertImage(welEditable, url);
	    	} else {
	    		console.error('Unable to parse the image URL.');
	    	}
	    })
	    .catch((error) => {
	    	console.error('Error@uploading the image:', error);
	    });
		
		// success: function(data) {

		//   // getting the url of the file from amazon and insert it into the editor
		//   var url = $(data).find('Location').text();
		//   editor.insertImage(welEditable, url);
		// }

	}//eo uploadImage
};

export default $shared;