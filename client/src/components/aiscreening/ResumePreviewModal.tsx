import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Loader2, X } from 'lucide-react'
import mammoth from 'mammoth'

type PreviewFileType = 'pdf' | 'docx' | 'doc' | 'other'

interface ResumePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  url: string | null
  fileName: string | null
  fileType: string | null
}

const getPreviewType = (fileType: string | null, fileName: string | null): PreviewFileType => {
  const ext = (fileType || fileName?.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'doc') return 'doc'
  return 'other'
}

export function ResumePreviewModal({
  isOpen,
  onClose,
  url,
  fileName,
  fileType,
}: ResumePreviewModalProps) {
  const previewType = useMemo(() => getPreviewType(fileType, fileName), [fileType, fileName])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setLoading(false)
      setError(null)
      setDocxHtml('')
      return
    }

    if (!url) return
    if (previewType !== 'docx') return

    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(url)
        if (!res.ok) throw new Error(`文件获取失败：${res.status}`)
        const arrayBuffer = await res.arrayBuffer()

        const { value } = await mammoth.convertToHtml({ arrayBuffer })
        if (!cancelled) setDocxHtml(value || '')
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '预览失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [isOpen, url, previewType])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 flex flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-100/80 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{fileName || '简历预览'}</p>
            <p className="text-xs text-zinc-500">{previewType.toUpperCase()} 预览</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
              >
                <ExternalLink size={16} />
                新窗口打开
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-zinc-50/80">
          {previewType === 'pdf' ? (
            <iframe src={url || undefined} className="w-full h-full border-0" title="PDF Preview" />
          ) : previewType === 'docx' ? (
            loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-zinc-400" size={36} />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
                {error}
              </div>
            ) : docxHtml ? (
              <div className="h-full overflow-y-auto bg-white">
                <div className="mx-auto max-w-5xl p-8">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: docxHtml }} />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
                未读取到可预览内容
              </div>
            )
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
              {previewType === 'doc'
                ? '暂不支持 DOC 预览，请下载后查看'
                : '暂不支持该格式预览，请下载后查看'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

