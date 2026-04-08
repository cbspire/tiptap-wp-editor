<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../includes/class-content-converter.php';

/**
 * Phase 1: Fixtures-first tests for the conversion pipeline.
 */
class Test_Content_Converter extends TestCase {
	/**
	 * @return array<string,array<string,mixed>>
	 */
	public function fixture_provider(): array {
		/** @var array<string,array<string,mixed>> $fixtures */
		$fixtures = require __DIR__ . '/fixtures/content-converter.php';

		return $fixtures;
	}

	/**
	 * @dataProvider fixture_provider
	 *
	 * @param array<string,mixed> $fixture Fixture payload.
	 */
	public function test_fixture_contract_is_valid( array $fixture ): void {
		$this->assertArrayHasKey( 'input_html', $fixture );
		$this->assertArrayHasKey( 'description', $fixture );
		$this->assertArrayHasKey( 'expected_tokenized_html', $fixture );
		$this->assertArrayHasKey( 'expected_shortcode_map', $fixture );
		$this->assertArrayHasKey( 'expected_normalized_html', $fixture );
		$this->assertIsString( $fixture['input_html'] );
		$this->assertIsString( $fixture['description'] );
		$this->assertIsString( $fixture['expected_tokenized_html'] );
		$this->assertIsArray( $fixture['expected_shortcode_map'] );
		$this->assertIsString( $fixture['expected_normalized_html'] );
	}

	/**
	 * @dataProvider fixture_provider
	 *
	 * @param array<string,mixed> $fixture Fixture payload.
	 */
	public function test_extract_shortcodes_matches_fixture( array $fixture ): void {
		$actual = Tiptap_Editor_Content_Converter::extract_shortcodes( $fixture['input_html'] );

		$this->assertSame( $fixture['expected_tokenized_html'], $actual['tokenized_html'] );
		$this->assertSame( $fixture['expected_shortcode_map'], $actual['shortcode_map'] );
	}

	/**
	 * @dataProvider fixture_provider
	 *
	 * @param array<string,mixed> $fixture Fixture payload.
	 */
	public function test_normalize_wpautop_artifacts_matches_fixture( array $fixture ): void {
		$normalized = Tiptap_Editor_Content_Converter::normalize_wpautop_artifacts( $fixture['expected_tokenized_html'] );

		$this->assertSame( $fixture['expected_normalized_html'], $normalized );
	}

	/**
	 * @dataProvider fixture_provider
	 *
	 * @param array<string,mixed> $fixture Fixture payload.
	 */
	public function test_reinject_shortcodes_round_trip( array $fixture ): void {
		$normalized = Tiptap_Editor_Content_Converter::normalize_wpautop_artifacts( $fixture['expected_tokenized_html'] );
		$round_trip = Tiptap_Editor_Content_Converter::reinject_shortcodes( $normalized, $fixture['expected_shortcode_map'] );

		foreach ( $fixture['expected_shortcode_map'] as $shortcode ) {
			$this->assertStringContainsString( $shortcode, $round_trip );
		}
	}
}
