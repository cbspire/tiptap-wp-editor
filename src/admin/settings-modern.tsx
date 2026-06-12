/**
 * Modern Settings Page (WP 7.0+).
 *
 * React settings app built on @wordpress/dataviews. The DataViews package
 * is bundled into this script (core does not expose it as a registered
 * script handle); @wordpress/components, @wordpress/element, etc. are
 * externalised and resolve to the WP core globals at runtime.
 *
 * Sections:
 *   1. Post Types — DataViews table: search, sort, filter by editor,
 *      single + bulk enable/disable actions.
 *   2. Editor Options — toolbar preset.
 *   3. AI Features — availability status card.
 */

import apiFetch from '@wordpress/api-fetch';
import {
	Card,
	CardBody,
	CardHeader,
	ExternalLink,
	Notice,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { createRoot, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import '@wordpress/dataviews/build-style/style.css';

type ToolbarPreset = 'minimal' | 'standard' | 'full';

interface AvailablePostType {
	slug: string;
	label: string;
	uses_block_editor: boolean;
}

interface SettingsResponse {
	post_types: string[];
	toolbar_preset: ToolbarPreset;
	has_ai_client: boolean;
	has_abilities: boolean;
	available_post_types: AvailablePostType[];
}

/**
 * A row in the DataViews table: a public post type plus its TipTap state.
 */
interface PostTypeItem extends AvailablePostType {
	enabled: boolean;
}

type EditorKind = 'tiptap' | 'block' | 'classic';

function editorKind( item: PostTypeItem ): EditorKind {
	if ( item.uses_block_editor ) {
		return 'block';
	}
	return item.enabled ? 'tiptap' : 'classic';
}

const EDITOR_LABELS: Record< EditorKind, string > = {
	tiptap: __( 'TipTap', 'tiptap-editor' ),
	block: __( 'Block editor', 'tiptap-editor' ),
	classic: __( 'Classic (TinyMCE)', 'tiptap-editor' ),
};

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 10,
	search: '',
	sort: { field: 'label', direction: 'asc' },
	titleField: 'label',
	fields: [ 'slug', 'editor' ],
};

const FIELDS: Field< PostTypeItem >[] = [
	{
		id: 'label',
		label: __( 'Post type', 'tiptap-editor' ),
		enableGlobalSearch: true,
		enableSorting: true,
		getValue: ( { item } ) => item.label,
	},
	{
		id: 'slug',
		label: __( 'Slug', 'tiptap-editor' ),
		enableGlobalSearch: true,
		enableSorting: true,
		getValue: ( { item } ) => item.slug,
		render: ( { item } ) => <code>{ item.slug }</code>,
	},
	{
		id: 'editor',
		label: __( 'Editor', 'tiptap-editor' ),
		enableSorting: true,
		getValue: ( { item } ) => editorKind( item ),
		elements: ( Object.keys( EDITOR_LABELS ) as EditorKind[] ).map( ( value ) => ( {
			value,
			label: EDITOR_LABELS[ value ],
		} ) ),
		render: ( { item } ) => {
			const kind = editorKind( item );
			return (
				<span className={ `tiptap-editor-badge tiptap-editor-badge--${ kind }` }>
					{ EDITOR_LABELS[ kind ] }
				</span>
			);
		},
	},
];

function PostTypesDataView( {
	items,
	onEnable,
	onDisable,
}: {
	items: PostTypeItem[];
	onEnable: ( slugs: string[] ) => void;
	onDisable: ( slugs: string[] ) => void;
} ) {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	const actions = useMemo< Action< PostTypeItem >[] >(
		() => [
			{
				id: 'enable-tiptap',
				label: __( 'Enable TipTap', 'tiptap-editor' ),
				isPrimary: true,
				supportsBulk: true,
				isEligible: ( item ) => ! item.uses_block_editor && ! item.enabled,
				callback: ( selected ) => onEnable( selected.map( ( i ) => i.slug ) ),
			},
			{
				id: 'disable-tiptap',
				label: __( 'Disable TipTap', 'tiptap-editor' ),
				supportsBulk: true,
				isEligible: ( item ) => item.enabled,
				callback: ( selected ) => onDisable( selected.map( ( i ) => i.slug ) ),
			},
		],
		[ onEnable, onDisable ]
	);

	const { data: shownItems, paginationInfo } = useMemo(
		() => filterSortAndPaginate( items, view, FIELDS ),
		[ items, view ]
	);

	return (
		<DataViews< PostTypeItem >
			data={ shownItems }
			fields={ FIELDS }
			view={ view }
			onChangeView={ setView }
			actions={ actions }
			paginationInfo={ paginationInfo }
			getItemId={ ( item ) => item.slug }
			defaultLayouts={ { table: {} } }
		/>
	);
}

function SettingsApp() {
	const [ settings, setSettings ] = useState< SettingsResponse | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ notice, setNotice ] = useState< string | null >( null );

	useEffect( () => {
		apiFetch< SettingsResponse >( { path: '/tiptap-editor/v1/settings' } )
			.then( setSettings )
			.catch( ( err: { message?: string } ) =>
				setError( err.message ?? __( 'Failed to load settings.', 'tiptap-editor' ) )
			);
	}, [] );

	const saveSettings = ( data: { post_types?: string[]; toolbar_preset?: ToolbarPreset } ) => {
		setError( null );
		apiFetch< Partial< SettingsResponse > >( {
			path: '/tiptap-editor/v1/settings',
			method: 'POST',
			data,
		} )
			.then( ( updated ) => {
				setSettings( ( prev ) => ( prev ? { ...prev, ...updated } : prev ) );
				setNotice( __( 'Settings saved.', 'tiptap-editor' ) );
			} )
			.catch( ( err: { message?: string } ) =>
				setError( err.message ?? __( 'Failed to save settings.', 'tiptap-editor' ) )
			);
	};

	if ( error && ! settings ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error }
			</Notice>
		);
	}

	if ( ! settings ) {
		return (
			<div className="tiptap-settings-modern__loading">
				<Spinner />
				<span>{ __( 'Loading settings…', 'tiptap-editor' ) }</span>
			</div>
		);
	}

	const items: PostTypeItem[] = settings.available_post_types.map( ( pt ) => ( {
		...pt,
		enabled: settings.post_types.includes( pt.slug ),
	} ) );

	const enable = ( slugs: string[] ) =>
		saveSettings( {
			post_types: [ ...new Set( [ ...settings.post_types, ...slugs ] ) ],
		} );

	const disable = ( slugs: string[] ) =>
		saveSettings( {
			post_types: settings.post_types.filter( ( s ) => ! slugs.includes( s ) ),
		} );

	const enabledCount = items.filter( ( i ) => i.enabled ).length;

	return (
		<div className="tiptap-settings-modern">
			{ notice && (
				<Notice status="success" onRemove={ () => setNotice( null ) }>
					{ notice }
				</Notice>
			) }
			{ error && (
				<Notice status="error" onRemove={ () => setError( null ) }>
					{ error }
				</Notice>
			) }

			<Card className="tiptap-settings-modern__section">
				<CardHeader>
					<h2>{ __( 'Post types', 'tiptap-editor' ) }</h2>
					<span className="tiptap-settings-modern__count">
						{ sprintf(
							/* translators: %d: number of post types using TipTap. */
							__( '%d using TipTap', 'tiptap-editor' ),
							enabledCount
						) }
					</span>
				</CardHeader>
				<CardBody className="tiptap-settings-modern__dataviews">
					<PostTypesDataView items={ items } onEnable={ enable } onDisable={ disable } />
				</CardBody>
			</Card>

			<Card className="tiptap-settings-modern__section">
				<CardHeader>
					<h2>{ __( 'Editor options', 'tiptap-editor' ) }</h2>
				</CardHeader>
				<CardBody>
					<SelectControl
						label={ __( 'Toolbar', 'tiptap-editor' ) }
						value={ settings.toolbar_preset }
						options={ [
							{
								value: 'minimal',
								label: __( 'Minimal (bold, italic, links only)', 'tiptap-editor' ),
							},
							{
								value: 'standard',
								label: __( 'Standard (recommended)', 'tiptap-editor' ),
							},
							{
								value: 'full',
								label: __( 'Full (all formatting options)', 'tiptap-editor' ),
							},
						] }
						onChange={ ( value ) =>
							saveSettings( { toolbar_preset: value as ToolbarPreset } )
						}
						__nextHasNoMarginBottom
					/>
				</CardBody>
			</Card>

			<Card className="tiptap-settings-modern__section">
				<CardHeader>
					<h2>{ __( 'AI features', 'tiptap-editor' ) }</h2>
				</CardHeader>
				<CardBody>
					{ settings.has_ai_client ? (
						<p>{ __( 'AI writing features are available.', 'tiptap-editor' ) }</p>
					) : (
						<Notice status="info" isDismissible={ false }>
							{ __( 'No AI provider connected.', 'tiptap-editor' ) }{ ' ' }
							<ExternalLink href="options-general.php?page=connectors">
								{ __( 'Connect a provider in Settings → Connectors', 'tiptap-editor' ) }
							</ExternalLink>
						</Notice>
					) }
				</CardBody>
			</Card>
		</div>
	);
}

const rootEl = document.getElementById( 'tiptap-editor-settings-root' );
if ( rootEl ) {
	createRoot( rootEl ).render( <SettingsApp /> );
}
