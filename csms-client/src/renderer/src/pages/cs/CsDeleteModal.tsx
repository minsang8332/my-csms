import BaseModal from '../../components/modal/BaseModal'
import type { CsBranch } from '../../../../shared/api'

type CsDeleteModalProps = {
  deletingCs: CsBranch | null
  setDeletingCs: (cs: CsBranch | null) => void
  onConfirm: () => Promise<void>
}

export default function CsDeleteModal({ deletingCs, setDeletingCs, onConfirm }: CsDeleteModalProps) {
  if (!deletingCs) return null

  return (
    <BaseModal
      open={Boolean(deletingCs)}
      title="지점 삭제"
      widthClassName="max-w-md"
      heightClassName="h-auto"
      onClose={() => setDeletingCs(null)}
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          정말로 [{deletingCs.name}] 지점을 삭제하시겠습니까?
        </p>

        <div className="flex justify-end gap-2">
          <button
            className="h-10 rounded-md border border-emerald-100/80 bg-white/50 px-4 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
            type="button"
            onClick={() => setDeletingCs(null)}
          >
            취소
          </button>
          <button
            className="h-10 rounded-md bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700"
            type="button"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
