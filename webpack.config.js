/**
 * Webpack configuration for TipTap Editor.
 *
 * Extends @wordpress/scripts default config with:
 * - Multiple entry points (editor, settings-legacy, settings-modern)
 * - Output to assets/js/ and assets/css/
 *
 * @wordpress/scripts correctly externalises all @wordpress/* packages
 * so they load from WP core rather than the bundle.
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		editor: path.resolve( __dirname, 'src/editor/index.ts' ),
		'settings-legacy': path.resolve( __dirname, 'src/admin/settings-legacy.tsx' ),
		'settings-modern': path.resolve( __dirname, 'src/admin/settings-modern.tsx' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'assets' ),
		filename: 'js/[name].js',
		// Keep lazy-loaded chunks (toolbar, AI menu) next to the entry bundles.
		chunkFilename: 'js/[name].js',
		// The default config cleans the whole output directory before each
		// build, which would delete the hand-authored CSS in assets/css/.
		clean: {
			keep: /^css\//,
		},
	},
	module: {
		...defaultConfig.module,
		rules: [
			...( defaultConfig.module?.rules ?? [] ),
		],
	},
};
