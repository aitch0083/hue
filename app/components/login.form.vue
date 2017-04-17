<template>

	<el-card class="box-card">
		<el-form v-bind:model="form" v-bind:rules="rules" ref="login-form" label-width="100px">

			<el-form-item label="Username" prop="username">
			    <el-input v-model="form.username"></el-input>
		  	</el-form-item>

		  	<el-form-item label="Password" prop="password">
			    <el-input v-model="form.password"></el-input>
		  	</el-form-item>

			<el-form-item>
			    <el-button type="primary" v-on:click="dologin">Submit</el-button>
			    <el-button v-on:click="resetForm">Reset</el-button>
			</el-form-item>
		</el-form>
	</el-card>
</template>

<script>

import axios  from 'axios';
import _      from 'lodash';

export default {
	name: 'login-form',
	data () {
		return {
			form: {
				username: '',
				password: ''
			},
			usernameInvalid: false,
			passwordInvalid: false,
			loginError:      false,
			errorMessage:    '',
			rules: {
	          username: [
	            { required: true, message: 'Please input username', trigger: 'blur' },
	            { min: 3, max: 15, message: 'Length should be 3 to 15', trigger: 'blur' }
	          ],
	          password: [
	            { required: true, message: 'Please input password', trigger: 'blur' },
	            { min: 3, max: 15, message: 'Length should be 3 to 15', trigger: 'blur' }
	          ],
	        }
		};
	},
	mounted () {
		// console.info('login-form mounted...');
	},
	methods: {
		verfyForm () {
			let form = {
				username: _.escape(_.trim(this.form.username)),
				password: _.escape(_.trim(this.form.password))
			};

			let okay = true;

			if(_.isEmpty(form.username)){
				this.usernameInvalid = true;
				okay = okay && false;
			} else {
				this.usernameInvalid = false;
			}

			if(_.isEmpty(form.password)){
				this.passwordInvalid = true;
			 	okay = okay && false;
			} else {
				this.passwordInvalid = false;
			}

			if(okay){
				return form;
			} else {
				return false;
			}
		},
		dologin () {
			
			let form = this.verfyForm();
			let app  = this;

			this.$refs['login-form'].validate((valid) => {
				if(valid){
					axios.post('/api/login', form)
					.then((result) => {

						app.loginError = false;
						app.errorMessage = '';

						if(result.data.success && result.status === 200){

							app.$message({message:'Redirecting, please wait...', type:'success'});

							this.$router.push('/app/dashboard');

							app.$getState().$set('token', result.data.token);
						} else {
							app.loginError = true;
							app.errorMessage = result.data.message;

							app.$message({message:result.data.message, type:'error'});
						}
					})
					.catch((error) => {
						app.loginError = true;
						app.errorMessage = error.response.data;

						app.$message({message:'Something went wrong!', type:'error'});
					});
				} else {
					return false;
				}
			});
		},
		resetForm (){
			this.$refs['login-form'].resetFields();
		}
	}
};
</script>

<style>
.login-form{
	margin-top: 1rem;
	width: 23rem;
}
</style>