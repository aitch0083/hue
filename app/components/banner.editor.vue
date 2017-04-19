<template>
	<el-row v-bind:gutter="5" justify="center">

		<template v-if="state === 1">
			
			<div id="loading_tmp">
				<img src="/images/loading.gif" width="150" height="150"/>
			</div>

		</template>

		<template v-if="state === 2">
			<component v-bind:is="currentView"></component>
		</template>
		
	</el-row>
</template>

<script>
import Vue 	   from 'vue';
import axios   from 'axios';
import _       from 'lodash';
import $shared from './utils/shared';

let clean_form = {
	id:          null,
	title:       '',
	approved:    false,
	start_time:  '',
	keywords:    '',
	content:     '',
	thumbnail:   '',
	video_url:   '',
	img1:        '',
}

let component = {

	data() {
		return _.extend($shared.data.apply(this), {
			upload_params:{

			},
			form: _.extend(clean_form, {
				category_id: [],
				user_id:     null
			}),
			rules: {
				description: [
		            { required: true, message: 'Please input description', trigger: 'blur' },
		            { min: 3, max: 55, message: 'Length should be 3 to 55', trigger: 'blur' }
	          	],
				url: [
					{ required: true, message: 'Please input url', trigger: 'blur' },
					{ validator: (rule, value, callback) => {

						var pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/; // fragment locater
						
						if(!pattern.test(value)) {
							callback(new Error('Please enter a valid URL'));
						} else {
							callback();
						}
					}, trigger: 'blur' }
				],
			},
			types: [
				{ label: 'Small', value: 'small'},
				{ label: 'Medium', value: 'medium'},
				{ label: 'Huge', value: 'huge'}
			],
			bus: new Vue(),
			category_selection_component: null,
			user_selection_component: null,
			uploadingDialog: false
		});
	},

	watch: {
		'$route'(to, from) {
			console.info('from.path:', from.path, ', to.path:', to.path);
			if(from.path !== to.path){ //re-initialise the components if the paths are different
				component.mounted.apply(this);
			}
		}
	},

	mounted(){

		let container_type = 'banner_editor';
		
		$shared.mounted.apply(this, [component, container_type]);
	},

	updated() {
		// $shared.updated.apply(this);
	},

	methods: {
		onMenuClick(menu_path) {
			$shared.methods.onMenuClick.apply(this, [menu_path]);
		},
		submit () {

			console.info('from banner');
			
			if(!this.form.description) {
				this.$message({type: 'error', message:'Please fill in description'});
			} else if(!this.form.url) {
				this.$message({type: 'error', message:'Please fill in URL'});
			} else if(!this.form.img1) {
				this.$message({type: 'error', message:'Please upload one image'});
			}else {

				let token = this.$getState().$get('token');

				axios.put('/api/banners', this.form, {
					params: {
						token
					},
					withCredentials: true
				})
				.then((result) => {

					if(result.status === 200 && result.data.success){

						this.$message({type: 'success', message: 'banner saved'});

					} else {
						this.$message({type: 'error', message: 'Unable to save the banner'});
					}

				})
				.catch((error) => {
					console.info('error@saving banner:', error);
					this.$message({type: 'error', message: 'Unable to save the banner'});
				});
			}
		},
		resetForm() {

			this.$confirm('Are you sure about reseting this form?', {
				type: 'warning'
			}).then(() => {
				this.form = Object.assign({}, this.form, clean_form);
			}).catch(() => {
				this.$message({message:'Ok'});
			});
		},
		handlePictureCardPreview(){

		},
		handleRemove() {

		},
		handlePictureUploadSuccess(response) {
			this.$message({type:'info', 'message':'Image uploaded'});
			this.form.img1 = response.urls.shift();
		},
		handlePictureUploadError() {
			this.$message({type:'error', 'message':'Unable to upload the image for this banner'});
		}
	},

	init_dyn_component () {

		let token      = this.$getState().$get('token');
		let app        = this;
		let id         = this.$route.params.id;
		let model_name = 'Banner';

		$shared.init_dyn_component.apply(this);

		app.bus.$on('open-loading-dialog', (toggle)=>{
			// console.info('app.bus.$on(open-loading-dialog)...:', toggle);
			app.uploadingDialog = toggle;
		});

		let store = app.$data;
		
		//get category component
		$shared.get_selections.apply(this, ['category', 'category_selection_component', 'form.category_id', component, store, null, true]);

		//read banner, if ID provided
		if(id){
			//get banner content
			axios.get('/api/banners/' + id, {
				params: {
					token
				},
				withCredentials: true
			}).then((result) => {

				if(result.status === 200 && result.data.success){
					
					this.form = Object.assign({}, app.form, result.data.record);
					
					// app.bus.$emit('set.form.category_id', app.form.category_id);

				} else {
					app.$message({type:'error', message: 'Cannot find the banner'});
					app.$router.back();
				}

			}).catch((error) => {
				console.error(error);
				app.$message({type:'error', message: 'Cannot fetch the banner'});
			});
		} else { //get a banner place with banner ID
			
			axios.get('/api/banners/new', {
				params: {
					token
				},
				withCredentials: true
			}).then((result) => {

				if(result.status === 200 && result.data.success){

					this.form = Object.assign({}, app.form, result.data.record);

					this.upload_params['model_name'] = 'Banner';
					this.upload_params['record_id']  = result.data.record.id;
					
					// app.bus.$emit('set.form.user_id', app.form.user_id);

				}else{
					app.$message({type:'error', message: 'Cannot create new banner'});
					app.$router.back();
				}

			}).catch((error) => {

				console.error(error);
				app.$message({type:'error', message: 'Cannot create new banner'});

			});
		}

	}
}

export default component;
</script>

<style>
.jsgrid-cell{
	overflow: hidden;
}
.el-form-item {
    margin-bottom: 1.55rem;
}
.el-upload__input{
	display: none !important;
}
</style>