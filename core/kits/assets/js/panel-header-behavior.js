import {
	buttonBack,
	buttonClose,
} from './panel-header-buttons';

export default class extends Marionette.Behavior {
	ui() {
		return {
			buttonClose: '#elementor-panel-header-kit-close',
			buttonBack: '#elementor-panel-header-kit-back',
		};
	}

	events() {
		return {
			'click @ui.buttonClose': 'onClickClose',
			'click @ui.buttonBack': 'onClickBack',
		};
	}

	onBeforeShow() {
		this.$el.prepend( elementor.compileTemplate( buttonBack, { Back: __( 'Back', 'elementor' ) } ) );
		this.$el.append( elementor.compileTemplate( buttonClose, { Close: __( 'Close', 'elementor' ) } ) );
	}

	onClickClose() {
		$e.run( 'panel/global/close' );
	}

	onClickBack() {
		$e.run( 'panel/global/back' );
		_replaceParam( 'active_tab', '' );
	}
}

function _replaceParam( key, value ) {
	const url = new URL( window.location.href );

	if ( value ) {
		url.searchParams.set( key, value );
	} else {
		url.searchParams.delete( key );
	}

	history.pushState( null, '', url.toString() );
}
