/**
 * Bubble Menu Component.
 *
 * Notion-style floating formatting bar that appears above the current
 * text selection: bold / italic / underline / strike / inline code,
 * link editing with an inline input, and quick turn-into actions
 * (H2, H3, quote).
 *
 * Positioned with editor.view.coordsAtPos (viewport coords, fixed
 * positioning) — no tippy/popper dependency, consistent with the rest
 * of this codebase. Uses @wordpress/element (externalised React).
 */

import { createElement, render, useEffect, useState } from '@wordpress/element';
import type { Editor } from '@tiptap/core';

interface BubblePosition {
	top: number;
	left: number;
}

const MENU_HEIGHT = 40;
const MENU_HALF_WIDTH = 160;

/**
 * Compute the fixed-position coords for the bubble from the selection.
 * @param editor
 */
function getSelectionPosition( editor: Editor ): BubblePosition | null {
	const { from, to } = editor.state.selection;

	try {
		const start = editor.view.coordsAtPos( from );
		const end = editor.view.coordsAtPos( to, -1 );

		const top = Math.max(
			8,
			Math.min( start.top, end.top ) - MENU_HEIGHT - 8
		);
		const center = ( start.left + end.left ) / 2;
		const left = Math.max(
			8,
			Math.min(
				center - MENU_HALF_WIDTH,
				window.innerWidth - MENU_HALF_WIDTH * 2 - 8
			)
		);

		return { top, left };
	} catch {
		return null;
	}
}

function shouldShow( editor: Editor ): boolean {
	const { empty, from, to } = editor.state.selection;
	if ( empty || ! editor.isEditable ) {
		return false;
	}
	// Only for text selections with actual text content (not node selections).
	return editor.state.doc.textBetween( from, to ).trim().length > 0;
}

interface BubbleButtonProps {
	label: string;
	icon: string;
	isActive: boolean;
	onClick: () => void;
}

function BubbleButton( { label, icon, isActive, onClick }: BubbleButtonProps ) {
	return createElement(
		'button',
		{
			type: 'button',
			title: label,
			'aria-label': label,
			'aria-pressed': isActive,
			className: `tiptap-bubble-menu__button${
				isActive ? ' is-active' : ''
			}`,
			// mousedown + preventDefault keeps the text selection alive.
			onMouseDown: ( event: MouseEvent ) => {
				event.preventDefault();
				onClick();
			},
		},
		icon
	);
}

function BubbleMenuComponent( { editor }: { editor: Editor } ) {
	const [ position, setPosition ] = useState< BubblePosition | null >( null );
	const [ linkMode, setLinkMode ] = useState( false );
	const [ linkValue, setLinkValue ] = useState( '' );
	const [ , setTick ] = useState( 0 );

	useEffect( () => {
		const updatePosition = (): void => {
			if ( shouldShow( editor ) ) {
				setPosition( getSelectionPosition( editor ) );
			} else {
				setPosition( null );
				setLinkMode( false );
			}
			setTick( ( t ) => t + 1 );
		};

		const handleBlur = ( { event }: { event: FocusEvent } ): void => {
			// Keep the menu open when focus moves into it (link input).
			const next = event.relatedTarget as HTMLElement | null;
			if ( next?.closest( '.tiptap-bubble-menu' ) ) {
				return;
			}
			setPosition( null );
			setLinkMode( false );
		};

		editor.on( 'selectionUpdate', updatePosition );
		editor.on( 'transaction', updatePosition );
		editor.on( 'blur', handleBlur );

		return () => {
			editor.off( 'selectionUpdate', updatePosition );
			editor.off( 'transaction', updatePosition );
			editor.off( 'blur', handleBlur );
		};
	}, [ editor ] );

	if ( ! position ) {
		return null;
	}

	const openLinkEditor = (): void => {
		setLinkValue(
			( editor.getAttributes( 'link' ).href as string | undefined ) ?? ''
		);
		setLinkMode( true );
	};

	const applyLink = (): void => {
		const url = linkValue.trim();
		if ( url ) {
			editor
				.chain()
				.focus()
				.extendMarkRange( 'link' )
				.setLink( { href: url } )
				.run();
		} else {
			editor.chain().focus().extendMarkRange( 'link' ).unsetLink().run();
		}
		setLinkMode( false );
	};

	const buttons: BubbleButtonProps[] = [
		{
			label: 'Bold',
			icon: 'B',
			isActive: editor.isActive( 'bold' ),
			onClick: () => editor.chain().focus().toggleBold().run(),
		},
		{
			label: 'Italic',
			icon: 'I',
			isActive: editor.isActive( 'italic' ),
			onClick: () => editor.chain().focus().toggleItalic().run(),
		},
		{
			label: 'Underline',
			icon: 'U',
			isActive: editor.isActive( 'underline' ),
			onClick: () => editor.chain().focus().toggleUnderline().run(),
		},
		{
			label: 'Strikethrough',
			icon: 'S̶',
			isActive: editor.isActive( 'strike' ),
			onClick: () => editor.chain().focus().toggleStrike().run(),
		},
		{
			label: 'Inline code',
			icon: '‹›',
			isActive: editor.isActive( 'code' ),
			onClick: () => editor.chain().focus().toggleCode().run(),
		},
		{
			label: 'Heading 2',
			icon: 'H2',
			isActive: editor.isActive( 'heading', { level: 2 } ),
			onClick: () =>
				editor.chain().focus().toggleHeading( { level: 2 } ).run(),
		},
		{
			label: 'Heading 3',
			icon: 'H3',
			isActive: editor.isActive( 'heading', { level: 3 } ),
			onClick: () =>
				editor.chain().focus().toggleHeading( { level: 3 } ).run(),
		},
		{
			label: 'Quote',
			icon: '"',
			isActive: editor.isActive( 'blockquote' ),
			onClick: () => editor.chain().focus().toggleBlockquote().run(),
		},
	];

	return createElement(
		'div',
		{
			className: 'tiptap-bubble-menu',
			role: 'toolbar',
			'aria-label': 'Text formatting',
			style: { top: `${ position.top }px`, left: `${ position.left }px` },
		},

		linkMode
			? [
					createElement( 'input', {
						key: 'link-input',
						type: 'url',
						className: 'tiptap-bubble-menu__link-input',
						placeholder: 'Paste a link…',
						value: linkValue,
						autoFocus: true,
						onChange: ( event: { target: { value: string } } ) =>
							setLinkValue( event.target.value ),
						onKeyDown: ( event: KeyboardEvent ) => {
							if ( event.key === 'Enter' ) {
								event.preventDefault();
								applyLink();
							}
							if ( event.key === 'Escape' ) {
								setLinkMode( false );
								editor.commands.focus();
							}
						},
					} ),
					createElement( BubbleButton, {
						key: 'link-apply',
						label: 'Apply link',
						icon: '↵',
						isActive: false,
						onClick: applyLink,
					} ),
			  ]
			: [
					...buttons.map( ( props ) =>
						createElement( BubbleButton, {
							key: props.label,
							...props,
						} )
					),
					createElement( BubbleButton, {
						key: 'link',
						label: 'Link',
						icon: '🔗',
						isActive: editor.isActive( 'link' ),
						onClick: openLinkEditor,
					} ),
			  ]
	);
}

export const BubbleMenu = {
	mount( editor: Editor ): void {
		const container = document.createElement( 'div' );
		container.className = 'tiptap-bubble-menu-container';
		document.body.appendChild( container );

		render( createElement( BubbleMenuComponent, { editor } ), container );
	},
};
