'use client'

import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/atoms/client/MessageRichTextEditor'), {
  ssr: false,
})

export const MessageEditor = ({form}: {form: any}) => {
  const handleEditorChange = (content: string) => {
    form.setValue('message', content)
  }

  return (
    <div className="space-y-2">
      <label className="block font-medium">Message</label>
      <RichTextEditor value={form.watch('message')} onChange={handleEditorChange} />
    </div>
  )
}
