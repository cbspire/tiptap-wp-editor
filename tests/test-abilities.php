<?php
/**
 * Tests for Tiptap_Editor_Abilities (WP 7.0+ only).
 *
 * These tests are skipped on WP < 7.0 since the Abilities API is not available.
 *
 * @package TiptapEditor
 */

/**
 * Tests for the Abilities API integration.
 */
class Test_Abilities extends WP_UnitTestCase {

	/**
	 * Instance under test.
	 *
	 * @var Tiptap_Editor_Abilities
	 */
	private Tiptap_Editor_Abilities $abilities;

	/**
	 * Set up — skip on WP < 7.0.
	 */
	public function setUp(): void {
		parent::setUp();

		if ( ! Tiptap_Editor_Version_Compat::has_abilities_api() ) {
			$this->markTestSkipped( 'Abilities API requires WP 7.0+.' );
		}

		$this->abilities = new Tiptap_Editor_Abilities();
	}

	/**
	 * Class instantiates without error.
	 */
	public function test_instantiation(): void {
		$this->assertInstanceOf( Tiptap_Editor_Abilities::class, $this->abilities );
	}

	/**
	 * register() does not throw.
	 */
	public function test_register_does_not_throw(): void {
		$this->abilities->register();
		$this->assertTrue( true );
	}

	/**
	 * REST route is registered after register_rest_routes() is called.
	 */
	public function test_rest_route_registered(): void {
		$this->abilities->register_rest_routes();

		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/tiptap-editor/v1/ability', $routes );
	}
}
