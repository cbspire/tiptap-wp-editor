<?php
/**
 * Plugin Orchestrator.
 *
 * Singleton that wires up all plugin components. This is the only
 * class in the plugin that uses the singleton pattern.
 *
 * @package TiptapEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin orchestrator. Bootstraps all subsystems on the 'init' hook.
 */
class Tiptap_Editor_Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Tiptap_Editor_Plugin|null
	 */
	private static ?Tiptap_Editor_Plugin $instance = null;

	/**
	 * Returns the singleton instance, creating it if necessary.
	 */
	public static function get_instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->setup_hooks();
		}
		return self::$instance;
	}

	/**
	 * Private constructor — use get_instance().
	 */
	private function __construct() {}

	/**
	 * Register WordPress hooks.
	 */
	private function setup_hooks(): void {
		add_action( 'init', [ $this, 'init' ] );
	}

	/**
	 * Initialise all plugin components.
	 *
	 * Called on the 'init' hook. Components are registered in dependency order.
	 * Version-gated components are only instantiated when their requirements
	 * are met — checked via Tiptap_Editor_Version_Compat.
	 */
	public function init(): void {
		// Core components — all WP versions.
		( new Tiptap_Editor_Editor_Registration() )->register();
		( new Tiptap_Editor_Meta_Box() )->register();
		( new Tiptap_Editor_Admin_UI() )->register();
		( new Tiptap_Editor_Assets() )->register();

		// Abilities API — WP 7.0+ only.
		if ( Tiptap_Editor_Version_Compat::has_abilities_api() ) {
			( new Tiptap_Editor_Abilities() )->register();
		}
	}
}
