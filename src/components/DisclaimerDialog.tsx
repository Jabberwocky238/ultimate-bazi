import { useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import disclaimerMd from '@/assets/disclaimer.md?raw'

export function DisclaimerDialog({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const onCloseEvt = () => onClose()
    d.addEventListener('close', onCloseEvt)
    return () => d.removeEventListener('close', onCloseEvt)
  }, [onClose])

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={onBackdropClick}
      className="m-auto w-[min(720px,92vw)] max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-inherit shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col max-h-[85vh]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-medium tracking-[0.2em] text-slate-600 dark:text-slate-300">
            免责声明
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400"
          >
            关闭 ✕
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
          <Markdown remarkPlugins={[remarkGfm]}>{disclaimerMd}</Markdown>
        </div>
      </div>
    </dialog>
  )
}
