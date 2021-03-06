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
	$mgrid = $mgrid === null ? $('#masonry-grid') : $mgrid;

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

					var live_days = {
						// 1:'週一愛生活', 
						// 2:'17鏈戀車',
						// 3:'週三愛玩車'
					};
					var today     = new Date();
				    var dow       = today.getDay();
				    var hour      = today.getHours();
				    var month     = today.getMonth();
				    //column column-block big-head
				    //column column-block side-kicks
				    if(live_days[dow] && hour >= 17 && month !== 1){//disabled in Feb
				    	$('#hotliner').removeClass('big-head').addClass('side-kicks');
				    	$('#latest-stream').removeClass('hide').addClass('big-head');
				    } else {
				    	$('#latest-stream').remove();
				    }

				    var today = new Date();
					var month = today.getMonth() + 1;
				    var date = today.getDate();
					var tonight =  today.getFullYear() + '/' + (month < 10 ? '0' + month : month)  + '/' + (date < 10 ? '0' + date : date);
				    tonight += " 20:00:00";
					$('#countdown-clock').countdown(tonight, function(event) {
				        $(this).html(
				          event.strftime('倒數: <span class="blue">%H:%M:%S</span>')
				        );
					});

				} else {
					$('#playpoint').append($result);
				}

				$('.img-lazy-load').lazyload();
			});

			cached_path[src] = 1;
		}
	}//eo $page_indicator if

}, 800);

$doc.ready(function(){

	var md      = new MobileDetect(window.navigator.userAgent);
	var $window = $(window);

	$('.img-lazy-load').lazyload();
	
	$('.ratio-item-img').keepRatio({ ratio: 16/9, calculate: 'height' });
	$('#ArticleContentContainer').find('img').responsImg();

	$.get('/menu').then(function(result){
		$('.menu-holder').html(result);
	});

	$mgrid = $mgrid === null ? $('#masonry-grid') : $mgrid;
	//loadnext();
	var live_days = {
		// 1:'週一愛生活', 
		// 2:'17鏈戀車',
		// 3:'週三愛玩車'
	};
	var today     = new Date();
    var dow       = today.getDay();
    var hour      = today.getHours();
    var month     = today.getMonth();
    //column column-block big-head
    //column column-block side-kicks
    if(live_days[dow] && hour >= 17 && month !== 1){//disabled in Feb
    	$('#hotliner').removeClass('big-head').addClass('side-kicks');
    	$('#latest-stream').removeClass('hide').addClass('big-head');
    } else {
    	$('#latest-stream').remove();
    }

	var $marco_container = $('.marco-container');
	var $marcomarco      = $('.marco-photos:last');
    var $zoom_imgs       = $('.zoom');

    $zoom_imgs.hover(function() {
        $(this).addClass('transition');
    }, function() {
        $(this).removeClass('transition');
    });

	var wobble_slide = function(container, wobble_time) {

        var count       = 1;
        var swing_left  = 0.33;
        var swing_right = 0.67;
        var brate1      = 0;
        var brate2      = 0;

        wobble_time = wobble_time || 660;

        if(container.busy_wobling){
        	return;
        }

        var queue = [
            function() {
                container.setValue(swing_left, true);
                container.busy_wobling = true;
            },
            function() {
                container.setValue(swing_right, true);
            },
            function() {
                container.setValue(swing_left + brate1, true);
            },
            function() {
                container.setValue(swing_right - brate1, true);
            },
            function() {
                container.setValue(swing_left + brate2, true);
            },
            function() {
                container.setValue(swing_right - brate2, true);
            },
            function() {
                container.setValue(0.5, true);
                container.busy_wobling = false;
            },
        ];

        var callf = function() {

            if (queue.length <= 0) {
                clearTimeout(_c);
                return false;
            }

            var _f = queue.shift();
            _f();

            setTimeout(callf, wobble_time);
        };

        var _c = setTimeout(callf, wobble_time);

    };//eo wobble_slide
	
	$('iframe.note-video-clip').wrap('<div class="responsive-embed widescreen"></div>');

	$marco_container.before('<div class="marco-preloader"><h5>Marco努力加載中...</h5><img src="/images/car_loading.gif" width="100" height="100"></div>');

	var elementScrolled = function ($elem) {

        var docViewTop    = $window.scrollTop();
        var docViewBottom = docViewTop + $window.height();

        if($elem.length > 1){

        	$elem.each(function(idx){
        		var $this      = $(this);
        		var elemTop    = $this.offset().top;
        		var elemHeight = $this.height();

        		elemTop += elemHeight;
				
				if((elemTop <= docViewBottom) && (elemTop >= docViewTop)){

					wobble_slide($this.data('imagesCompare'));
				}
        	});

        } else { 

	        var elemTop = $elem.offset().top;

	        if((elemTop <= docViewBottom) && (elemTop >= docViewTop)){
				wobble_slide($elem.data('imagesCompare'));
			}
    	}
    };

	// console.info('$marcomarco:', $marcomarco.get(0).complete);
	var $compare_image_container = null;
	$marcomarco.one('load', function($event){
		$(".marco-preloader").remove();
		var _c = setTimeout(function(){
			clearTimeout(_c);
			
			//$(".marco-container").twentytwenty();
			$compare_image_container = $marco_container.each(function(idx){
				var $ele = $(this);
				$ele.find('img:first').wrap('<div style="display: none;"></div>');
				$ele.find('img:last').wrap('<div></div>');
			}).imagesCompare({
		        animationDuration: 600
		    }).data('imagesCompare');

			$(window).scroll(_.throttle(function() {
		        elementScrolled($marco_container);
		    }, 1000));

		}, 500);
	});

	if($marcomarco.length && $marcomarco.get(0).complete){
		$marcomarco.trigger('load');
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

				var PSV = new PhotoSphereViewer({
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
	
	$window.resize(function(){
			resize_func();
	}).scroll(function() {

	   var target_height = $cate_container.length ? $cate_container[0].scrollHeight : $doc.height();

	   console.info('$window.scrollTop():',$window.scrollTop(),',$window.height():',$window.height(),',target_height:',target_height);

	   if($window.scrollTop() + $window.height() > (target_height * .65)) {
	   	   loadnext();
	   }
	});//eo scroll

	/**
	 * Sharing buttons
	 */


	var share_url  = $('#share_url').val();
    var is_desktop = $('#is_desktop').val();
    var is_mobile  = $('#is_mobile').val();

    var fb_url = '';

    if(is_desktop && share_url === '/') {
        fb_url = "https://www.facebook.com/CARLINK-164873120536112/";
    } else if(is_desktop && share_url !== '/') {
        fb_url = "https://www.facebook.com/sharer.php?u={url}";
    } else if(is_mobile && share_url === '/') {
        fb_url = "fb://profile/164873120536112";
    } else if(is_mobile && share_url !== '/') {
        fb_url = "https://www.facebook.com/sharer.php?u={url}";
    } else {
        fb_url = "https://www.facebook.com/CARLINK-164873120536112/";
    }

    var weixin_url = '';

    if(share_url !== '/') {
        weixin_url = "/pages/generate_qrcode?app=wechat&link={url}";
    } else if(is_desktop && share_url === '/') {
        weixin_url = "https://mp.weixin.qq.com/s?__biz=MzI0MDE5MDI5NQ==&mid=402638745&idx=1&sn=15101d733ad48d667a8ccd8f2eb7945d&scene=0#wechat_redirect";
    } else if(!is_desktop && share_url === '/') {
        weixin_url = "/pages/generate_qrcode?app=weixin_direct&link={url}";
    } else {
        weixin_url = "/pages/generate_qrcode?app=wechat&link={url}";
    }

    var buttons = [ {
        icon : "comment",
        color : "#01C312",
        url : share_url !== '/' ? "https://line.me/R/msg/text/?{title}{newline}{url}" : "https://line.me/ti/p/%40zth3224h",
        mobile : true,
        text : 'LINE'
    }, {
        icon :  "facebook",
        color : "#3B5998",
        url :   fb_url
    }, {
        icon : "whatsapp",
        color : "#1D9E11",
        url : "whatsapp://send?text={title}{newline}{url}",
        mobile : true
    }, {
        icon : "google-plus",
        color : "#DD4B39",
        url : share_url !== '/' ? "https://plus.google.com/share?url={url}" : "https://plus.google.com/101471739183664981875/"
    }, {
        icon : "weixin",
        color : "#1D9E11",
        url: weixin_url
    }, {
        icon : "twitter",
        color : "#00ACED",
        url : "http://twitter.com/share?text={title}&url={url}"
    }, {
        icon : "mobile",
        color : "#0076FF",
        url : "sms:?&body={title}{newline}{url}",
        mobile : true,
        text:"信息"
    } ];
    
    var wrapper = $("<div class='lian-share-wrapper'></div>");

    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        var url = button.url.replace("{title}",
                encodeURIComponent(document.title)).replace("{url}",
                encodeURIComponent(window.location.href)).replace("{newline}",
                escape("\n"));
        var buttonTemp = "<a href='{url}' target='_blank' style='background:{color}' class='{icon}'><i class='fa fa-{icon}'></i><span class='text'>{text}</span></a>";
        var buttonHtml = buttonTemp.replace("{url}", url).replace(/{icon}/g,
                button.icon).replace("{color}", button.color).replace("{text}",
                button.text || "");
        var buttonLink = $(buttonHtml);
        if (button.mobile == true) {
            buttonLink.addClass('hide-desktop');
        }

        wrapper.append(buttonLink);
    }

    $('body').append(wrapper);
    $window.resize(function() {
        if ($doc.width() <= 1000) {
            var width = 100 / buttons.length;
            wrapper.addClass("lian-share-wrapper-bottom").removeClass(
                    "lian-share-wrapper-left");
        } else {
            var width = 100;
            wrapper.addClass("lian-share-wrapper-left").removeClass("lian-share-wrapper-bottom");
        }
        $(".lian-share-wrapper a").css("width", width + "%");
    });
    $window.resize();

    $('iframe.thumbnail').each(function(idx, ele){
    	var $ele = $(ele);
    	var src = $ele.attr('src');

    	if(src){
    		$ele.attr('src', src);
    	}
    });

    setTimeout(function(){
    	$('ins.adsbygoogle:last').remove();
    }, 2500);
	
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