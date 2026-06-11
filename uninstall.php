<?php
/**
 * Uninstall: deletes all plugin options and user meta on plugin deletion.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete plugin options.
delete_option( 'tiptap_editor_post_types' );
delete_option( 'tiptap_editor_toolbar_preset' );
delete_option( 'tiptap_editor_version' );

// Delete user meta.
delete_metadata( 'user', 0, 'tiptap_editor_dismissed_notices', '', true );

// Delete any conversion diff transients (pattern-based cleanup).
global $wpdb;
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
		$wpdb->esc_like( '_transient_tiptap_conversion_diff_' ) . '%'
	)
);
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
		$wpdb->esc_like( '_transient_timeout_tiptap_conversion_diff_' ) . '%'
	)
);
