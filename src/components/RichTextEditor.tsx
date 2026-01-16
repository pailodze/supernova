'use client'

import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'link',
]

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 150px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f4f4f5;
        }
        .dark .rich-text-editor .ql-toolbar {
          background: #3f3f46;
          border-color: #52525b;
        }
        .dark .rich-text-editor .ql-container {
          background: #3f3f46;
          border-color: #52525b;
          color: white;
        }
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #a1a1aa;
        }
        .dark .rich-text-editor .ql-stroke {
          stroke: #d4d4d8;
        }
        .dark .rich-text-editor .ql-fill {
          fill: #d4d4d8;
        }
        .dark .rich-text-editor .ql-picker-label {
          color: #d4d4d8;
        }
        .dark .rich-text-editor .ql-picker-options {
          background: #3f3f46;
        }
      `}</style>
    </div>
  )
}
