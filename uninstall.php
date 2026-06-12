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

// Delete plugin transients: conversion diffs (tiptap_conversion_diff_*) and
// AI rate-limit counters (tiptap_ability_rate_*). Direct queries are required
// here: the keys contain content hashes / user IDs, so they cannot be
// enumerated via the transients API.
global $wpdb;
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
		$wpdb->esc_like( '_transient_tiptap_' ) . '%',
		$wpdb->esc_like( '_transient_timeout_tiptap_' ) . '%'
	)
);
