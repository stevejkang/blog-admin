'use client'

import { useCallback, useMemo, useRef, useState, type ForwardedRef } from 'react'
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

const HAS_CODE_META = /```\w*\s+\{[^}]+\}/

function hasUnsupportedSyntax(markdown: string): boolean {
  return HAS_CODE_META.test(markdown)
}

const CODE_BLOCK_LANGUAGES: Record<string, string> = {
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
}

function buildPlugins(sourceMode: boolean, diffMarkdown: string) {
  return [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    imagePlugin({ imageUploadHandler: async () => '' }),
    tablePlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
    codeMirrorPlugin({ codeBlockLanguages: CODE_BLOCK_LANGUAGES }),
    markdownShortcutPlugin(),
    diffSourcePlugin({ viewMode: sourceMode ? 'source' : 'rich-text', diffMarkdown }),
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
}

interface InitializedEditorProps extends MDXEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods> | null
}

export default function InitializedEditor({
  editorRef,
  ...props
}: InitializedEditorProps) {
  const markdown = props.markdown ?? ''
  const sourceMode = hasUnsupportedSyntax(markdown)
  const [diffBase, setDiffBase] = useState(markdown)
  const captured = useRef(false)

  const plugins = useMemo(() => buildPlugins(sourceMode, diffBase), [sourceMode, diffBase])

  const captureRef = useCallback((instance: MDXEditorMethods | null) => {
    if (instance && !captured.current) {
      captured.current = true
      requestAnimationFrame(() => {
        const initial = instance.getMarkdown()
        setDiffBase(initial)
      })
    }
    if (typeof editorRef === 'function') {
      editorRef(instance)
    } else if (editorRef && 'current' in editorRef) {
      (editorRef as React.MutableRefObject<MDXEditorMethods | null>).current = instance
    }
  }, [editorRef])

  return (
    <MDXEditor
      plugins={plugins}
      {...props}
      ref={captureRef}
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
