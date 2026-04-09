/**
 * AI Menu Component (WP 7.0+ only).
 *
 * A floating menu that appears on text selection, providing AI writing
 * abilities via the WordPress Abilities API.
 *
 * This component is ONLY mounted when tiptapEditorData.hasAbilitiesApi === true.
 * On WP 6.8/6.9 this file is never imported — tree-shaken from the bundle.
 *
 * Abilities:
 *   - Improve writing
 *   - Make shorter (summarise)
 *   - Make longer (expand)
 *   - Change tone (professional / conversational / persuasive)
 *   - Fix spelling & grammar
 */

import { createElement, render, useState } from '@wordpress/element';
import type { Editor } from '@tiptap/core';

interface AIMenuProps {
	editor: Editor;
	restUrl: string;
	nonce: string;
}

interface ToneOption {
	value: 'professional' | 'conversational' | 'persuasive';
	label: string;
}

const TONE_OPTIONS: ToneOption[] = [
	{ value: 'professional', label: 'Professional' },
	{ value: 'conversational', label: 'Conversational' },
	{ value: 'persuasive', label: 'Persuasive' },
];

/**
 * Calls the TipTap ability REST endpoint.
 */
async function callAbility(
	ability: string,
	input: unknown,
	restUrl: string,
	nonce: string,
): Promise<string> {
	const response = await fetch( restUrl + 'ability', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
		},
		body: JSON.stringify( {
			ability,
			input,
			context: {
				post_id: window.tiptapEditorData?.postId,
				post_type: window.tiptapEditorData?.postType,
			},
		} ),
	} );

	if ( ! response.ok ) {
		const error = ( await response.json() ) as { message?: string };
		throw new Error( error.message ?? `HTTP ${ response.status }` );
	}

	const data = ( await response.json() ) as { result: string };
	return data.result;
}

function AIMenuComponent( { editor, restUrl, nonce }: AIMenuProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isToneOpen, setIsToneOpen ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const runAbility = async ( ability: string, input: unknown ): Promise< void > => {
		setIsLoading( true );
		setError( null );
		setIsOpen( false );

		try {
			const result = await callAbility( ability, input, restUrl, nonce );
			editor
				.chain()
				.focus()
				.insertContent( result )
				.run();
		} catch ( err ) {
			setError( err instanceof Error ? err.message : 'Unknown error' );
		} finally {
			setIsLoading( false );
		}
	};

	const getSelectedText = (): string => {
		const { from, to, empty } = editor.state.selection;
		if ( empty ) return '';
		return editor.state.doc.textBetween( from, to );
	};

	if ( ! editor.isActive ) return null;

	return createElement(
		'div',
		{ className: 'tiptap-ai-menu' },

		// AI trigger button.
		createElement(
			'button',
			{
				type: 'button',
				className: 'tiptap-toolbar__button tiptap-ai-menu__trigger',
				'aria-label': 'AI writing tools',
				'aria-expanded': isOpen,
				disabled: isLoading,
				onClick: () => setIsOpen( ( o ) => ! o ),
			},
			isLoading ? '…' : 'AI ▾',
		),

		// Error notice.
		error &&
			createElement(
				'div',
				{ className: 'tiptap-ai-menu__error notice notice-error', role: 'alert' },
				error,
			),

		// Dropdown.
		isOpen &&
			createElement(
				'ul',
				{
					className: 'tiptap-ai-menu__dropdown',
					role: 'menu',
					'aria-label': 'AI writing actions',
				},
				createElement(
					'li',
					{ role: 'menuitem' },
					createElement(
						'button',
						{
							type: 'button',
							onClick: () => runAbility( 'tiptap/improve-writing', getSelectedText() ),
						},
						'Improve writing',
					),
				),
				createElement(
					'li',
					{ role: 'menuitem' },
					createElement(
						'button',
						{
							type: 'button',
							onClick: () => runAbility( 'tiptap/summarise', getSelectedText() ),
						},
						'Make shorter',
					),
				),
				createElement(
					'li',
					{ role: 'menuitem' },
					createElement(
						'button',
						{
							type: 'button',
							onClick: () => runAbility( 'tiptap/expand', getSelectedText() ),
						},
						'Make longer',
					),
				),

				// Tone submenu.
				createElement(
					'li',
					{ role: 'menuitem', className: 'has-submenu' },
					createElement(
						'button',
						{
							type: 'button',
							'aria-haspopup': 'true',
							'aria-expanded': isToneOpen,
							onClick: () => setIsToneOpen( ( o ) => ! o ),
						},
						'Change tone ▶',
					),
					isToneOpen &&
						createElement(
							'ul',
							{ className: 'tiptap-ai-menu__submenu', role: 'menu' },
							...TONE_OPTIONS.map( ( tone ) =>
								createElement(
									'li',
									{ key: tone.value, role: 'menuitem' },
									createElement(
										'button',
										{
											type: 'button',
											onClick: () =>
												runAbility( 'tiptap/tone', {
													text: getSelectedText(),
													tone: tone.value,
												} ),
										},
										tone.label,
									),
								),
							),
						),
				),
			),
	);
}

export const AIMenu = {
	mount( container: HTMLElement, editor: Editor ): void {
		const menuContainer = document.createElement( 'div' );
		menuContainer.className = 'tiptap-ai-menu-container';
		container.appendChild( menuContainer );

		const props: AIMenuProps = {
			editor,
			restUrl: window.tiptapEditorData?.restUrl ?? '/wp-json/tiptap-editor/v1/',
			nonce: window.tiptapEditorData?.nonce ?? '',
		};

		render( createElement( AIMenuComponent, props ), menuContainer );
	},
};
