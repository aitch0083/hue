module.exports = {
	site_author: {
	    name: 'Aitch Chung',
	    email: 'aitch0083@gmail.com',
	    link: 'https://www.lian-car.com'
  	},	
	site_title: 'CARLINK鏈車網',
	site_url:   '/',
	site_description: '戀上車，從CARLINK鏈車網開始',
	site_public_url: 'https://www.lian-car.com',
	fb_id:      '',
	logo: '/images/watermark.png',

	image_prefix: '/',

	extra_footer: 'page_footer',

	home_latest_artcile_no: 35,
	latest_artcile_no: 10,
	same_cate_article_no: 12,
	category_artcile_no: 20,

	old_server_ip: '139.162.21.105',
	new_server_ip: '139.162.50.229',

	session: {
		secret: '$Hstsyw929B7347KKs002!',
		name: 'hueSession2017',
		resave: true,
  		saveUninitialized: true,
  		ephemeral: true,
		rolling: true,
		// cookie: { 
		// 	path: '/',
		// 	secure: false,
		// 	httpOnly: true,
		// 	expires: new Date(Date.now() + 60 * 60 * 1000)
		// },
	}
};