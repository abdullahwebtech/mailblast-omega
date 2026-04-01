'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, AlignLeft, AlignCenter,
  AlignRight, Undo2, Redo2, Palette, Link as LinkIcon, X
} from 'lucide-react';
import { useState } from 'react';
import { useModals } from '@/context/ModalContext';

interface ToolbarProps { editor: Editor | null; }

export default function Toolbar({ editor }: ToolbarProps) {
  const { showPrompt } = useModals();
  const [showColors, setShowColors] = useState(false);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-2 rounded-lg transition-all flex items-center justify-center min-w-[32px] min-h-[32px] ${
      active
        ? 'bg-[rgba(18,151,253,.1)] text-[#1297FD] border border-[rgba(18,151,253,.2)]'
        : 'text-[#8D909C] hover:text-[#0C0D10] hover:bg-[#F2F3F5]'
    }`;

  const div = <div className="w-px h-4 bg-[#E8E9EC] mx-0.5" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 bg-[#F2F3F5] border-b border-[#E8E9EC] rounded-t-xl">
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}
        className={`${btn(false)} ${!editor.can().undo() ? 'opacity-30 cursor-not-allowed' : ''}`} title="Undo">
        <Undo2 size={15} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}
        className={`${btn(false)} ${!editor.can().redo() ? 'opacity-30 cursor-not-allowed' : ''}`} title="Redo">
        <Redo2 size={15} />
      </button>
      {div}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Bold"><Bold size={15} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Italic"><Italic size={15} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Underline"><UnderlineIcon size={15} /></button>
      {div}
      <button onClick={() => setShowColors(!showColors)} className={btn(showColors)} title="Text Color"><Palette size={15} /></button>
      {showColors && (
        <div className="flex items-center gap-1.5 px-1.5 border-l border-[#E8E9EC] ml-0.5">
          <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0 hover:scale-110 transition-transform" title="Custom Color" />
          <button onClick={() => editor.chain().focus().unsetColor().run()}
            className="w-5 h-5 rounded bg-[#E8E9EC] hover:bg-[#D8DADF] transition-colors flex items-center justify-center" title="Reset Color">
            <X size={10} className="text-[#8D909C]" />
          </button>
        </div>
      )}
      {div}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft size={15} /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="Align Center"><AlignCenter size={15} /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight size={15} /></button>
      {div}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Bullet List"><List size={15} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Numbered List"><ListOrdered size={15} /></button>
      {div}
      <button
        onClick={() => {
          if (editor.isActive('link')) editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: '' }).run();
        }}
        className={btn(editor.isActive('link'))} title="Insert Link">
        <LinkIcon size={15} />
      </button>
    </div>
  );
}
