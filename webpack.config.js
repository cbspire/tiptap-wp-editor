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
const rtlcss = require( 'rtlcss' );

/**
 * Emits a "-rtl.css" twin next to every extracted CSS asset.
 *
 * Replaces @wordpress/scripts' RtlCssPlugin, which builds the RTL filename
 * from the chunk name and therefore drops it at the output root instead of
 * next to the LTR file in css/. Co-located -rtl.css files let WordPress's
 * wp_style_add_data( $handle, 'rtl', 'replace' ) pick them up natively.
 */
class CoLocatedRtlCssPlugin {
	apply( compiler ) {
		const { Compilation, sources } = compiler.webpack;
		compiler.hooks.thisCompilation.tap( 'CoLocatedRtlCssPlugin', ( compilation ) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'CoLocatedRtlCssPlugin',
					stage: Compilation.PROCESS_ASSETS_STAGE_DERIVED,
				},
				( assets ) => {
					for ( const filename of Object.keys( assets ) ) {
						if ( ! filename.endsWith( '.css' ) || filename.endsWith( '-rtl.css' ) ) {
							continue;
						}
						compilation.emitAsset(
							filename.replace( /\.css$/, '-rtl.css' ),
							new sources.RawSource(
								rtlcss.process( assets[ filename ].source().toString() )
							)
						);
					}
				}
			);
		} );
	}
}

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
	plugins: [
		...( defaultConfig.plugins ?? [] )
			.filter( ( plugin ) => plugin.constructor.name !== 'RtlCssPlugin' )
			.map( ( plugin ) => {
				// Emit extracted CSS (e.g. bundled @wordpress/dataviews styles)
				// into assets/css/ alongside the hand-authored stylesheets.
				if ( plugin.constructor.name === 'MiniCssExtractPlugin' && plugin.options ) {
					plugin.options.filename = 'css/[name].css';
				}
				// @wordpress/dataviews is bundled (not a core script handle), but
				// its subpaths — like build-style/style.css — are not covered by
				// the extraction plugin's bundled-packages list and would be
				// externalised into a bogus script dependency. Force-bundle them.
				if ( plugin.constructor.name === 'DependencyExtractionWebpackPlugin' && plugin.options ) {
					plugin.options.requestToExternal = ( request ) =>
						request.startsWith( '@wordpress/dataviews/' ) ? false : undefined;
				}
				return plugin;
			} ),
		new CoLocatedRtlCssPlugin(),
	],
	module: {
		...defaultConfig.module,
		rules: [
			...( defaultConfig.module?.rules ?? [] ),
			// @wordpress/dataviews declares `sideEffects: false`, which would
			// tree-shake its bare stylesheet import out of the bundle.
			{
				test: /@wordpress[\\/]dataviews[\\/]build-style[\\/].*\.css$/,
				sideEffects: true,
			},
		],
	},
};
