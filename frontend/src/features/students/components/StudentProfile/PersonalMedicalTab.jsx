import React from 'react'
import {
  User,
  Shield,
  HeartPulse,
  Phone,
  Edit3,
  Save,
  AlertCircle,
} from 'lucide-react'
import { formatDate } from '../../../../lib/formatters'
import Button from '../../../../components/ui/Button'
import PersonalMedicalEditForm from './PersonalMedicalEditForm'
import PersonalMedicalView from './PersonalMedicalView'

export default function PersonalMedicalTab({
  student,
  editMode,
  editForm,
  setEditForm,
  savingProfile,
  onSaveProfile,
  onCancelEdit,
  onStartEdit,
  calculateAge,
}) {
  return (
    <div className="space-y-6">
      {/* Edit Mode Top Banner */}
      {editMode && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 text-xs font-semibold">
            <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              You are in <strong>Inline Edit Mode</strong>. Modify the details below and click{' '}
              <strong>Save Changes</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Save}
              onClick={onSaveProfile}
              loading={savingProfile}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {!editMode ? (
        /* ── VIEW MODE ───────────────────────────────────────────── */
        <PersonalMedicalView student={student} calculateAge={calculateAge} onStartEdit={onStartEdit} />
      ) : (
        /* ── INLINE EDIT MODE ─────────────────────────────────────── */
        <PersonalMedicalEditForm
          student={student}
          editForm={editForm}
          setEditForm={setEditForm}
          savingProfile={savingProfile}
          onSaveProfile={onSaveProfile}
          onCancelEdit={onCancelEdit}
        />
      )}
    </div>
  )
}
