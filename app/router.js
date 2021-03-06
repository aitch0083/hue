import VueRouter from 'vue-router';

import Entry from './entry.vue';
import Dashboard from './components/dashboard.vue';
import Article from './components/article.vue';
import Banner from './components/banner.vue';
import Category from './components/category.vue';
import ArticleEditor from "./components/article.editor.vue";
import BannerEditor from "./components/banner.editor.vue";

let router = new VueRouter({
	suppressTransitionError: false,
	routes: [
		{ path: '/', component: Entry },
		{ path: '/app/dashboard', component: Dashboard },
		{ path: '/app/banners', component: Banner },
		{ path: '/app/categories', component: Category },
		{ path: '/app/articles', component: Article },
		{ path: '/app/addnew', component: ArticleEditor },
		{ path: '/app/edit/:id', component: ArticleEditor },
		{ path: '/app/banneredit/:id', component: BannerEditor },
		{ path: '/app/addbanner', component: BannerEditor },
	]
});

router.beforeEach((to, from, next) => { 
	next(true);
});

// router.afterEach((to, from) => {
// 	console.info('AFTER to:', to.path, ', from: ', from.path);
// });

export default router;

