<?php

return array(
	'shortcode_in_paragraph' => array(
		'input_html'               => '<p>Before [gallery ids="1,2"] After</p>',
		'description'              => 'Extract shortcodes found inline and preserve surrounding text.',
		'expected_tokenized_html'  => '<p>Before %TTE_SC_0% After</p>',
		'expected_shortcode_map'   => array(
			'%TTE_SC_0%' => '[gallery ids="1,2"]',
		),
		'expected_normalized_html' => '<p>Before %TTE_SC_0% After</p>',
	),
	'nested_shortcode_content' => array(
		'input_html'               => '<div>[caption id="attachment_7"]<img src="x.jpg" />[/caption]</div>',
		'description'              => 'Capture enclosing shortcode pairs as atomic tokens.',
		'expected_tokenized_html'  => '<div>%TTE_SC_0%</div>',
		'expected_shortcode_map'   => array(
			'%TTE_SC_0%' => '[caption id="attachment_7"]<img src="x.jpg" />[/caption]',
		),
		'expected_normalized_html' => '<div>%TTE_SC_0%</div>',
	),
	'read_more_marker' => array(
		'input_html'               => "<p>Intro</p>\n\n<p><br /></p>\n<!--more-->\n\n<p>Body</p>",
		'description'              => 'Keep read-more marker intact while removing wpautop empty paragraph artifacts.',
		'expected_tokenized_html'  => "<p>Intro</p>\n\n<p><br /></p>\n<!--more-->\n\n<p>Body</p>",
		'expected_shortcode_map'   => array(),
		'expected_normalized_html' => "<p>Intro</p>\n<!--more-->\n\n<p>Body</p>",
	),
	'raw_html_block' => array(
		'input_html'               => '<p><div class="custom"><script>window.x=1;</script></div></p>',
		'description'              => 'Do not strip arbitrary HTML blocks and normalize wrapped block tags.',
		'expected_tokenized_html'  => '<p><div class="custom"><script>window.x=1;</script></div></p>',
		'expected_shortcode_map'   => array(),
		'expected_normalized_html' => '<div class="custom"><script>window.x=1;</script></div>',
	),
);
