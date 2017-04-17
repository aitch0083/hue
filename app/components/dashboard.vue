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

let component = {
	
	data() {
		return $shared.data.apply(this);
	},

	mounted(){
		$shared.mounted.apply(this, [component]);
	},

	updated() {
		$shared.updated.apply(this);
	},

	methods: $shared.methods,

	init_dyn_component () {
		
		$shared.init_dyn_component.apply(this);
	}
}

export default component;
</script>

<style>
.jsgrid-cell{
	overflow: hidden;
}
</style>