import Vue from 'vue';
import ElementUI from 'element-ui';
import VueRouter from 'vue-router';

import locale from 'element-ui/lib/locale/lang/en';

import router from './router';

Vue.use(VueRouter);
Vue.use(ElementUI, {locale});

let Store = () => {

	let _states = {};

	return {
		'$get': (name) => {
			return _states[name] ? _states[name] : null;
		},
		'$set': (name, value) => {
			_states[name] = value;
		}
	};

};

let $state = Store();

let MyPi = (Vue, options) => {
	Vue.directive('focus', {
		inserted: (el) => {
			el.focus();
		}
	});

	Vue.prototype.$getState = () => {
		return $state;
	};
};

Vue.use(MyPi);

new Vue({
	router,
	el: '#app',
	// render: (createElement) => createElement(App)
});