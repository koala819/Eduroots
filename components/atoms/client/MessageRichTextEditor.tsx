'use client'

import React, { useCallback, useEffect, useState } from 'react'
import 'react-quill/dist/quill.snow.css'

import dynamic from 'next/dynamic'

import type { MyQuillComponentProps } from '@/types/models'

import Loading from '@/components/admin/atoms/server/Loading'

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ color: [] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
  ],
}

const QUILL_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'link',
  'image',
  'align',
  'color',
]

const QuillEditor = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill')
    return RQ
  },
  {
    ssr: false,
    loading: () => <Loading name="l'éditeur de texte" />,
  },
)

const RichTextEditor = React.memo(
  ({ value, onChange }: MyQuillComponentProps) => {
    const [editorContent, setEditorContent] = useState<string>(value || '')

    // Mettre à jour l'état local uniquement si value change de l'extérieur
    useEffect(() => {
      if (value !== editorContent) {
        setEditorContent(value || '')
      }
    }, [value])

    const handleEditorChange = useCallback(
      (newContent: string) => {
        setEditorContent(newContent)
        onChange(newContent)
      },
      [onChange],
    )

    return (
      <QuillEditor
        value={editorContent}
        onChange={handleEditorChange}
        modules={QUILL_MODULES}
        formats={QUILL_FORMATS}
        className="mt-2"
        placeholder="Ecrivez votre message..."
      />
    )
  },
)

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
