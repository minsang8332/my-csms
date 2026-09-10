import { FormEvent, useMemo, useState, useEffect } from 'react'
import { FileText, Pencil, Plus, Trash2, Upload, Building2, MessageSquareText, PackageCheck } from 'lucide-react'
import BaseModal from '../../components/modal/BaseModal'
import { useAlertStore } from '../../stores/useAlertStore'
import type { CsBranch, ShippedItem, StoredItem } from '../../../../shared/api'

type CsFormState = {
  name: string
  address: string
  contact: string
  status: string
  licensePath?: string | null
  licenseName?: string | null
  description: string
  items: ShippedItem[]
  createdAt?: string
  receivedAt?: string | null
  shippedAt?: string | null
}

const emptyForm: CsFormState = {
  name: '',
  address: '',
  contact: '',
  status: '문의접수',
  licensePath: null,
  licenseName: null,
  description: '',
  items: [],
  createdAt: '',
  receivedAt: '',
  shippedAt: ''
}

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''

  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
  }

  if (numbers.startsWith('0')) {
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  if (numbers.startsWith('1') && numbers.length <= 8) {
    if (numbers.length <= 4) return numbers
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
  }

  return numbers
}

type CsFormModalProps = {
  open: boolean
  editingCs: CsBranch | null
  statuses: string[]
  onClose: () => void
  onSuccess: () => Promise<void>
}

export default function CsFormModal({ open, editingCs: initialEditingCs, statuses, onClose, onSuccess }: CsFormModalProps) {
  const isWeb = window.api?.isWeb ?? false
  const showAlert = useAlertStore((state) => state.showAlert)
  const [editingCs, setEditingCs] = useState<CsBranch | null>(null)
  const [form, setForm] = useState<CsFormState>(emptyForm)
  const [stockItems, setStockItems] = useState<StoredItem[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)

  // Load stock items when modal opens
  useEffect(() => {
    if (open) {
      window.api?.item?.readAll()
        .then(setStockItems)
        .catch(err => console.error('Failed to load stock items:', err))
    }
  }, [open])

  // Initialize form when modal opens or editingCs changes
  useEffect(() => {
    if (open) {
      if (initialEditingCs) {
        setEditingCs(initialEditingCs)
        setForm({
          name: initialEditingCs.name,
          address: initialEditingCs.address,
          contact: formatPhoneNumber(initialEditingCs.contact),
          status: initialEditingCs.status,
          licensePath: initialEditingCs.licensePath,
          licenseName: initialEditingCs.licenseName,
          description: initialEditingCs.description || '',
          items: initialEditingCs.items ?? [],
          createdAt: initialEditingCs.createdAt ? initialEditingCs.createdAt.slice(0, 10) : '',
          receivedAt: initialEditingCs.receivedAt ? initialEditingCs.receivedAt.slice(0, 10) : '',
          shippedAt: initialEditingCs.shippedAt ? initialEditingCs.shippedAt.slice(0, 10) : ''
        })
      } else {
        setEditingCs(null)
        setForm(emptyForm)
      }
      setReplyContent('')
      setEditingReplyId(null)
    }
  }, [open, initialEditingCs])

  const itemsSummary = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.price || 0) * (item.count || 0), 0)
    const vat = Math.floor(subtotal * 0.1)
    const total = subtotal + vat
    return { subtotal, vat, total }
  }, [form.items])

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setForm((current) => ({ ...current, contact: formatted }))
  }

  const handleAddShippedItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { name: '', price: 0, count: 1 }]
    }))
  }

  const handleUpdateShippedItem = (idx: number, key: keyof ShippedItem, value: any) => {
    setForm((current) => {
      const nextItems = [...current.items]
      nextItems[idx] = {
        ...nextItems[idx],
        [key]: value
      }
      return { ...current, items: nextItems }
    })
  }

  const handleRemoveShippedItem = (idx: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== idx)
    }))
  }

  const handleUploadLicense = async () => {
    try {
      const fileInfo = await window.api.cs.uploadLicense()
      if (fileInfo) {
        setForm((current) => ({
          ...current,
          licensePath: fileInfo.path,
          licenseName: fileInfo.name
        }))
        showAlert('사업자 등록증이 업로드되었습니다.', 'success')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      showAlert('파일 업로드에 실패했습니다.', 'error')
    }
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanName = form.name.replace(/\s+/g, '')
    if (!cleanName || !form.contact.trim()) {
      showAlert('지점명과 연락처는 필수 입력 항목입니다.', 'error')
      return
    }

    for (const shippedItem of form.items) {
      if (!shippedItem.name) continue
      const sItem = stockItems.find((s) => s.name === shippedItem.name)
      if (!sItem) {
        showAlert(`재고 관리에서 품목 [${shippedItem.name}]을 찾을 수 없습니다.`, 'error')
        return
      }

      const savedInBranch = editingCs?.items?.find((i) => i.name === shippedItem.name)?.count || 0
      const countInCurrentFormAllRows = form.items
        .filter((i) => i.name === shippedItem.name)
        .reduce((sum, i) => sum + (i.count || 0), 0)

      const availableStock = sItem.count + savedInBranch
      if (countInCurrentFormAllRows > availableStock) {
        showAlert(`[${shippedItem.name}]의 최대 사용 가능 재고(${availableStock}개)를 초과했습니다. 현재 선택: ${countInCurrentFormAllRows}개`, 'error')
        return
      }
    }

    try {
      const getMidnight = (d: string) => `${d.slice(0, 10)}T00:00:00.000Z`
      const todayMidnight = getMidnight(new Date().toISOString())

      let finalReceivedAt: string | null = null
      if (form.receivedAt) {
        finalReceivedAt = getMidnight(form.receivedAt)
      } else if (editingCs) {
        finalReceivedAt = form.receivedAt === '' ? null : (editingCs.receivedAt ? getMidnight(editingCs.receivedAt) : null)
      } else if (form.status !== '문의접수' && form.status !== '접수취소') {
        finalReceivedAt = todayMidnight
      }

      let finalShippedAt: string | null = null
      if (form.shippedAt) {
        finalShippedAt = getMidnight(form.shippedAt)
      } else if (editingCs) {
        finalShippedAt = form.status === '출고완료' ? (editingCs.shippedAt ? getMidnight(editingCs.shippedAt) : todayMidnight) : null
      } else if (form.status === '출고완료') {
        finalShippedAt = todayMidnight
      }

      if (editingCs) {
        await window.api.cs.edit({
          ...editingCs,
          name: cleanName,
          address: form.address,
          contact: form.contact.replace(/\D/g, ''),
          status: form.status,
          licensePath: form.licensePath,
          licenseName: form.licenseName,
          description: form.description,
          createdAt: form.createdAt ? getMidnight(form.createdAt) : editingCs.createdAt,
          receivedAt: finalReceivedAt,
          shippedAt: finalShippedAt,
          items: form.items
        })
        showAlert('지점 정보가 수정되었습니다.', 'success')
      } else {
        await window.api.cs.create({
          name: cleanName,
          address: form.address,
          contact: form.contact.replace(/\D/g, ''),
          status: form.status,
          licensePath: form.licensePath,
          licenseName: form.licenseName,
          description: form.description,
          createdAt: form.createdAt ? getMidnight(form.createdAt) : todayMidnight,
          receivedAt: finalReceivedAt,
          shippedAt: finalShippedAt,
          items: form.items
        } as any)
        showAlert('새로운 지점이 추가되었습니다.', 'success')
      }

      await onSuccess()
      onClose()
    } catch (error) {
      console.error('Submit failed:', error)
      showAlert('지점 저장에 실패했습니다.', 'error')
    }
  }

  const handleSubmitReply = async () => {
    if (!editingCs || !replyContent.trim()) return
    try {
      if (editingReplyId) {
        await window.api.cs.editReply(editingReplyId, replyContent)
        showAlert('답변이 수정되었습니다.', 'success')
      } else {
        await window.api.cs.createReply(editingCs.id, replyContent)
        showAlert('답변이 등록되었습니다.', 'success')
      }
      
      setReplyContent('')
      setEditingReplyId(null)
      
      const updatedCsList = await window.api.cs.readAll()
      const updatedCs = updatedCsList.find((c: CsBranch) => c.id === editingCs.id)
      if (updatedCs) setEditingCs(updatedCs)
      
    } catch (error) {
      console.error('Reply submit failed:', error)
      showAlert('답변 처리에 실패했습니다.', 'error')
    }
  }

  const handleEditReply = (reply: any) => {
    setReplyContent(reply.content)
    setEditingReplyId(reply.id)
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!editingCs) return
    try {
      await window.api.cs.removeReply(replyId)
      showAlert('답변이 삭제되었습니다.', 'success')
      
      const updatedCsList = await window.api.cs.readAll()
      const updatedCs = updatedCsList.find((c: CsBranch) => c.id === editingCs.id)
      if (updatedCs) setEditingCs(updatedCs)
    } catch (error) {
      console.error('Reply delete failed:', error)
      showAlert('답변 삭제에 실패했습니다.', 'error')
    }
  }

  return (
    <BaseModal
      open={open}
      title={isWeb ? '지점 상세 정보' : (editingCs ? '지점 정보 수정' : '신규 지점 추가')}
      description={isWeb ? '지점 기본 정보 및 접수/출고 내역을 조회합니다.' : '지점 기본 정보, 접수 현황, 문의 내용 및 출고 항목을 관리합니다.'}
      widthClassName="max-w-4xl"
      onClose={onClose}
    >
      <form className="space-y-6 bg-white dark:bg-slate-950" onSubmit={submitForm}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: 기본 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                기본 정보
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>지점명</span> {!isWeb && <span className="text-rose-500 font-bold">*</span>}
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                placeholder="예: 서울 강남지점"
                required
                disabled={isWeb}
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>주소</span>
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                placeholder="예: 서울특별시 강남구..."
                type="text"
                disabled={isWeb}
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>연락처</span> {!isWeb && <span className="text-rose-500 font-bold">*</span>}
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                placeholder="예: 010-1234-5678"
                required
                disabled={isWeb}
                type="text"
                value={form.contact}
                onChange={handleContactChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>상태</span> {!isWeb && <span className="text-rose-500 font-bold">*</span>}
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                  disabled={isWeb}
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as any }))
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                사업자 등록증
              </span>
              <div className="flex items-center gap-3">
                {!isWeb && (
                  <button
                    type="button"
                    onClick={handleUploadLicense}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-3 text-xs font-medium text-emerald-800 shadow-xs hover:bg-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Upload size={14} className="text-emerald-600 dark:text-emerald-400" />
                    파일 업로드
                  </button>
                )}
                {form.licenseName ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-md border border-emerald-200/80 dark:border-slate-800">
                    <FileText size={14} className="text-emerald-600" />
                    <span className="truncate max-w-[150px] font-medium" title={form.licensePath || ''}>
                      {form.licenseName}
                    </span>
                  </div>
                ) : (
                  isWeb && <span className="text-xs text-slate-400">등록된 사업자 등록증 없음</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  접수일자
                </label>
                <input
                  type="date"
                  disabled={isWeb}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 cursor-pointer transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                  value={form.createdAt || ''}
                  onChange={(e) => setForm({ ...form, createdAt: e.target.value })}
                  onClick={(e) => !isWeb && (e.currentTarget as HTMLInputElement).showPicker?.()}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  입고일자
                </label>
                <input
                  type="date"
                  disabled={isWeb}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 cursor-pointer transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                  value={form.receivedAt || ''}
                  onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
                  onClick={(e) => !isWeb && (e.currentTarget as HTMLInputElement).showPicker?.()}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  출고일자
                </label>
                <input
                  type="date"
                  disabled={isWeb}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 cursor-pointer transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                  value={form.shippedAt || ''}
                  onChange={(e) => setForm({ ...form, shippedAt: e.target.value })}
                  onClick={(e) => !isWeb && (e.currentTarget as HTMLInputElement).showPicker?.()}
                />
              </div>
            </div>
          </div>

          {/* Right Column: 문의 내용 및 답변 */}
          <div className="space-y-4 flex flex-col">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <MessageSquareText size={15} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                문의 내용 및 답변
              </h3>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                문의 내용
              </label>
              <textarea
                disabled={isWeb}
                className="flex w-full flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400 resize-none min-h-[100px] transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                placeholder="지점 관련 문의 및 요청 사항을 입력해주세요."
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            {editingCs && (
              <div className="space-y-3 flex-[2] flex flex-col pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Reply Form (Hidden in Web Mode) */}
                {!isWeb && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors"
                      placeholder="답변이나 처리 이력을 입력하세요..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className="inline-flex h-9 px-3.5 items-center justify-center rounded-md bg-emerald-600 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 transition-colors cursor-pointer"
                    >
                      {editingReplyId ? '수정' : '등록'}
                    </button>
                    {editingReplyId && (
                      <button
                        type="button"
                        onClick={() => { setEditingReplyId(null); setReplyContent(''); }}
                        className="inline-flex h-9 px-3 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        취소
                      </button>
                    )}
                  </div>
                )}

                {/* Replies Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden dark:border-slate-800 flex-1 overflow-y-auto">
                  <table className="w-full text-xs text-left relative">
                    <thead className="bg-emerald-50/60 text-emerald-900 uppercase dark:bg-slate-900 dark:text-slate-400 border-b border-emerald-100 dark:border-slate-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-28 font-semibold">작성일시</th>
                        <th className="px-3 py-2 font-semibold">내용</th>
                        {!isWeb && <th className="px-3 py-2 w-16 text-center font-semibold">관리</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                      {editingCs.replies && editingCs.replies.length > 0 ? (
                        editingCs.replies.map((reply) => (
                          <tr key={reply.id} className="hover:bg-emerald-50/30 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(reply.createdAt).toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 break-words max-w-xs">
                              {reply.content}
                            </td>
                            {!isWeb && (
                              <td className="px-3 py-2.5">
                                <div className="flex justify-center gap-1">
                                  <button type="button" onClick={() => handleEditReply(reply)} className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                                    <Pencil size={13} />
                                  </button>
                                  <button type="button" onClick={() => handleDeleteReply(reply.id)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={isWeb ? 2 : 3} className="px-3 py-6 text-center text-slate-400 text-xs">등록된 답변이 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area: 출고 항목 */}
        <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                출고 항목 및 정산
              </h3>
            </div>
            {!isWeb && (
              <button
                type="button"
                onClick={handleAddShippedItem}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                항목 추가
              </button>
            )}
          </div>

          {form.items.length > 0 ? (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    disabled={isWeb}
                    className="flex h-9 flex-1 min-w-0 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                    required
                    value={item.name}
                    onChange={(e) => {
                      const selectedName = e.target.value
                      const sItem = stockItems.find((s) => s.name === selectedName)
                      if (sItem) {
                        setForm((current) => {
                          const nextItems = [...current.items]
                          nextItems[idx] = {
                            name: sItem.name,
                            price: sItem.price,
                            count: 1
                          }
                          return { ...current, items: nextItems }
                        })
                      } else {
                        handleUpdateShippedItem(idx, 'name', '')
                      }
                    }}
                  >
                    <option value="">품목 선택</option>
                    {stockItems.map((sItem) => {
                      const countInCurrentFormOtherRows = form.items
                        .filter((_, i) => i !== idx)
                        .filter((i) => i.name === sItem.name)
                        .reduce((sum, i) => sum + (i.count || 0), 0)

                      const savedInBranch = editingCs?.items?.find((i) => i.name === sItem.name)?.count || 0
                      const availableStock = sItem.count + savedInBranch - countInCurrentFormOtherRows
                      const isDisabled = availableStock <= 0 && item.name !== sItem.name

                      return (
                        <option key={sItem.id} value={sItem.name} disabled={isDisabled}>
                          {sItem.name} (재고: {availableStock}개)
                        </option>
                      )
                    })}
                  </select>

                  <input
                    disabled={isWeb}
                    className="flex h-9 w-24 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                    placeholder="단가"
                    required
                    type="number"
                    min={0}
                    value={item.price !== undefined && item.price !== null ? item.price : ''}
                    onChange={(e) => handleUpdateShippedItem(idx, 'price', Number(e.target.value))}
                  />

                  {!isWeb && (
                    <button
                      type="button"
                      onClick={() => {
                        const originalPrice = stockItems.find((s) => s.name === item.name)?.price || 0
                        const nextPrice = item.price === 0 ? originalPrice : 0
                        handleUpdateShippedItem(idx, 'price', nextPrice)
                      }}
                      disabled={!item.name}
                      className={`h-9 px-3 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                        item.price === 0
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      무상
                    </button>
                  )}

                  <input
                    disabled={isWeb}
                    className="flex h-9 w-16 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
                    placeholder="수량"
                    required
                    type="number"
                    min={1}
                    max={(() => {
                      const sItem = stockItems.find((s) => s.name === item.name)
                      if (!sItem) return 1
                      const savedInBranch = editingCs?.items?.find((i) => i.name === item.name)?.count || 0
                      const countInCurrentFormOtherRows = form.items
                        .filter((_, i) => i !== idx)
                        .filter((i) => i.name === item.name)
                        .reduce((sum, i) => sum + (i.count || 0), 0)
                      return sItem.count + savedInBranch - countInCurrentFormOtherRows
                    })()}
                    value={item.count || ''}
                    onChange={(e) => handleUpdateShippedItem(idx, 'count', Number(e.target.value))}
                  />

                  {!isWeb && (
                    <button
                      type="button"
                      onClick={() => handleRemoveShippedItem(idx)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              등록된 출고 항목이 없습니다.
            </div>
          )}

          {form.items.length > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3.5 text-right text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 space-y-1">
              <div>
                <span>공급가액: </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {itemsSummary.subtotal.toLocaleString()}원
                </span>
              </div>
              <div>
                <span>부가세 (10%): </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {itemsSummary.vat.toLocaleString()}원
                </span>
              </div>
              <div className="text-sm border-t border-emerald-200/60 dark:border-slate-800 pt-2 mt-2 flex justify-between font-medium">
                <span>합계금액 (VAT 포함): </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {itemsSummary.total.toLocaleString()}원
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isWeb ? '닫기' : '취소'}
          </button>
          {!isWeb && (
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              저장
            </button>
          )}
        </div>
      </form>
    </BaseModal>
  )
}
