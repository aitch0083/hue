/**
 * Actions
 * Aitch Chung.
 */

//for periperal actions
var $doc        = $(document);
var resize_all  = false;
var layout      = $('#layout_ipt').val();
var resize_func = function(){
	if(!resize_all){
			resize_all = true;
			var t = setTimeout(function(){

			$('#ArticleContentContainer').find('img').responsImg();
    		$('.footer-same-cate-articles-smaller').equalHeights();
    		clearTimeout(t);

    		resize_all = false;

			}, 2000);
		}
};

$doc.foundation();

$('#topmost-menu').removeClass('hide');

var $mgrid          = null;
var $page_indicator = null;
var cached_path     = {};

var loadnext = _.throttle(function(){
	$page_indicator = $('.page-indicator:last');
	
	if($page_indicator.length){
		var src = $page_indicator.data('src');

		if(src){

			if(cached_path[src] !== undefined){
				return;
			}

			$.get(src, {layout:layout}, function(result){
				var $result = $(result);
				if(src.indexOf('/index/0') > 0){
					$mgrid.append($result);
				} else {
					$('#playpoint').append($result);
				}
			});

			cached_path[src] = 1;
		}
	}//eo $page_indicator if

}, 800);

$doc.ready(function(){

	var md = new MobileDetect(window.navigator.userAgent);

	$('.ratio-item-img').keepRatio({ ratio: 16/9, calculate: 'height' });
	$('#ArticleContentContainer').find('img').responsImg();

	$.get('/menu').then(function(result){
		$('#top-menu-placeholder').html(result);
	});

	$mgrid = $('#masonry-grid');
	loadnext();

	var $marcomarco = $('.marco-photos');
	if($marcomarco.length){
			$(".marco-container").twentytwenty();
	}

	var $pano_images = $('img.pano-photos');
	if($pano_images.length){
		$pano_images.each(function(idx, img){
			var $img = $(img);
			$img.after('<div class="pano-container" data-img-src="'+$img.attr('src')+'" />');
		});

		var $pano_container = $('div.pano-container');

		if($pano_container.length){ //has PSV feature
			
			$('.pano-container').each(function(jdx, div){

				// Panorama display
				div.style.height = '30px';

				var image_src = $(div).data('img-src');
				var height = md.phone() !== null ? '220px' : '450px';

				if(!image_src){
					return true;
				}

				PSV = new PhotoSphereViewer({
					// Path to the panorama
					panorama: image_src,
					// Container
					container: div,
					// Deactivate the animation
					time_anim: false,
					// Display the navigation bar
					navbar: true,
					// Resize the panorama
					size: {
						width: '100%',
						height: height
					},
					// HTML loader
					loading_html: '↻ 讀取全景圖中...',
					// Disable smooth moves to test faster
					smooth_user_moves: false
				});

			});//eo each

			$('.pano-container').keepRatio({ ratio: 16/9, calculate: 'height' });

		}//eo PSV telling
	}

	$('.footer-same-cate-articles-smaller').equalHeights();

	var $cate_container = $('#cate-container');
	var $window         = $(window);

	$window.resize(function(){
			resize_func();
	}).scroll(function() {

	   var target_height = $cate_container.length ? $cate_container[0].scrollHeight : $doc.height();

	   if($window.scrollTop() + $window.height() > target_height - 320) {
	       loadnext();
	   }
	});//eo scroll
	
});//eo document.ready

/**
 * Google Analytics
 */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-7656955-5', 'auto');
ga('send', 'pageview');