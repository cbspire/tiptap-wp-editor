/**
 * WPDragHandle Extension.
 *
 * Notion-style block affordances: hovering a top-level block shows a
 * ⠿ grip (drag to reorder, click to select) and a + button (insert a
 * new block below and open the slash menu).
 *
 * Pointer-only UX — hidden via CSS on touch devices, where reordering
 * stays cut/paste. Dropping is handled natively by ProseMirror
 * (view.dragging + the StarterKit Dropcursor extension).
 */

import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

class DragHandleView {
	private view: EditorView;
	private editor: Editor;
	private handle: HTMLDivElement;
	private grip: HTMLButtonElement;
	private plus: HTMLButtonElement;
	/** Position of the top-level block the handle currently points at. */
	private blockPos: number | null = null;
	private rafId: number | null = null;

	private readonly onMouseMove = ( event: MouseEvent ): void => {
		if ( this.rafId !== null ) {
			return;
		}
		this.rafId = window.requestAnimationFrame( () => {
			this.rafId = null;
			this.trackBlock( event.clientY );
		} );
	};

	private readonly onMouseLeave = ( event: MouseEvent ): void => {
		const next = event.relatedTarget as Node | null;
		if ( next && this.handle.contains( next ) ) {
			return;
		}
		this.hide();
	};

	private readonly onHide = (): void => this.hide();

	constructor( view: EditorView, editor: Editor ) {
		this.view = view;
		this.editor = editor;

		this.handle = document.createElement( 'div' );
		this.handle.className = 'tiptap-drag-handle';

		this.plus = document.createElement( 'button' );
		this.plus.type = 'button';
		this.plus.className = 'tiptap-drag-handle__plus';
		this.plus.title = 'Add block below';
		this.plus.setAttribute( 'aria-label', 'Add block below' );
		this.plus.textContent = '+';

		this.grip = document.createElement( 'button' );
		this.grip.type = 'button';
		this.grip.className = 'tiptap-drag-handle__grip';
		this.grip.title = 'Drag to move';
		this.grip.setAttribute( 'aria-label', 'Drag to move block' );
		this.grip.textContent = '⠿';
		this.grip.draggable = true;

		this.handle.appendChild( this.plus );
		this.handle.appendChild( this.grip );
		document.body.appendChild( this.handle );

		view.dom.addEventListener( 'mousemove', this.onMouseMove );
		view.dom.addEventListener( 'mouseleave', this.onMouseLeave );
		view.dom.addEventListener( 'keydown', this.onHide );
		window.addEventListener( 'scroll', this.onHide, true );
		window.addEventListener( 'resize', this.onHide );

		this.handle.addEventListener( 'mouseleave', ( event ) => {
			const next = event.relatedTarget as Node | null;
			if ( next && this.view.dom.contains( next ) ) {
				return;
			}
			this.hide();
		} );

		this.grip.addEventListener( 'dragstart', ( event ) =>
			this.onDragStart( event )
		);
		this.grip.addEventListener( 'dragend', this.onHide );
		this.grip.addEventListener( 'click', () => this.selectBlock() );
		this.plus.addEventListener( 'click', () => this.insertBlockBelow() );
	}

	destroy(): void {
		this.view.dom.removeEventListener( 'mousemove', this.onMouseMove );
		this.view.dom.removeEventListener( 'mouseleave', this.onMouseLeave );
		this.view.dom.removeEventListener( 'keydown', this.onHide );
		window.removeEventListener( 'scroll', this.onHide, true );
		window.removeEventListener( 'resize', this.onHide );
		if ( this.rafId !== null ) {
			window.cancelAnimationFrame( this.rafId );
		}
		this.handle.remove();
	}

	/**
	 * Find the top-level block under the cursor and pin the handle to it.
	 * @param clientY
	 */
	private trackBlock( clientY: number ): void {
		if ( ! this.editor.isEditable ) {
			this.hide();
			return;
		}

		const blockEl = this.findBlockElementAt( clientY );
		if ( ! blockEl ) {
			this.hide();
			return;
		}

		let pos: number;
		try {
			const inner = this.view.posAtDOM( blockEl, 0 );
			const $pos = this.view.state.doc.resolve( inner );
			pos = $pos.depth > 0 ? $pos.before( 1 ) : inner;
		} catch {
			this.hide();
			return;
		}

		if ( ! this.view.state.doc.nodeAt( pos ) ) {
			this.hide();
			return;
		}

		this.blockPos = pos;

		const blockRect = blockEl.getBoundingClientRect();
		const editorRect = this.view.dom.getBoundingClientRect();
		this.handle.style.display = 'flex';
		this.handle.style.left = `${ editorRect.left + 4 }px`;
		this.handle.style.top = `${ blockRect.top + 1 }px`;
	}

	private findBlockElementAt( clientY: number ): HTMLElement | null {
		for ( const child of Array.from( this.view.dom.children ) ) {
			const rect = child.getBoundingClientRect();
			if ( clientY >= rect.top && clientY <= rect.bottom ) {
				return child as HTMLElement;
			}
		}
		return null;
	}

	private hide(): void {
		this.handle.style.display = 'none';
		this.blockPos = null;
	}

	private selectBlock(): void {
		if ( this.blockPos === null ) {
			return;
		}
		const selection = NodeSelection.create(
			this.view.state.doc,
			this.blockPos
		);
		this.view.dispatch( this.view.state.tr.setSelection( selection ) );
		this.view.focus();
	}

	private onDragStart( event: DragEvent ): void {
		if ( this.blockPos === null || ! event.dataTransfer ) {
			return;
		}

		const node = this.view.state.doc.nodeAt( this.blockPos );
		if ( ! node ) {
			return;
		}

		const selection = NodeSelection.create(
			this.view.state.doc,
			this.blockPos
		);
		this.view.dispatch( this.view.state.tr.setSelection( selection ) );

		const blockDom = this.view.nodeDOM( this.blockPos );
		if ( blockDom instanceof HTMLElement ) {
			event.dataTransfer.setDragImage( blockDom, 0, 0 );
			event.dataTransfer.setData( 'text/html', blockDom.outerHTML );
		}
		event.dataTransfer.effectAllowed = 'copyMove';

		// Hand the slice to ProseMirror so dropping inside the editor
		// performs a native move (delete + insert in one transaction).
		this.view.dragging = { slice: selection.content(), move: true };
	}

	private insertBlockBelow(): void {
		if ( this.blockPos === null ) {
			return;
		}
		const node = this.view.state.doc.nodeAt( this.blockPos );
		if ( ! node ) {
			return;
		}

		const end = this.blockPos + node.nodeSize;
		this.editor
			.chain()
			.insertContentAt( end, { type: 'paragraph' } )
			.focus( end + 1 )
			.insertContent( '/' )
			.run();
		this.hide();
	}
}

export const WPDragHandle = Extension.create( {
	name: 'wpDragHandle',

	addProseMirrorPlugins() {
		const editor = this.editor;

		return [
			new Plugin( {
				key: new PluginKey( 'wpDragHandle' ),
				view: ( view ) => new DragHandleView( view, editor ),
			} ),
		];
	},
} );
