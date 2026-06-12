/**
 * Standalone demo build.
 *
 * Bundles the editor WITHOUT externalising @wordpress/* packages so the
 * result runs on a plain HTML page with no WordPress install — used for
 * local development (PLAN.md implementation step 4: "build and test on
 * a plain HTML page first, no WP") and for generating the README
 * screenshots.
 *
 * Usage: npx wp-scripts build --config demo/webpack.config.js
 * Output: demo/build/demo.js (gitignored)
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		demo: path.resolve( __dirname, 'entry.ts' ),
	},
	output: {
		path: path.resolve( __dirname, 'build' ),
		filename: '[name].js',
		chunkFilename: '[name].js',
	},
	// Bundle everything — no WP core script handles on a plain page.
	plugins: ( defaultConfig.plugins ?? [] ).filter(
		( plugin ) => plugin.constructor.name !== 'DependencyExtractionWebpackPlugin',
	),
};
