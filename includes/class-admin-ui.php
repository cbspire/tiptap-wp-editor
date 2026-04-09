<?php
/**
 * Admin UI Router.
 *
 * Delegates to the legacy or modern settings page implementation
 * based on the current WP version. The rest of the plugin never
 * needs to know which implementation is active.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Routes to the correct admin UI implementation for the current WP version.
 */
class Tiptap_Editor_Admin_UI {

	/**
	 * The active implementation (legacy or modern).
	 *
	 * @var Tiptap_Editor_Admin_UI_Legacy|Tiptap_Editor_Admin_UI_Modern
	 */
	private Tiptap_Editor_Admin_UI_Legacy|Tiptap_Editor_Admin_UI_Modern $impl;

	/**
	 * Constructor. Selects the correct implementation.
	 */
	public function __construct() {
		if ( Tiptap_Editor_Version_Compat::admin_ui_tier() === 'modern' ) {
			$this->impl = new Tiptap_Editor_Admin_UI_Modern();
		} else {
			$this->impl = new Tiptap_Editor_Admin_UI_Legacy();
		}
	}

	/**
	 * Register WordPress hooks by delegating to the active implementation.
	 */
	public function register(): void {
		$this->impl->register();
	}
}
