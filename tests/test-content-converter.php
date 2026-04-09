<?php
/**
 * Tests for Tiptap_Editor_Content_Converter.
 *
 * Covers shortcode extraction, round-trip fidelity, and wpautop normalisation
 * across a broad set of real-world post_content fixtures.
 *
 * The converter test suite is the most important test in the plugin.
 * Content corruption is a critical failure — these tests are the safety net.
 *
 * @package TiptapEditor
 */

/**
 * Tests for the content conversion pipeline.
 */
class Test_Content_Converter extends WP_UnitTestCase {

	/**
	 * Converter under test.
	 *
	 * @var Tiptap_Editor_Content_Converter
	 */
	private Tiptap_Editor_Content_Converter $converter;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->converter = new Tiptap_Editor_Content_Converter();
	}

	// =========================================================================
	// prepare_for_editor — shortcode extraction
	// =========================================================================

	/**
	 * Empty string passes through unchanged.
	 */
	public function test_prepare_empty_string(): void {
		$result = $this->converter->prepare_for_editor( '' );
		$this->assertSame( '', $result['html'] );
		$this->assertSame( [], $result['shortcodes'] );
	}

	/**
	 * Plain prose with no shortcodes is returned unchanged.
	 */
	public function test_prepare_plain_prose(): void {
		$html = '<p>Hello world. This is a test paragraph.</p><p>Second paragraph here.</p>';
		$result = $this->converter->prepare_for_editor( $html );
		$this->assertSame( $html, $result['html'] );
		$this->assertSame( [], $result['shortcodes'] );
	}

	/**
	 * A single shortcode is extracted and replaced with a token.
	 */
	public function test_prepare_single_shortcode(): void {
		// Register a test shortcode.
		add_shortcode( 'test_sc', static fn() => '<b>test</b>' );

		$html   = '<p>Before</p>[test_sc]<p>After</p>';
		$result = $this->converter->prepare_for_editor( $html );

		$this->assertStringContainsString( '<!--tiptap-sc-0-->', $result['html'] );
		$this->assertStringNotContainsString( '[test_sc]', $result['html'] );
		$this->assertSame( '[test_sc]', $result['shortcodes'][0] );

		remove_shortcode( 'test_sc' );
	}

	/**
	 * Multiple shortcodes are each extracted to separate indexed tokens.
	 */
	public function test_prepare_multiple_shortcodes(): void {
		add_shortcode( 'foo', static fn() => 'foo' );
		add_shortcode( 'bar', static fn() => 'bar' );

		$html   = '<p>[foo] and [bar]</p>';
		$result = $this->converter->prepare_for_editor( $html );

		$this->assertArrayHasKey( 0, $result['shortcodes'] );
		$this->assertArrayHasKey( 1, $result['shortcodes'] );
		$this->assertStringContainsString( '<!--tiptap-sc-0-->', $result['html'] );
		$this->assertStringContainsString( '<!--tiptap-sc-1-->', $result['html'] );

		remove_shortcode( 'foo' );
		remove_shortcode( 'bar' );
	}

	/**
	 * Shortcode with attributes is preserved verbatim.
	 */
	public function test_prepare_shortcode_with_attributes(): void {
		add_shortcode( 'gallery', static fn() => '' );

		$original = '[gallery ids="1,2,3" columns="3"]';
		$html     = '<p>Before</p>' . $original . '<p>After</p>';
		$result   = $this->converter->prepare_for_editor( $html );

		$this->assertSame( $original, $result['shortcodes'][0] );

		remove_shortcode( 'gallery' );
	}

	/**
	 * Shortcode with inner content (enclosing shortcode) is preserved verbatim.
	 */
	public function test_prepare_enclosing_shortcode(): void {
		add_shortcode( 'caption', static fn() => '' );

		$original = '[caption id="attachment_1" align="alignnone" width="300"]<img src="test.jpg"> A caption[/caption]';
		$html     = '<p>' . $original . '</p>';
		$result   = $this->converter->prepare_for_editor( $html );

		$this->assertSame( $original, $result['shortcodes'][0] );

		remove_shortcode( 'caption' );
	}

	/**
	 * Content with <!--more--> is passed through unchanged (not a shortcode).
	 */
	public function test_prepare_more_divider_preserved(): void {
		$html   = '<p>Intro</p><!--more--><p>Rest</p>';
		$result = $this->converter->prepare_for_editor( $html );

		$this->assertStringContainsString( '<!--more-->', $result['html'] );
		$this->assertSame( [], $result['shortcodes'] );
	}

	/**
	 * Raw HTML blocks with Gutenberg comments are passed through unchanged.
	 */
	public function test_prepare_gutenberg_block_comments_preserved(): void {
		$html = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
		$result = $this->converter->prepare_for_editor( $html );

		$this->assertStringContainsString( '<!-- wp:paragraph -->', $result['html'] );
	}

	// =========================================================================
	// restore_shortcodes
	// =========================================================================

	/**
	 * Tokens are replaced with original shortcode strings.
	 */
	public function test_restore_single_shortcode(): void {
		$html       = '<p>Before</p><!--tiptap-sc-0--><p>After</p>';
		$shortcodes = [ 0 => '[gallery]' ];
		$result     = $this->converter->restore_shortcodes( $html, $shortcodes );

		$this->assertSame( '<p>Before</p>[gallery]<p>After</p>', $result );
	}

	/**
	 * Multiple tokens are restored in order.
	 */
	public function test_restore_multiple_shortcodes(): void {
		$html       = '<!--tiptap-sc-0--> and <!--tiptap-sc-1-->';
		$shortcodes = [ 0 => '[foo]', 1 => '[bar attr="x"]' ];
		$result     = $this->converter->restore_shortcodes( $html, $shortcodes );

		$this->assertSame( '[foo] and [bar attr="x"]', $result );
	}

	/**
	 * Shortcode with special characters (quotes, slashes) is preserved verbatim.
	 */
	public function test_restore_preserves_special_characters(): void {
		$original   = '[caption id="attachment_1" align="alignnone" width="300"]<img src="test.jpg">[/caption]';
		$html       = '<!--tiptap-sc-0-->';
		$shortcodes = [ 0 => $original ];
		$result     = $this->converter->restore_shortcodes( $html, $shortcodes );

		$this->assertSame( $original, $result );
	}

	/**
	 * Restoring with an empty map returns the HTML unchanged.
	 */
	public function test_restore_empty_map(): void {
		$html   = '<p>No tokens here</p>';
		$result = $this->converter->restore_shortcodes( $html, [] );
		$this->assertSame( $html, $result );
	}

	// =========================================================================
	// Round-trip: prepare → restore
	// =========================================================================

	/**
	 * prepare → restore round-trip produces the original HTML.
	 */
	public function test_roundtrip_single_shortcode(): void {
		add_shortcode( 'test_rt', static fn() => '' );

		$original = '<p>Text before</p>[test_rt id="5"]<p>Text after</p>';
		$prepared = $this->converter->prepare_for_editor( $original );
		$restored = $this->converter->restore_shortcodes( $prepared['html'], $prepared['shortcodes'] );

		$this->assertSame( $original, $restored );

		remove_shortcode( 'test_rt' );
	}

	/**
	 * Round-trip with multiple shortcodes.
	 */
	public function test_roundtrip_multiple_shortcodes(): void {
		add_shortcode( 'alpha', static fn() => '' );
		add_shortcode( 'beta', static fn() => '' );

		$original = '[alpha x="1"]<p>Middle</p>[beta y="2"]';
		$prepared = $this->converter->prepare_for_editor( $original );
		$restored = $this->converter->restore_shortcodes( $prepared['html'], $prepared['shortcodes'] );

		$this->assertSame( $original, $restored );

		remove_shortcode( 'alpha' );
		remove_shortcode( 'beta' );
	}

	/**
	 * Round-trip with no shortcodes (plain HTML).
	 */
	public function test_roundtrip_plain_html(): void {
		$original = '<h2>Title</h2><p>Paragraph <strong>bold</strong> text.</p><ul><li>Item</li></ul>';
		$prepared = $this->converter->prepare_for_editor( $original );
		$restored = $this->converter->restore_shortcodes( $prepared['html'], $prepared['shortcodes'] );

		$this->assertSame( $original, $restored );
	}

	// =========================================================================
	// normalise_wpautop
	// =========================================================================

	/**
	 * Trailing <br> before closing </p> is stripped.
	 */
	public function test_normalise_strips_trailing_br_before_p(): void {
		$html   = '<p>Text<br></p>';
		$result = $this->converter->normalise_wpautop( $html );
		$this->assertSame( '<p>Text</p>', $result );
	}

	/**
	 * Self-closing <br /> before closing </p> is stripped.
	 */
	public function test_normalise_strips_self_closing_br_before_p(): void {
		$html   = '<p>Text<br /></p>';
		$result = $this->converter->normalise_wpautop( $html );
		$this->assertSame( '<p>Text</p>', $result );
	}

	/**
	 * Standalone <br> between block elements is stripped.
	 */
	public function test_normalise_strips_br_between_blocks(): void {
		$html   = '</p><br><p>';
		$result = $this->converter->normalise_wpautop( $html );
		$this->assertStringNotContainsString( '<br>', $result );
	}

	/**
	 * Content with no wpautop artifacts passes through unchanged.
	 */
	public function test_normalise_leaves_clean_html_unchanged(): void {
		$html   = '<p>Clean paragraph.</p><p>Second paragraph.</p>';
		$result = $this->converter->normalise_wpautop( $html );
		$this->assertSame( $html, $result );
	}

	// =========================================================================
	// validate_round_trip
	// =========================================================================

	/**
	 * Identical inputs returns true.
	 */
	public function test_validate_identical_returns_true(): void {
		$html = '<p>Hello world</p>';
		$this->assertTrue( $this->converter->validate_round_trip( $html, $html ) );
	}

	/**
	 * Semantically different inputs returns false and logs a transient.
	 */
	public function test_validate_different_returns_false(): void {
		$original = '<p>Original content</p>';
		$result   = '<p>Changed content</p>';

		$valid = $this->converter->validate_round_trip( $original, $result );
		$this->assertFalse( $valid );

		// Verify transient was set.
		$transient = get_transient( 'tiptap_conversion_diff_' . md5( $original ) );
		$this->assertIsArray( $transient );
		$this->assertArrayHasKey( 'original', $transient );
		$this->assertArrayHasKey( 'result', $transient );
	}

	/**
	 * Whitespace-only differences are ignored (normalised away).
	 */
	public function test_validate_whitespace_differences_ignored(): void {
		$original = '<p>Hello</p>   <p>World</p>';
		$result   = '<p>Hello</p><p>World</p>';

		$this->assertTrue( $this->converter->validate_round_trip( $original, $result ) );
	}

	// =========================================================================
	// Fixture-based round-trip tests (real-world post_content samples)
	// =========================================================================

	/**
	 * Data provider: real-world post_content HTML samples.
	 *
	 * Each entry: [ 'label' => string, 'html' => string, 'shortcodes' => string[] ]
	 *
	 * @return array<int, array{string, string, string[]}>
	 */
	public function fixture_provider(): array {
		return [
			// 01. Empty content.
			[ 'Empty content', '', [] ],

			// 02. Single plain paragraph.
			[ 'Single paragraph', '<p>Hello world.</p>', [] ],

			// 03. Multiple paragraphs.
			[ 'Multiple paragraphs', '<p>First.</p><p>Second.</p><p>Third.</p>', [] ],

			// 04. Heading + paragraph.
			[ 'Heading + paragraph', '<h2>Title</h2><p>Body text.</p>', [] ],

			// 05. Bold and italic inline.
			[ 'Inline formatting', '<p>This has <strong>bold</strong> and <em>italic</em> text.</p>', [] ],

			// 06. Unordered list.
			[ 'Unordered list', '<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>', [] ],

			// 07. Ordered list.
			[ 'Ordered list', '<ol><li>First</li><li>Second</li><li>Third</li></ol>', [] ],

			// 08. Blockquote.
			[ 'Blockquote', '<blockquote><p>A notable quote.</p></blockquote>', [] ],

			// 09. Code block.
			[ 'Code block', '<pre><code>echo "Hello";</code></pre>', [] ],

			// 10. Horizontal rule.
			[ 'Horizontal rule', '<p>Before</p><hr><p>After</p>', [] ],

			// 11. Link.
			[ 'Hyperlink', '<p><a href="https://example.com">Link text</a></p>', [] ],

			// 12. Image.
			[ 'Image', '<p><img src="photo.jpg" alt="A photo" class="wp-image-42"></p>', [] ],

			// 13. <!--more--> divider.
			[ '<!--more--> divider', '<p>Intro</p><!--more--><p>Rest of content</p>', [] ],

			// 14. <!--more--> with custom text.
			[ '<!--more--> custom text', '<p>Intro</p><!--more Read more--><p>Rest</p>', [] ],

			// 15. Single gallery shortcode.
			[ 'Gallery shortcode', '<p>See the gallery:</p>[gallery ids="1,2,3"]<p>End</p>', [ 'gallery' ] ],

			// 16. Caption shortcode with image.
			[ 'Caption shortcode', '[caption id="attachment_1" align="alignnone" width="300"]<img src="a.jpg" class="wp-image-1"> Caption text[/caption]', [ 'caption' ] ],

			// 17. Contact form shortcode.
			[ 'Contact form shortcode', '<p>Contact us:</p>[contact-form-7 id="123" title="Contact form"]', [ 'contact-form-7' ] ],

			// 18. Multiple shortcodes in sequence.
			[ 'Multiple sequential shortcodes', '[gallery ids="1"]<p>Text</p>[caption id="a_1" align="alignnone" width="100"]img[/caption]', [ 'gallery', 'caption' ] ],

			// 19. Shortcode with complex attributes.
			[ 'Shortcode complex attributes', '[product_table id="5" columns="name,price,buy" sort="name"]', [ 'product_table' ] ],

			// 20. Gutenberg paragraph block comment.
			[ 'Gutenberg paragraph block', '<!-- wp:paragraph --><p>Block content</p><!-- /wp:paragraph -->', [] ],

			// 21. Gutenberg image block comment.
			[ 'Gutenberg image block', '<!-- wp:image {"id":1} --><figure class="wp-block-image"><img src="img.jpg" alt=""/></figure><!-- /wp:image -->', [] ],

			// 22. Mixed Gutenberg + classic content.
			[ 'Mixed Gutenberg + classic', '<!-- wp:paragraph --><p>Block</p><!-- /wp:paragraph --><p>Classic</p>', [] ],

			// 23. Nested HTML elements.
			[ 'Nested elements', '<div class="wp-caption"><img src="a.jpg"><p class="wp-caption-text">Caption</p></div>', [] ],

			// 24. Table.
			[ 'Table', '<table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>D1</td><td>D2</td></tr></tbody></table>', [] ],

			// 25. Heading levels H1–H4.
			[ 'Heading levels', '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4>', [] ],

			// 26. Strikethrough and underline.
			[ 'Strikethrough underline', '<p><s>Deleted</s> and <u>underlined</u> text</p>', [] ],

			// 27. Link with target and rel.
			[ 'Link target rel', '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a></p>', [] ],

			// 28. Content with HTML entities.
			[ 'HTML entities', '<p>Copyright &copy; 2024 &amp; beyond &mdash; all rights reserved.</p>', [] ],

			// 29. Content with special characters.
			[ 'Special characters', '<p>Price: $99.99 &lt;sale&gt; "quoted" \'apostrophe\'</p>', [] ],

			// 30. Shortcode between paragraphs.
			[ 'Shortcode between paragraphs', '<p>First paragraph.</p>[divider style="dashed"]<p>Second paragraph.</p>', [ 'divider' ] ],

			// 31. Multi-line paragraph.
			[ 'Multi-line paragraph', '<p>Line one.' . "\n" . 'Line two.' . "\n" . 'Line three.</p>', [] ],

			// 32. Nested list.
			[ 'Nested list', '<ul><li>Parent<ul><li>Child one</li><li>Child two</li></ul></li><li>Sibling</li></ul>', [] ],

			// 33. Figure with figcaption.
			[ 'Figure figcaption', '<figure><img src="photo.jpg" alt=""><figcaption>Caption text</figcaption></figure>', [] ],

			// 34. Inline code.
			[ 'Inline code', '<p>Use <code>echo()</code> to print output.</p>', [] ],

			// 35. Pre-formatted text.
			[ 'Preformatted text', '<pre>function hello() {' . "\n" . '    echo "hi";' . "\n" . '}</pre>', [] ],

			// 36. Long content with multiple elements.
			[ 'Long mixed content', '<h2>Section</h2><p>Paragraph one.</p><p>Paragraph two.</p><ul><li>A</li><li>B</li></ul><p>End.</p>', [] ],

			// 37. Empty paragraph (common in WP classic editor).
			[ 'Empty paragraph', '<p>&nbsp;</p>', [] ],

			// 38. Shortcode as first element.
			[ 'Shortcode first', '[banner type="hero"]<p>Content below banner</p>', [ 'banner' ] ],

			// 39. Shortcode as last element.
			[ 'Shortcode last', '<p>Content above footer</p>[footer_links]', [ 'footer_links' ] ],

			// 40. Shortcode only (no surrounding HTML).
			[ 'Shortcode only', '[simple_shortcode]', [ 'simple_shortcode' ] ],

			// 41. Multiple paragraphs with <!--more-->.
			[ 'Multiple paragraphs more', '<p>Para 1</p><p>Para 2</p><!--more--><p>Para 3</p><p>Para 4</p>', [] ],

			// 42. Blockquote with cite.
			[ 'Blockquote with cite', '<blockquote cite="https://source.com"><p>Quote text.</p></blockquote>', [] ],

			// 43. Definition list.
			[ 'Definition list', '<dl><dt>Term</dt><dd>Definition</dd></dl>', [] ],

			// 44. Content with data attributes.
			[ 'Data attributes', '<p data-custom="value" class="highlight">Paragraph with data attr.</p>', [] ],

			// 45. Shortcode with no attributes.
			[ 'Shortcode no attributes', '<p>Before</p>[spacer]<p>After</p>', [ 'spacer' ] ],

			// 46. Adjacent shortcodes.
			[ 'Adjacent shortcodes', '[sc_one][sc_two][sc_three]', [ 'sc_one', 'sc_two', 'sc_three' ] ],

			// 47. Shortcode inside paragraph (inline usage).
			[ 'Inline shortcode', '<p>Click [button text="here"] to continue.</p>', [ 'button' ] ],

			// 48. Content starting with heading.
			[ 'Content starts with heading', '<h1>Main Title</h1><p>Introduction paragraph.</p>', [] ],

			// 49. Mixed inline elements.
			[ 'Mixed inline', '<p><strong>Bold</strong>, <em>italic</em>, <code>code</code>, <a href="#">link</a>.</p>', [] ],

			// 50. WP Classic Editor wpautop artifact.
			[ 'wpautop artifact', '<p>Text</p>' . "\n\n" . '<p>More text</p>', [] ],
		];
	}

	/**
	 * For each fixture, prepare → restore must return the original HTML.
	 *
	 * @dataProvider fixture_provider
	 *
	 * @param string   $label      Human-readable fixture name.
	 * @param string   $html       Original post_content.
	 * @param string[] $shortcodes Shortcodes to register for this test.
	 */
	public function test_roundtrip_fixture( string $label, string $html, array $shortcodes ): void {
		// Register any shortcodes needed by this fixture.
		foreach ( $shortcodes as $tag ) {
			if ( ! shortcode_exists( $tag ) ) {
				add_shortcode( $tag, static fn() => '' );
			}
		}

		$prepared = $this->converter->prepare_for_editor( $html );
		$restored = $this->converter->restore_shortcodes( $prepared['html'], $prepared['shortcodes'] );

		$this->assertSame(
			$html,
			$restored,
			"Round-trip failed for fixture: {$label}"
		);

		// Clean up registered shortcodes.
		foreach ( $shortcodes as $tag ) {
			remove_shortcode( $tag );
		}
	}

	/**
	 * After prepare, no shortcode tokens remain in the extracted map — they're all in the HTML.
	 */
	public function test_prepare_shortcode_count_matches_tokens(): void {
		add_shortcode( 'a_sc', static fn() => '' );
		add_shortcode( 'b_sc', static fn() => '' );
		add_shortcode( 'c_sc', static fn() => '' );

		$html   = '[a_sc][b_sc][c_sc]';
		$result = $this->converter->prepare_for_editor( $html );

		$this->assertCount( 3, $result['shortcodes'] );

		foreach ( array_keys( $result['shortcodes'] ) as $index ) {
			$this->assertStringContainsString(
				'<!--tiptap-sc-' . $index . '-->',
				$result['html']
			);
		}

		remove_shortcode( 'a_sc' );
		remove_shortcode( 'b_sc' );
		remove_shortcode( 'c_sc' );
	}
}
