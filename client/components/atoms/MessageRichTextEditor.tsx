'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'

import type { MyQuillComponentProps } from '@/zUnused/types/models'

const TINYMCE_CONFIG = {
  height: 300,
  menubar: false,
  plugins: [
    'advlist',
    'autolink',
    'lists',
    'link',
    'image',
    'charmap',
    'preview',
    'anchor',
    'searchreplace',
    'visualblocks',
    'code',
    'fullscreen',
    'insertdatetime',
    'media',
    'table',
    'help',
    'wordcount',
  ],
  toolbar:
    'undo redo | blocks | ' +
    'bold italic | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | help',
  content_style:
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }',
}

const RichTextEditor = React.memo(({ value, onChange }: MyQuillComponentProps) => {
  const [editorContent, setEditorContent] = useState<string>(value || '')

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
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={editorContent}
      onEditorChange={handleEditorChange}
      init={TINYMCE_CONFIG}
    />
  )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
