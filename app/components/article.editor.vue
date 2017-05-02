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

let $root = null;

let clean_form = {
	id:          null,
	description: '',
	online:      false,
	start_time:  '',
	end_time:    '',
	img1:        '',
	url:         '',
	at_top:      false,
	watermark:   true
}

let _newp = (str) => {
    return sanitizeHtml(str, {allowedTags:[], allowedAttributes:[]});
};

let component = {

	data() {
		return _.extend($shared.data.apply(this), {
			form: _.extend(clean_form, {
				category_id: null,
				creator_id:  null
			}),
			rules: {
			},
			bus: new Vue(),
			category_selection_component: null,
			user_selection_component: null,
			uploadingDialog: false,
			uploadPanoVisiable: false,
			upload2020Visiable: false,
			uploadedPhotoVisible: false,
			upload_pano_params: {},
			upload_2020_params: {},
			uploadedPhotos: [],
			image_list_2020: []
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

	methods: {
		onMenuClick(menu_path) {
			$shared.methods.onMenuClick.apply(this, [menu_path]);
		},

		handlePanoUploadSuccess(response){
			let image_src = response.urls.shift();

			$('#editor').summernote('insertImage', image_src, function($image){
				$image.addClass('pano-photos hide-pano-photo');
				$image.css('width', $image.width() / 8);
			});
		},

		handlePanoUploadError(){
			this.$message({type:'error', message:'Unable to upload the Panoramic photo'});
		},

		handle2020UploadSuccess(response){
			let image_srcs = response.urls.shift();

			if(this.image_list_2020.length < 2){
				this.image_list_2020.push(image_srcs);
			}

			if(this.image_list_2020.length >= 2){
				this.image_list_2020 = _.slice(this.image_list_2020, 0, 2);

				var marco_html = '<div class="marco-container">';

				_.each(this.image_list_2020, (image_src) => {
					marco_html += '<img src="'+image_src+'" class="marco-photos half-marco-photo" />';
				});

				marco_html += '</div>';

				$('#editor').summernote('insertNode', $(marco_html).get(0));

				this.image_list_2020 = [];
			}
		},

		handle2020UploadError(){
			this.$message({type:'error', message:'Unable to upload the MarcoMarco photo'});
		},

		showPhotoDialog(){
			this.uploadedPhotoVisible = true;
		},

		uploadedPhotoOpen(){
			let token = this.$getState().$get('token');

			axios.get('/api/images/getlist', {
				params: {
					token,
					model_name: 'Article',
					model_id: this.form.id
				},
				withCredentials: true
			}).then( (result) => {

				if(result.status === 200 && result.data.success){

					this.$message({type: 'success', message: 'Enjoy...'});
					this.uploadedPhotos = result.data.images;

				} else {
					this.$message({type: 'error', message: 'Unable to read the uploaded photos for this article'});
				}

			}).catch( (error) => {
				console.info('Unable to get images for this article:', error);
				this.uploadedPhotoVisible = false;
				this.$message({type: 'error', message: 'Unable to read the uploaded photos for this article'});
			} );
		},

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
		},

	},

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

		let PanoButton = (context) => {
			var ui = $.summernote.ui;

			// create button
			var button = ui.button({
				contents: '<i style="font-size: 12px;line-height: 1.5;" class="material-icons">panorama</i>',
				tooltip: 'Upload Panorama',
				click: function () {
					app.uploadPanoVisiable               = true;
					app.upload_pano_params['record_id']  = app.form.id;
					app.upload_pano_params['model_name'] = 'Article';
					app.upload_pano_params['type']       = 'panorama';
					app.upload_pano_params['watermark']  = app.form.watermark ? 'yes' : 'no';
				}
			});

			return button.render();   // return button as jquery object 
		}

		let TwentyTwentyButton = (context) => {
	  		var ui = $.summernote.ui;
	  		
	  		var button = ui.button({
			    contents: '<i style="font-size: 12px;line-height: 1.5;" class="material-icons">chrome_reader_mode</i>',
			    tooltip: 'Marco Marco',
			    click: function () {
			    	app.upload2020Visiable               = true;
			    	app.upload_2020_params['record_id']  = app.form.id;
			    	app.upload_2020_params['model_name'] = 'Article';
			    	app.upload_2020_params['type']       = '2020';
			    	app.upload_2020_params['watermark']  = app.form.watermark ? 'yes' : 'no';
			    }
		  	});

		  	return button.render();   // return button as jquery object 	
	  	};


		let $editor = $('#editor').summernote({
			height:    500,
			maxHeight: 500,
			toolbar: [
				['style',    ['style']],
		        ['font',     ['bold', 'underline', 'clear']],
		        ['fontname', ['fontname']],
		        ['fontsize', ['fontsize']],
		        ['color',    ['color']],
		        ['para',     ['ul', 'ol', 'paragraph']],
		        ['table',    ['table']],
		        ['insert',   ['link', 'picture', 'video', 'pano', 'twenty']],
		        ['view',     ['fullscreen', 'codeview', 'help']]
			],
			buttons: {
			    pano: PanoButton,
			    twenty: TwentyTwentyButton
			},
			callbacks: {
				onImageUpload (files) {
					app.bus.$emit('open-loading-dialog', true);

					$shared.uploadImage.apply(this, [files, $(this), app.form.id, model_name, ()=>{app.bus.$emit('open-loading-dialog', false);}, app.form.watermark ]);
				},//eo onImageUpload

				onPaste (e){
					var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');

					$editor.summernote('insertText', _newp(bufferText));

					e.preventDefault();

					return false;
				}				
			}
		});

		let store = app.$data;
		
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

					//get user component
					$shared.get_selections.apply(this, ['user', 'user_selection_component', 'form.user_id', component, store, ()=>{
						//get category component
						$shared.get_selections.apply(this, ['category', 'category_selection_component', 'form.category_id', component, store, null, false]);	
					} ]);
					
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

					//get user component
					$shared.get_selections.apply(this, ['user', 'user_selection_component', 'form.user_id', component, store, ()=>{
						//get category component
						$shared.get_selections.apply(this, ['category', 'category_selection_component', 'form.category_id', component, store, null, false]);	
					} ]);

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
.card-thubnail-image{
	max-width: 100%;
}
</style>