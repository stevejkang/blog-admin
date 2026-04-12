"use client"

import { useCallback, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { getErrorMessage } from "@/lib/api/errors"
import type { PublishMode, PublishResult } from "@/types"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DialogState =
  | { step: "select" }
  | { step: "loading" }
  | { step: "success"; result: PublishResult }
  | { step: "error"; message: string }

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPublish: (mode: PublishMode) => Promise<PublishResult>
  onSuccess?: (result: PublishResult) => void
  isEdit?: boolean
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PublishDialog({
  open,
  onOpenChange,
  onPublish,
  onSuccess,
  isEdit = false,
}: PublishDialogProps) {
  const [mode, setMode] = useState<PublishMode>("branch-pr")
  const [state, setState] = useState<DialogState>({ step: "select" })

  const handlePublish = useCallback(async () => {
    setState({ step: "loading" })
    try {
      const result = await onPublish(mode)
      setState({ step: "success", result })
    } catch (err) {
      setState({
        step: "error",
        message: getErrorMessage(err),
      })
    }
  }, [mode, onPublish])

  const handleRetry = useCallback(() => {
    setState({ step: "select" })
  }, [])

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (state.step === "loading") return
      if (!nextOpen) {
        // Reset state when closing unless in success state with callback
        if (state.step === "success" && onSuccess) {
          onSuccess(state.result)
        }
        // Small delay so close animation completes before resetting state
        setTimeout(() => setState({ step: "select" }), 200)
      }
      onOpenChange(nextOpen)
    },
    [state, onOpenChange, onSuccess],
  )

  const handleSuccessDone = useCallback(() => {
    if (state.step === "success" && onSuccess) {
      onSuccess(state.result)
    }
    onOpenChange(false)
    setTimeout(() => setState({ step: "select" }), 200)
  }, [state, onSuccess, onOpenChange])

  const action = isEdit ? "Update" : "Publish"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* ---- Mode Selection ---- */}
        {state.step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>{action} Post</DialogTitle>
              <DialogDescription>
                Choose how to publish your changes.
              </DialogDescription>
            </DialogHeader>

            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as PublishMode)}
              className="gap-3"
            >
              {/* Branch + PR */}
              <label
                htmlFor="mode-branch-pr"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
              >
                <RadioGroupItem value="branch-pr" id="mode-branch-pr" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Create PR</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Creates a branch and pull request. Preview changes on
                    Vercel before merging.
                  </p>
                </div>
              </label>

              {/* Direct to main */}
              <label
                htmlFor="mode-direct"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
              >
                <RadioGroupItem value="direct" id="mode-direct" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Send className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Publish Now</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Commits directly to main branch. Triggers production
                    deploy immediately.
                  </p>
                </div>
              </label>
            </RadioGroup>

            {/* Direct-to-main warning */}
            {mode === "direct" && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>This will deploy directly to production.</span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublish}>
                {mode === "branch-pr" ? (
                  <GitPullRequest className="size-3.5" />
                ) : (
                  <Send className="size-3.5" />
                )}
                {mode === "branch-pr" ? "Create PR" : "Publish Now"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ---- Loading ---- */}
        {state.step === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle>Publishing…</DialogTitle>
              <DialogDescription>
                {mode === "branch-pr"
                  ? "Creating branch and pull request…"
                  : "Committing to main branch…"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {/* ---- Success ---- */}
        {state.step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" />
                Published successfully
              </DialogTitle>
              <DialogDescription>
                {mode === "branch-pr"
                  ? "Your pull request has been created."
                  : "Your changes have been deployed."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Commit SHA
                </span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {state.result.commitSha.slice(0, 7)}
                </code>
              </div>
              {state.result.prUrl && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Pull Request
                  </span>
                  <a
                    href={state.result.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    #{state.result.prNumber}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleSuccessDone}>Done</Button>
            </DialogFooter>
          </>
        )}

        {/* ---- Error ---- */}
        {state.step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                Publish failed
              </DialogTitle>
              <DialogDescription>{state.message}</DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
