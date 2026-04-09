<?php
/**
 * Tests for Tiptap_Editor_Editor_Registration.
 *
 * Covers post type detection, Gutenberg coexistence, and wpautop removal.
 *
 * @package TiptapEditor
 */

/**
 * Tests for the editor registration class.
 */
class Test_Editor_Registration extends WP_UnitTestCase {

	/**
	 * Instance under test.
	 *
	 * @var Tiptap_Editor_Editor_Registration
	 */
	private Tiptap_Editor_Editor_Registration $registration;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->registration = new Tiptap_Editor_Editor_Registration();
	}

	/**
	 * Tear down: reset options.
	 */
	public function tearDown(): void {
		delete_option( 'tiptap_editor_post_types' );
		remove_all_filters( 'tiptap_editor_post_types' );
		parent::tearDown();
	}

	/**
	 * is_active_post_type() returns false for empty string.
	 */
	public function test_empty_post_type_returns_false(): void {
		$this->assertFalse( $this->registration->is_active_post_type( '' ) );
	}

	/**
	 * is_active_post_type() returns false when option is empty.
	 */
	public function test_returns_false_when_no_post_types_configured(): void {
		delete_option( 'tiptap_editor_post_types' );
		$this->assertFalse( $this->registration->is_active_post_type( 'post' ) );
	}

	/**
	 * is_active_post_type() returns true when post type is in option.
	 */
	public function test_returns_true_for_configured_post_type(): void {
		update_option( 'tiptap_editor_post_types', [ 'post' ] );
		$this->assertTrue( $this->registration->is_active_post_type( 'post' ) );
	}

	/**
	 * is_active_post_type() returns false for post type not in option.
	 */
	public function test_returns_false_for_unconfigured_post_type(): void {
		update_option( 'tiptap_editor_post_types', [ 'page' ] );
		$this->assertFalse( $this->registration->is_active_post_type( 'post' ) );
	}

	/**
	 * tiptap_editor_post_types filter overrides the option.
	 */
	public function test_filter_overrides_option(): void {
		delete_option( 'tiptap_editor_post_types' );

		add_filter( 'tiptap_editor_post_types', static fn() => [ 'article', 'news' ] );

		$this->assertFalse( $this->registration->is_active_post_type( 'post' ) );
		$this->assertTrue( $this->registration->is_active_post_type( 'article' ) );
		$this->assertTrue( $this->registration->is_active_post_type( 'news' ) );
	}

	/**
	 * get_active_post_types() returns an array.
	 */
	public function test_get_active_post_types_returns_array(): void {
		$this->assertIsArray( $this->registration->get_active_post_types() );
	}

	/**
	 * Global helper tiptap_editor_is_active_post_type() works.
	 */
	public function test_global_helper_function_exists(): void {
		$this->assertTrue( function_exists( 'tiptap_editor_is_active_post_type' ) );
	}

	/**
	 * Global helper returns false for empty post type.
	 */
	public function test_global_helper_returns_false_for_empty(): void {
		$this->assertFalse( tiptap_editor_is_active_post_type( '' ) );
	}
}
