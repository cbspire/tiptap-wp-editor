<?php

define( 'ABSPATH', __DIR__ . '/' );

$GLOBALS['tiptap_test_wp_version']          = '6.8';
$GLOBALS['tiptap_editor_function_overrides'] = array();
$GLOBALS['tiptap_editor_script_registry']    = array();

if ( ! function_exists( 'get_bloginfo' ) ) {
	function get_bloginfo( $show = '' ) {
		if ( 'version' === $show ) {
			return $GLOBALS['tiptap_test_wp_version'];
		}

		return '';
	}
}

if ( ! function_exists( 'wp_script_is' ) ) {
	function wp_script_is( $handle, $list = 'enqueued' ) {
		if ( 'registered' !== $list ) {
			return false;
		}

		return ! empty( $GLOBALS['tiptap_editor_script_registry'][ $handle ] );
	}
}
