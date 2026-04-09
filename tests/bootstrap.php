<?php
/**
 * PHPUnit bootstrap for TipTap Editor tests.
 *
 * Loads the WordPress test suite and the plugin.
 *
 * @package TiptapEditor
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php — run bin/install-wp-tests.sh first." . PHP_EOL;
	exit( 1 );
}

// Give access to tests_add_filter().
require_once "{$_tests_dir}/includes/functions.php";

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin(): void {
	require dirname( __DIR__ ) . '/tiptap-editor.php';
}

tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require "{$_tests_dir}/includes/bootstrap.php";
