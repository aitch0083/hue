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

		<el-dialog title="Edit Category" ref="category-dialog" v-model="categoryEditFormShow">
			<el-form v-bind:model="form" v-bind:rules="rules" ref="category-form" label-width="100px">

				<el-form-item label="Title" prop="title">
				    <el-input v-model="form.title"></el-input>
			  	</el-form-item>

			  	<el-form-item label="Description" prop="desc">
				    <el-input v-model="form.desc"></el-input>
			  	</el-form-item>

			  	<el-form-item label="Order">
				    <el-input-number v-model="form.position" v-bind:step="10" v-bind:min="0" v-bind:max="250"></el-input-number>
			  	</el-form-item>

				<el-form-item>
				    <el-button type="primary" v-on:click="submit">Save</el-button>
				    <el-button v-on:click="resetForm">Reset</el-button>
				</el-form-item>

			</el-form>
		</el-dialog>

	</el-row>
</template>

<script>
import Vue 	   from 'vue';
import axios   from 'axios';
import _       from 'lodash';
import $shared from './utils/shared';

let max_depth = 2;
let $app_root = null;

let component = {
	
	data(){
		return { 
			title: 'loading...',
			alert: {
				title: 'Error',
				contentHtml: 'Something went wrong'
			},
			function_name: '',
			currentView: null,
			state: 1,
			tree_data: [],
			tree_props: {
	          children: 'children',
	          label: 'title'
        	},
        	categoryEditFormShow: false,
        	form: {
        		title:     '',
        		desc:      '',
        		position:  0,
        		parent_id: null,
        		level:     1
        	},
        	rules: {
	          title: [
	            { required: true, message: 'Please input title', trigger: 'blur' },
	            { min: 3, max: 15, message: 'Length should be 3 to 15', trigger: 'blur' }
	          ],
	          desc: [
	            { required: true, message: 'Please input description', trigger: 'blur' },
	            { min: 3, max: 15, message: 'Length should be 3 to 15', trigger: 'blur' }
	          ]
	        },
	        dialogMode: '',
	        treeStore: null,
	        treeDataHolder: null
		}
	},

	mounted(){

		let container_type = 'tree';

		$shared.mounted.apply(this, [component, container_type]);
	},

	updated() {
		$app_root = this;
	},

	methods: {

		onMenuClick(menu_path) {
			
			$shared.methods.onMenuClick.apply(this, [menu_path]);
		},

		renderTreeContent(h, { node, data, store }) {

			let app = this;//this is not $app_root

			let controls = [
				<el-button size="mini" onClick={$app_root.modify.bind($app_root, store, data, node) }><i class="el-icon-edit"></i></el-button>,
				<el-button size="mini" onClick={$app_root.remove.bind($app_root, store, data, node) }><i class="el-icon-delete"></i></el-button>
			];

			if(node.level < max_depth){
				controls.push(
					<el-button size="mini" onClick={$app_root.append.bind($app_root, store, data, node) }><i class="el-icon-plus"></i></el-button>,
				);
			}

			return (
				<span>
					<span>
					  <span><b>{node.data.title}</b> ({node.data.desc})</span>
					</span>
					<span style="float: right; margin-right: 20px">{controls}</span>
				</span>
	        );
		},

		renderTreeNode(node, resolve) {
			
			if(node.data && node.data.children){
				resolve(node.data.children);
			} else {
				return this.onNodeExpand(node, resolve);
			}
			
		},

		onNodeExpand(node, resolve){
			let isLeaf         = node.isLeaf;
			let token          = this.$getState().$get('token');
			let app            = this;
			let target_node_id = node.data.id;
			let query_node_ids = [target_node_id];

			if(query_node_ids.length){
				axios.get('/api/categories/get_subnodes', {
					params: {
						token,
						parent_ids: query_node_ids.join(',')
					},
					withCredentials: true
				}).then((result) => {
					if(result.status === 200 && result.data.success){
						_.each(app.tree_data, (node, idx) => {
							resolve(result.data.data)
						});
					} else {
						app.$alert(result.data.message, 'Error');
					}
				}).catch((error) => {
					console.error('Something wrong:', error);
				});
			}else {
				return resolve([]);
			}
		},


		remove(store, data, node) {
			if(!node.isLeaf){
				this.$message({message:'This node still has kids, cannot be removed', type:'error'})
			} else {
				this.$confirm('Are you sure? If this category still has articles, it will fail.', 'Warning', {
					confirmButtonText: 'Yes, fuck it',
					cancelButtonText: 'No, I cannot decide',
					type: 'warning'
		        }).then(() => {

					store.remove(data);

					this.$message({
						type: 'info',
						message: 'My man~'
					});  

					let token = this.$getState().$get('token');

					axios.delete('/api/categories', {
						params: {
							token
						},
						data: {
							ID: data.id
						},
						withCredentials: true
					});        

		        }).catch(() => {
					this.$message({
						type: 'info',
						message: 'Chicken~'
					});
		        });
			}
		},

		append(store, data, node) {

			this.dialogMode = 'append';

			this.form = {
				title:    '',
        		desc:      '',
        		position:  0,
        		parent_id: data.id,
        		level:     node.level + 1
			};

			this.categoryEditFormShow = true;
			this.treeStore            = store;
			this.treeDataHolder       = data;//this data is Obseverable object, we need this to add element
		},

		modify(store, data, node) {
			this.categoryEditFormShow = true;
			this.form                 = data;
			this.form.level           = node.level;
			this.dialogMode           = 'modify';
			this.treeStore            = store;
			this.treeDataHolder       = data;
		},

		submit(){

			let token = this.$getState().$get('token');
			let app   = this;

			axios.post('/api/categories', this.form)
			.then((result) => {
				if(result.data.success && result.status === 200){
					app.$message({message:'Sub node added', type:'success'});

					if(app.dialogMode === 'append'){

						if(_.isUndefined(result.data.category)){
							app.$message({message:'Invalid category structure returned', type:'error'});
							return false;
						}

						//the second parameter must be Obseverable object, 
						//otherwise, it won't work
						app.treeStore.append({
 							id:        result.data.category.ID,
 							title:     result.data.category.Title,
 							desc:      result.data.category.Description,
 							position:  result.data.category.Position,
							parent_id: result.data.category.parent_id,
 							children: []
 						}, app.treeDataHolder);
					} 

				} else {
					app.$message({message:'Unable to add sub node: ' + result.data.message, type:'error'});
				}
			}).catch((error) => {
				console.error('Error@submit():', error);
				app.$message({message:error.message, type:'error'});
			});

		},

		resetForm (){
			this.$refs['category-form'].resetFields();
			this.form = {
				title:    '',
        		desc:     '',
        		position: 0
			};
		},

		openDialog(scope){
			scope.categoryEditFormShow = true;
		}
	},//eo methods

	init_dyn_component () {
		
		let function_name = this.$route.path.substring(5);
		let token         = this.$getState().$get('token');
		let app           = this;

		axios.get('/api/categories', {
			params: {
				token,
				function_name
			},
			withCredentials: true
		})
		.then((result) => {
			if(result.status === 200 && result.data.success){

				app.tree_data = result.data.data;

			} else {
				app.$alert(result.data.message, 'Error');
			}
		})
		.catch((error) => {
			console.error('Something wrong:', error);
		});
	}
}

export default component;
</script>

<style>
.container{
	width: 100%;
	height: 100%;
	padding: 0px;
	margin: 0px;
}
.jsgrid-cell{
	overflow: hidden;
}
</style>