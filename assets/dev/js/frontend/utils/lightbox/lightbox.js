import screenfull from './screenfull';

module.exports = elementorModules.ViewModule.extend( {
	oldAspectRatio: null,

	oldAnimation: null,

	swiper: null,

	player: null,

	getDefaultSettings: function() {
		return {
			classes: {
				aspectRatio: 'elementor-aspect-ratio-%s',
				item: 'elementor-lightbox-item',
				image: 'elementor-lightbox-image',
				videoContainer: 'elementor-video-container',
				videoWrapper: 'elementor-fit-aspect-ratio',
				playButton: 'elementor-custom-embed-play',
				playButtonIcon: 'fa',
				playing: 'elementor-playing',
				hidden: 'elementor-hidden',
				invisible: 'elementor-invisible',
				preventClose: 'elementor-lightbox-prevent-close',
				slideshow: {
					container: 'swiper-container',
					slidesWrapper: 'swiper-wrapper',
					prevButton: 'elementor-swiper-button elementor-swiper-button-prev',
					nextButton: 'elementor-swiper-button elementor-swiper-button-next',
					prevButtonIcon: 'eicon-chevron-left',
					nextButtonIcon: 'eicon-chevron-right',
					slide: 'swiper-slide',
					header: 'elementor-slideshow__header',
					footer: 'elementor-slideshow__footer',
					title: 'elementor-slideshow__title',
					description: 'elementor-slideshow__description',
					counter: 'elementor-slideshow__counter',
					iconExpand: 'elementor-icon-fullscreen',
					iconShrink: 'shrink',
					iconZoomIn: 'eicon-zoom-in-bold',
					iconZoomOut: 'eicon-zoom-out-bold',
					iconShare: 'elementor-icon-share',
					shareMenu: 'elementor-slideshow__share-menu',
					hideUiVisibility: 'elementor-slideshow--ui-hidden',
					shareMode: 'elementor-slideshow--share-mode',
					zoomMode: 'elementor-slideshow--zoom-mode',
				},
			},
			selectors: {
				links: 'a, [data-elementor-lightbox]',
				slideshow: {
					activeSlide: '.swiper-slide-active',
					prevSlide: '.swiper-slide-prev',
					nextSlide: '.swiper-slide-next',
				},
			},
			modalOptions: {
				id: 'elementor-lightbox',
				entranceAnimation: 'zoomIn',
				videoAspectRatio: 169,
				position: {
					enable: false,
				},
			},
		};
	},

	getModal: function() {
		if ( ! module.exports.modal ) {
			this.initModal();
		}

		return module.exports.modal;
	},

	initModal: function() {
		var modal = module.exports.modal = elementorFrontend.getDialogsManager().createWidget( 'lightbox', {
			className: 'elementor-lightbox',
			closeButton: true,
			closeButtonClass: 'eicon-close',
			selectors: {
				preventClose: '.' + this.getSettings( 'classes.preventClose' ),
			},
			hide: {
				onClick: true,
			},
		} );

		modal.on( 'hide', function() {
			modal.setMessage( '' );
		} );
	},

	showModal: function( options ) {
		var self = this,
			defaultOptions = self.getDefaultSettings().modalOptions;

		self.setSettings( 'modalOptions', jQuery.extend( defaultOptions, options.modalOptions ) );

		var modal = self.getModal();

		modal.setID( self.getSettings( 'modalOptions.id' ) );

		modal.onShow = function() {
			DialogsManager.getWidgetType( 'lightbox' ).prototype.onShow.apply( modal, arguments );

			self.setEntranceAnimation();
		};

		modal.onHide = function() {
			DialogsManager.getWidgetType( 'lightbox' ).prototype.onHide.apply( modal, arguments );

			modal.getElements( 'message' ).removeClass( 'animated' );
		};

		switch ( options.type ) {
			case 'image':
				self.setImageContent( options.url );

				break;
			case 'video':
				self.setVideoContent( options );

				break;
			case 'slideshow':
				self.setSlideshowContent( options.slideshow );
				break;
			default:
				self.setHTMLContent( options.html );
		}

		modal.show();
	},

	setHTMLContent: function( html ) {
		this.getModal().setMessage( html );
	},

	setImageContent: function( imageURL ) {
		var self = this,
			classes = self.getSettings( 'classes' ),
			$item = jQuery( '<div>', { class: classes.item } ),
			$image = jQuery( '<img>', { src: imageURL, class: classes.image } );

		$item.append( $image );

		self.getModal().setMessage( $item );
	},

	setVideoContent: function( options ) {
		var classes = this.getSettings( 'classes' ),
			$videoContainer = jQuery( '<div>', { class: `${ classes.videoContainer } ${ classes.preventClose }` } ),
			$videoWrapper = jQuery( '<div>', { class: classes.videoWrapper } ),
			$videoElement,
			modal = this.getModal();

		if ( 'hosted' === options.videoType ) {
			var videoParams = jQuery.extend( { src: options.url, autoplay: '' }, options.videoParams );

			$videoElement = jQuery( '<video>', videoParams );
		} else {
			var videoURL = options.url.replace( '&autoplay=0', '' ) + '&autoplay=1';

			$videoElement = jQuery( '<iframe>', { src: videoURL, allowfullscreen: 1 } );
		}

		$videoContainer.append( $videoWrapper );

		$videoWrapper.append( $videoElement );

		modal.setMessage( $videoContainer );

		this.setVideoAspectRatio();

		var onHideMethod = modal.onHide;

		modal.onHide = function() {
			onHideMethod();

			modal.getElements( 'message' ).removeClass( 'elementor-fit-aspect-ratio' );
		};
	},

	getSlideshowHeader: function() {
		const $ = jQuery,
			classes = this.getSettings( 'classes' ),
			slideshowClasses = classes.slideshow,
			headerElements = {
				$header: $( '<header>', { class: slideshowClasses.header + ' ' + classes.preventClose } ),
				$counter: $( '<span>', { class: slideshowClasses.counter } ),
				$iconExpand: $( '<i>', { class: slideshowClasses.iconExpand } ).append( '<span>', '<span>' ),
				$iconZoom: $( '<i>', { class: slideshowClasses.iconZoomIn } ),
				$iconShare: $( '<i>', { class: slideshowClasses.iconShare } ).append( '<span>' ),
			};
		this.elements = { ...this.elements, ...headerElements };
		const $shareLinks = $( '<ul><li>Share on Facebook</li><li>Share on Facebook</li></ul>' );
		this.elements.$shareMenu = $( '<div>', { class: slideshowClasses.shareMenu } ).append( $shareLinks );
		const elements = this.elements;

		elements.$iconExpand.on( 'click', this.toggleFullscreen );
		elements.$iconZoom.on( 'click', this.toggleZoomMode );
		elements.$iconShare.add( elements.$shareMenu ).on( 'click', this.toggleShareMenu );
		$shareLinks.on( 'click', ( e ) => {
			e.stopPropagation();
		} );

		elements.$header.append(
			elements.$counter,
			elements.$iconExpand,
			elements.$iconZoom,
			elements.$iconShare,
			elements.$shareMenu,
		);

		return elements.$header;
	},

	toggleFullscreen: function() {
		const classes = this.getSettings( 'classes' );
		if ( screenfull.isFullscreen ) {
			screenfull.exit();
			this.elements.$iconExpand.removeClass( classes.slideshow.iconShrink );
		} else if ( screenfull.isEnabled ) {
			screenfull.request( this.elements.$container.parents( '.dialog-widget' )[ 0 ] );
			this.elements.$iconExpand.addClass( classes.slideshow.iconShrink );
		}
	},

	toggleZoomMode: function() {
		if ( 1 !== this.swiper.zoom.scale ) {
			this.deactivateZoom();
			return;
		}
		this.activateZoom();
	},

	activateZoom: function() {
		const swiper = this.swiper,
			elements = this.elements,
			classes = this.getSettings( 'classes' );
		swiper.zoom.enable();
		swiper.zoom.in();
		swiper.allowSlideNext = false;
		swiper.allowSlidePrev = false;
		swiper.allowTouchMove = false;
		elements.$container.addClass( classes.slideshow.zoomMode );
		elements.$iconZoom.removeClass( classes.slideshow.iconZoomIn ).addClass( classes.slideshow.iconZoomOut );
	},

	deactivateZoom: function() {
		const swiper = this.swiper,
			elements = this.elements,
			classes = this.getSettings( 'classes' );
		swiper.zoom.out();
		swiper.allowSlideNext = true;
		swiper.allowSlidePrev = true;
		swiper.allowTouchMove = true;
		elements.$container.removeClass( classes.slideshow.zoomMode );
		elements.$iconZoom.removeClass( classes.slideshow.iconZoomOut ).addClass( classes.slideshow.iconZoomIn );
	},

	toggleShareMenu: function() {
		const classes = this.getSettings( 'classes' ),
			$container = this.elements.$container;
		if ( ! $container.hasClass( classes.slideshow.shareMode ) ) {
			$container.addClass( classes.slideshow.shareMode );
			this.swiper.detachEvents();
			return;
		}
		$container.removeClass( classes.slideshow.shareMode );
		this.swiper.attachEvents();
	},

	getSlideshowFooter: function() {
		const $ = jQuery,
			classes = this.getSettings( 'classes' ),
			$footer = $( '<footer>', { class: classes.slideshow.footer + ' ' + classes.preventClose } ),
			$title = $( '<h2>', { class: classes.slideshow.title } ),
			$description = $( '<div>', { class: classes.slideshow.description } );
		$footer.append( $title, $description );
		return $footer;
	},

	setSlideshowContent: function( options ) {
		const $ = jQuery,
			self = this,
			classes = self.getSettings( 'classes' ),
			slideshowClasses = classes.slideshow,
			$container = $( '<div>', { class: slideshowClasses.container } ),
			$slidesWrapper = $( '<div>', { class: slideshowClasses.slidesWrapper } ),
			$prevButton = $( '<div>', { class: slideshowClasses.prevButton + ' ' + classes.preventClose } ).html( $( '<i>', { class: slideshowClasses.prevButtonIcon } ) ),
			$nextButton = $( '<div>', { class: slideshowClasses.nextButton + ' ' + classes.preventClose } ).html( $( '<i>', { class: slideshowClasses.nextButtonIcon } ) );

		options.slides.forEach( function( slide ) {
			let slideClass = slideshowClasses.slide + ' ' + classes.item;

			if ( slide.video ) {
				slideClass += ' ' + classes.video;
			}

			const $slide = $( '<div>', { class: slideClass } );

			if ( slide.video ) {
				$slide.attr( 'data-elementor-slideshow-video', slide.video );

				const $playIcon = $( '<div>', { class: classes.playButton } ).html( $( '<i>', { class: classes.playButtonIcon } ) );

				$slide.append( $playIcon );
			} else {
				const $zoomContainer = $( '<div>', { class: 'swiper-zoom-container' } ),
					$slideImage = $( '<img>', {
						class: classes.image + ' ' + classes.preventClose,
						src: slide.image,
						'data-title': slide.title,
						'data-description': slide.description,
					} );

				$zoomContainer.append( $slideImage );
				$slide.append( $zoomContainer );
			}

			$slidesWrapper.append( $slide );
		} );

		this.elements.$container = $container;
		this.elements.$header = self.getSlideshowHeader();
		this.elements.$footer = self.getSlideshowFooter();

		$container.prepend( this.elements.$header );
		$container.append(
			$slidesWrapper,
			$prevButton,
			$nextButton,
			this.elements.$footer,
		);

		this.setSettings( 'hideUiTimeout', '' );

		$container.on( 'mouseenter mouseover mousedown mousemove keyup keypress swipe tap vmousedown vmouseover vmousemove', function() {
			clearTimeout( self.getSettings( 'hideUiTimeout' ) );
			$container.removeClass( slideshowClasses.hideUiVisibility );
			self.setSettings( 'hideUiTimeout', setTimeout( function() {
				if ( ! $container.hasClass( 'share-mode' ) ) {
					$container.addClass( slideshowClasses.hideUiVisibility );
				}
			}, 2500 ) );
		} );

		const modal = self.getModal();

		modal.setMessage( $container );

		const onShowMethod = modal.onShow;

		modal.onShow = function() {
			onShowMethod();

			const swiperOptions = {
				navigation: {
					prevEl: $prevButton,
					nextEl: $nextButton,
				},
				pagination: {
					el: '.' + slideshowClasses.counter,
					type: 'fraction',
				},
				on: {
					slideChangeTransitionEnd: self.onSlideChange,
				},
				spaceBetween: 100,
				grabCursor: true,
				runCallbacksOnInit: false,
				loop: true,
				keyboard: true,
			};

			if ( options.swiper ) {
				$.extend( swiperOptions, options.swiper );
			}

			self.swiper = new Swiper( $container, swiperOptions );

			self.setVideoAspectRatio();

			self.playSlideVideo();

			self.updateFooterText();
		};
	},

	setVideoAspectRatio: function( aspectRatio ) {
		aspectRatio = aspectRatio || this.getSettings( 'modalOptions.videoAspectRatio' );

		var $widgetContent = this.getModal().getElements( 'widgetContent' ),
			oldAspectRatio = this.oldAspectRatio,
			aspectRatioClass = this.getSettings( 'classes.aspectRatio' );

		this.oldAspectRatio = aspectRatio;

		if ( oldAspectRatio ) {
			$widgetContent.removeClass( aspectRatioClass.replace( '%s', oldAspectRatio ) );
		}

		if ( aspectRatio ) {
			$widgetContent.addClass( aspectRatioClass.replace( '%s', aspectRatio ) );
		}
	},

	getSlide: function( slideState ) {
		return jQuery( this.swiper.slides ).filter( this.getSettings( 'selectors.slideshow.' + slideState + 'Slide' ) );
	},

	updateFooterText: function() {
		const classes = this.getSettings( 'classes' ),
			$activeSlide = this.getSlide( 'active' ),
			titleText = $activeSlide.find( '.elementor-lightbox-image' ).data( 'title' ),
			descriptionText = $activeSlide.find( '.elementor-lightbox-image' ).data( 'description' ),
			$title = this.elements.$footer.find( '.' + classes.slideshow.title ),
			$description = this.elements.$footer.find( '.' + classes.slideshow.description );
		$title.empty().text( titleText );
		$description.empty().text( descriptionText );
	},

	playSlideVideo: function() {
		const $activeSlide = this.getSlide( 'active' ),
			videoURL = $activeSlide.data( 'elementor-slideshow-video' );

		if ( ! videoURL ) {
			return;
		}

		const classes = this.getSettings( 'classes' ),
			$videoContainer = jQuery( '<div>', { class: classes.videoContainer + ' ' + classes.invisible } ),
			$videoWrapper = jQuery( '<div>', { class: classes.videoWrapper } ),
			$playIcon = $activeSlide.children( '.' + classes.playButton );

		let videoType, apiProvider;

		$videoContainer.append( $videoWrapper );

		$activeSlide.append( $videoContainer );

		if ( -1 !== videoURL.indexOf( 'vimeo.com' ) ) {
			videoType = 'vimeo';
			apiProvider = elementorFrontend.utils.vimeo;
		} else if ( videoURL.match( /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com)/ ) ) {
			videoType = 'youtube';
			apiProvider = elementorFrontend.utils.youtube;
		}

		const videoID = apiProvider.getVideoIDFromURL( videoURL );

		apiProvider.onApiReady( ( apiObject ) => {
			if ( 'youtube' === videoType ) {
				this.prepareYTVideo( apiObject, videoID, $videoContainer, $videoWrapper, $playIcon );
			} else if ( 'vimeo' === videoType ) {
				this.prepareVimeoVideo( apiObject, videoID, $videoContainer, $videoWrapper, $playIcon );
			}
		} );

		$playIcon.addClass( classes.playing ).removeClass( classes.hidden );
	},

	prepareYTVideo: function( YT, videoID, $videoContainer, $videoWrapper, $playIcon ) {
		const classes = this.getSettings( 'classes' ),
			$videoPlaceholderElement = jQuery( '<div>' );
		let startStateCode = YT.PlayerState.PLAYING;

		$videoWrapper.append( $videoPlaceholderElement );

		// Since version 67, Chrome doesn't fire the `PLAYING` state at start time
		if ( window.chrome ) {
			startStateCode = YT.PlayerState.UNSTARTED;
		}

		$videoContainer.addClass( 'elementor-loading' + ' ' + classes.invisible );

		this.player = new YT.Player( $videoPlaceholderElement[ 0 ], {
			videoId: videoID,
			events: {
				onReady: () => {
					$playIcon.addClass( classes.hidden );

					$videoContainer.removeClass( classes.invisible );

					this.player.playVideo();
				},
				onStateChange: ( event ) => {
					if ( event.data === startStateCode ) {
						$videoContainer.removeClass( 'elementor-loading' + ' ' + classes.invisible );
					}
				},
			},
			playerVars: {
				controls: 0,
				rel: 0,
			},
		} );
	},

	prepareVimeoVideo: function( Vimeo, videoId, $videoContainer, $videoWrapper, $playIcon ) {
		const classes = this.getSettings( 'classes' ),
			vimeoOptions = {
				id: videoId,
				autoplay: true,
				transparent: false,
				playsinline: false,
			};

		this.player = new Vimeo.Player( $videoWrapper, vimeoOptions );

		this.player.ready().then( () => {
			$playIcon.addClass( classes.hidden );

			$videoContainer.removeClass( classes.invisible );
		} );
	},

	setEntranceAnimation: function( animation ) {
		animation = animation || elementorFrontend.getCurrentDeviceSetting( this.getSettings( 'modalOptions' ), 'entranceAnimation' );

		var $widgetMessage = this.getModal().getElements( 'message' );

		if ( this.oldAnimation ) {
			$widgetMessage.removeClass( this.oldAnimation );
		}

		this.oldAnimation = animation;

		if ( animation ) {
			$widgetMessage.addClass( 'animated ' + animation );
		}
	},

	isLightboxLink: function( element ) {
		if ( 'A' === element.tagName && ( element.hasAttribute( 'download' ) || ! /\.(png|jpe?g|gif|svg)(\?.*)?$/i.test( element.href ) ) ) {
			return false;
		}

		var generalOpenInLightbox = elementorFrontend.getGeneralSettings( 'elementor_global_image_lightbox' ),
			currentLinkOpenInLightbox = element.dataset.elementorOpenLightbox;

		return 'yes' === currentLinkOpenInLightbox || ( generalOpenInLightbox && 'no' !== currentLinkOpenInLightbox );
	},

	openLink: function( event ) {
		var element = event.currentTarget,
			$target = jQuery( event.target ),
			editMode = elementorFrontend.isEditMode(),
			isClickInsideElementor = ! ! $target.closest( '#elementor' ).length;

		if ( ! this.isLightboxLink( element ) ) {
			if ( editMode && isClickInsideElementor ) {
				event.preventDefault();
			}

			return;
		}

		event.preventDefault();

		if ( editMode && ! elementor.getPreferences( 'lightbox_in_editor' ) ) {
			return;
		}

		var lightboxData = {};

		if ( element.dataset.elementorLightbox ) {
			lightboxData = JSON.parse( element.dataset.elementorLightbox );
		}

		if ( lightboxData.type && 'slideshow' !== lightboxData.type ) {
			this.showModal( lightboxData );

			return;
		}

		if ( ! element.dataset.elementorLightboxSlideshow ) {
			this.showModal( {
				type: 'image',
				url: element.href,
			} );

			return;
		}

		var slideshowID = element.dataset.elementorLightboxSlideshow;

		var $allSlideshowLinks = jQuery( this.getSettings( 'selectors.links' ) ).filter( function() {
			const $this = jQuery( this );

			return slideshowID === this.dataset.elementorLightboxSlideshow && ! $this.parent( '.swiper-slide-duplicate' ).length && ! $this.parents( '.slick-cloned' ).length;
		} );

		const slides = [];

		$allSlideshowLinks.each( function() {
			const slideVideo = this.dataset.elementorLightboxVideo;

			let slideIndex = this.dataset.elementorLightboxIndex;

			if ( undefined === slideIndex ) {
				slideIndex = $allSlideshowLinks.index( this );
			}

			var slideData = {
				image: this.href,
				index: slideIndex,
				title: jQuery( this ).data( 'elementor-lightbox-title' ),
				description: jQuery( this ).data( 'elementor-lightbox-description' ),
			};

			if ( slideVideo ) {
				slideData.video = slideVideo;
			}

			slides.push( slideData );
		} );

		slides.sort( function( a, b ) {
			return a.index - b.index;
		} );

		var initialSlide = element.dataset.elementorLightboxIndex;

		if ( undefined === initialSlide ) {
			initialSlide = $allSlideshowLinks.index( element );
		}

		this.showModal( {
			type: 'slideshow',
			modalOptions: {
				id: 'elementor-lightbox-slideshow-' + slideshowID,
			},
			slideshow: {
				slides: slides,
				swiper: {
					initialSlide: +initialSlide,
				},
			},
		} );
	},

	bindEvents: function() {
		elementorFrontend.elements.$document.on( 'click', this.getSettings( 'selectors.links' ), this.openLink );
	},

	onSlideChange: function() {
		this
			.getSlide( 'prev' )
			.add( this.getSlide( 'next' ) )
			.add( this.getSlide( 'active' ) )
			.find( '.' + this.getSettings( 'classes.videoWrapper' ) )
			.remove();

		this.playSlideVideo();
		this.updateFooterText();
	},
} );
