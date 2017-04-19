module.exports = {
	
	site_title: 'Dew API',
	site_url:   '/',
	fb_id:      '',

	home_latest_artcile_no: 15,
	latest_artcile_no: 10,
	same_cate_article_no: 12,
	category_artcile_no: 20,

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