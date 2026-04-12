'use client'

import dynamic from 'next/dynamic'
import { forwardRef } from 'react'
import type { MDXEditorMethods, MDXEditorProps } from '@mdxeditor/editor'

const Editor = dynamic(() => import('./initialized-editor'), { ssr: false })

export const MDXEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />,
)

MDXEditor.displayName = 'MDXEditor'
