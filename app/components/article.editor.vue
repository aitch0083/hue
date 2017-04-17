<template>
	<el-row v-bind:gutter="5" justify="center">

		<template v-if="state === 1">
			
			<div id="loading_tmp">
				<h1 class="md-title">{{title}}</h1>
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
}

let component = {

	data() {
		return _.extend($shared.data.apply(this), {
			form: _.extend(clean_form, {
				category_id: null,
				user_id:     null
			}),
			rules: {
			},
			bus: new Vue(),
			category_selection_component: null,
			user_selection_component: null,
			uploadingDialog: false
		});
	},

	watch: {
		'$route'(to, from) {
			if(from.path !== to.path){ //re-initialise the components if the paths are different
				component.mounted.apply(this);
			}
		}
	},

	mounted(){

		let container_type = 'editor';
		
		$shared.mounted.apply(this, [component, container_type]);
	},

	updated() {
		// $shared.updated.apply(this);
	},

	methods: _.extend($shared.methods, {
		submit () {
			this.form.abstract = _.trim($('#editor').summernote('code').replace(/<\/?[^>]+(>|$)|\&nbsp;|\r?\n/g, ""));

			if(!this.form.category_id) {
				this.$message({type: 'error', message:'Please select category'});
			} else if(!this.form.user_id) {
				this.$message({type: 'error', message:'Please select user'});
			} else if(!this.form.title) {
				this.$message({type: 'error', message:'Please fill title'});
			} else if(!this.form.abstract) {
				this.$message({type: 'error', message:'Please write something'});
			} else {

				let token = this.$getState().$get('token');

				this.form.content = $('#editor').summernote('code');

				axios.put('/api/articles', this.form, {
					params: {
						token
					},
					withCredentials: true
				})
				.then((result) => {

					if(result.status === 200 && result.data.success){

						this.$message({type: 'success', message: 'article saved'});

					} else {
						this.$message({type: 'error', message: 'Unable to save the article'});
					}

				})
				.catch((error) => {
					console.info('error@saving article:', error);
					this.$message({type: 'error', message: 'Unable to save the article'});
				});
			}
		},
		resetForm() {

			this.$confirm('Are you sure about reseting this form?', {
				type: 'warning'
			}).then(() => {
				this.form = Object.assign({}, this.form, clean_form);
				$('#editor').summernote('reset');
			}).catch(() => {
				this.$message({message:'Ok'});
			});
		}
	}),

	init_dyn_component () {

		let token      = this.$getState().$get('token');
		let app        = this;
		let id         = this.$route.params.id;
		let model_name = 'Article';

		$shared.init_dyn_component.apply(this);

		app.bus.$on('open-loading-dialog', (toggle)=>{
			// console.info('app.bus.$on(open-loading-dialog)...:', toggle);
			app.uploadingDialog = toggle;
		});

		let $editor = $('#editor').summernote({
			height:    500,
			maxHeight: 500,
			callbacks: {
				onImageUpload (files) {
					app.bus.$emit('open-loading-dialog', true);
					$shared.uploadImage.apply(this, [files, $(this), app.form.id, model_name, ()=>{app.bus.$emit('open-loading-dialog', false);}]);
				}//eo onImageUpload
			}
		});

		let store = app.$data;
		
		//get user component
		$shared.get_selections.apply(this, ['user', 'user_selection_component', 'form.user_id', component, store, null]);

		//get category component
		$shared.get_selections.apply(this, ['category', 'category_selection_component', 'form.category_id', component, store, null]);

		//read article, if ID provided
		if(id){
			//get article content
			axios.get('/api/articles/' + id, {
				params: {
					token
				},
				withCredentials: true
			}).then((result) => {

				if(result.status === 200 && result.data.success){
					
					this.form = Object.assign({}, app.form, result.data.record);
					
					$editor.summernote('code', app.form.content);
					
					app.bus.$emit('set.form.user_id', app.form.user_id);
					app.bus.$emit('set.form.category_id', app.form.category_id);

				} else {
					app.$message({type:'error', message: 'Cannot find the article'});
					app.$router.back();
				}

			}).catch((error) => {
				console.error(error);
				app.$message({type:'error', message: 'Cannot fetch the article'});
			});
		} else { //get a article place with article ID
			
			axios.get('/api/articles/new', {
				params: {
					token
				},
				withCredentials: true
			}).then((result) => {

				if(result.status === 200 && result.data.success){

					this.form = Object.assign({}, app.form, result.data.record);
					
					app.bus.$emit('set.form.user_id', app.form.user_id);

				}else{
					app.$message({type:'error', message: 'Cannot create new article'});
					app.$router.back();
				}

			}).catch((error) => {

				console.error(error);
				app.$message({type:'error', message: 'Cannot create new article'});

			});
		}

		$('[data-toggle="tooltip"]').tooltip();

	}
}

export default component;
</script>

<style>
.jsgrid-cell{
	overflow: hidden;
}
.el-form-item{
	margin-bottom: 0px;
}
</style>