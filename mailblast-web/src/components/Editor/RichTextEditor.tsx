'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import Gapcursor from '@tiptap/extension-gapcursor';
import Toolbar from './Toolbar';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Check, Trash2, X, ExternalLink } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
}

export interface RichTextEditorRef {
  insertContent: (content: string) => void;
  getEditor: () => Editor | null;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, placeholder, className, onFocus }, ref) => {
    const [linkUrl, setLinkUrl] = useState('');

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: { keepMarks: true, keepAttributes: false },
          orderedList: { keepMarks: true, keepAttributes: false },
        }),
        Underline,
        TextStyle.configure(),
        Color.configure(),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-[#1297FD] underline cursor-pointer',
          },
        }),
        Placeholder.configure({
          placeholder: placeholder || 'Write something...',
        }),
        Gapcursor,
        BubbleMenuExtension.configure({
          element: null, // will be handled by the component
        }),
      ],
      content: content,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      onFocus: () => {
        if (onFocus) onFocus();
      },
      onSelectionUpdate: ({ editor }) => {
        if (editor.isActive('link')) {
          setLinkUrl(editor.getAttributes('link').href || '');
        }
      },
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[300px] p-6 text-sm leading-relaxed text-[#0C0D10] custom-scrollbar',
        },
      },
    });

    useImperativeHandle(ref, () => ({
      insertContent: (val: string) => {
        if (editor) {
          editor.chain().focus().insertContent(val).run();
        }
      },
      getEditor: () => editor,
    }));

    // Sync content if it changes externally (e.g. template load)
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        if (content === "" && editor.getHTML() === "<p></p>") return;
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    return (
      <div className={`flex flex-col bg-white border border-[#D8DADF] rounded-xl overflow-hidden focus-within:border-[#1297FD] focus-within:ring-2 focus-within:ring-[rgba(18,151,253,.12)] transition-colors ${className}`}>
        <Toolbar editor={editor} />
        {editor && (
          <BubbleMenu
            editor={editor}
            options={{ placement: 'bottom' }}
            shouldShow={({ editor }) => editor.isActive('link')}
          >
            <div className="flex items-center gap-2 p-1.5 bg-white border border-[#D8DADF] rounded-xl shadow-md z-[200] w-[260px]">
              <div className="flex-1">
                <input
                  autoFocus type="text" value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run(); }}
                  placeholder="URL..."
                  className="w-full bg-[#F2F3F5] border border-[#E8E9EC] focus:border-[#1297FD] rounded-lg px-3 py-1.5 text-[11px] focus:outline-none transition-all text-[#0C0D10] placeholder:text-[#8D909C]"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()}
                  className="p-1.5 bg-[rgba(18,151,253,.08)] text-[#1297FD] hover:bg-[rgba(18,151,253,.15)] rounded-lg transition-colors" title="Save Link">
                  <Check size={12} />
                </button>
                <button onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
                  className="p-1.5 text-[#EF4444] hover:bg-[rgba(239,68,68,.06)] rounded-lg transition-colors" title="Remove Link">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </BubbleMenu>
        )}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">
          <EditorContent editor={editor} />
        </div>
        
        {/* Styles for TipTap */}
        <style jsx global>{`
          .tiptap p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #8D909C;
            pointer-events: none;
            height: 0;
          }
          .tiptap ul {
            list-style-type: disc;
            padding-left: 1.5rem;
          }
          .tiptap ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
          }
          .tiptap {
             outline: none !important;
          }
          /* Gapcursor styles */
          .tiptap .ProseMirror-gapcursor {
            display: none;
            pointer-events: none;
            position: absolute;
          }
          .tiptap .ProseMirror-gapcursor:after {
            content: "";
            display: block;
            position: absolute;
            top: -2px;
            width: 1px;
            height: 20px;
            border-left: 1px solid #1297FD;
            animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
          }
          @keyframes ProseMirror-cursor-blink {
            to {
              visibility: hidden;
            }
          }
          .tiptap .ProseMirror-focused .ProseMirror-gapcursor {
            display: block;
          }
        `}</style>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
