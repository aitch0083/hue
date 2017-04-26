<template>
	<div class="container">
		<el-row type="flex" justify="center">
	  		<login-form></login-form>
		</el-row>
	</div>
</template>

<script>

import LoginForm from './components/login.form.vue';

export default {

	data(){
		return {
			app_name: 'DewAPI, provide and serve'
		};
	},

	components: {
		'login-form': LoginForm
	}
}
</script>

<style>
.container{
	width: 100%;
	height: 100%;
	padding: 0px;
	margin: 0px;
}
</style>