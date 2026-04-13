'use client'

import type { ForwardedRef } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertCodeBlock,
  InsertThematicBreak,
  DiffSourceToggleWrapper,
  Separator,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

const ALL_PLUGINS = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  imagePlugin({
    imageUploadHandler: async () => {
      // Placeholder — real upload handler will be provided via T20
      return Promise.resolve('')
    },
  }),
  tablePlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
  codeMirrorPlugin({
    codeBlockLanguages: {
      '': 'Plain Text',
      text: 'Plain Text',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      tsx: 'TSX',
      jsx: 'JSX',
      css: 'CSS',
      html: 'HTML',
      json: 'JSON',
      markdown: 'Markdown',
      python: 'Python',
      bash: 'Bash',
      sh: 'Shell',
      shell: 'Shell',
      sql: 'SQL',
      yaml: 'YAML',
      yml: 'YAML',
      go: 'Go',
      rust: 'Rust',
      java: 'Java',
      kotlin: 'Kotlin',
      swift: 'Swift',
      ruby: 'Ruby',
      php: 'PHP',
      xml: 'XML',
      diff: 'Diff',
      dockerfile: 'Dockerfile',
      graphql: 'GraphQL',
      c: 'C',
      cpp: 'C++',
    },
  }),
  markdownShortcutPlugin(),
  diffSourcePlugin({ viewMode: 'rich-text' }),
  toolbarPlugin({
    toolbarContents: () => (
      <DiffSourceToggleWrapper>
        <UndoRedo />
        <Separator />
        <BoldItalicUnderlineToggles />
        <CodeToggle />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <ListsToggle />
        <Separator />
        <CreateLink />
        <InsertImage />
        <InsertTable />
        <InsertCodeBlock />
        <InsertThematicBreak />
      </DiffSourceToggleWrapper>
    ),
  }),
]

interface InitializedEditorProps extends MDXEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods> | null
}

export default function InitializedEditor({
  editorRef,
  ...props
}: InitializedEditorProps) {
  return (
    <MDXEditor
      plugins={ALL_PLUGINS}
      {...props}
      ref={editorRef}
      className={[
        'dark-theme',
        'dark-editor',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
