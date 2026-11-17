import api from '../../../lib/axios'
import { logError } from '../../../lib/logger'

export function useProfileEditing({ toast, initEditForm, student, setStudent, setEditMode, editForm, setEditForm, setSavingProfile }) {
  const handleEditPhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be less than 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setEditForm((prev) => ({ ...prev, photoUrl: event.target.result }))
      toast.success('Photo uploaded')
    }
    reader.readAsDataURL(file)
  }

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    if (!editForm.fullName?.trim()) {
      toast.error('Student Full Name is required')
      return
    }
    if (!editForm.dob) {
      toast.error('Date of Birth is required')
      return
    }

    setSavingProfile(true)
    try {
      const isFatherAlive = editForm.fatherStatus === 'Alive'
      const payload = {
        fullName: editForm.fullName.trim(),
        dob: editForm.dob,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        bFormNumber: editForm.bFormNumber,
        nationality: editForm.nationality,
        religion: editForm.religion,
        address: editForm.address,
        city: editForm.city,
        previousSchool: editForm.previousSchool,
        fatherName: editForm.fatherName.trim(),
        photoUrl: editForm.photoUrl,
        guardian: {
          name: isFatherAlive
            ? editForm.fatherName || editForm.guardianName
            : editForm.guardianName || editForm.fatherName,
          phone: editForm.guardianPhone,
          email: editForm.guardianEmail,
          relationship: isFatherAlive
            ? 'Father'
            : editForm.guardianRelationship || 'Guardian',
          cnic: editForm.guardianCnic,
          occupation: editForm.guardianOccupation,
        },
        emergencyContact: {
          name:
            editForm.emergencyName || editForm.guardianName || editForm.fatherName,
          phone: editForm.emergencyPhone || editForm.guardianPhone,
          relationship:
            editForm.emergencyRel || (isFatherAlive ? 'Father' : 'Guardian'),
        },
        medicalNotes: editForm.medicalNotes,
      }

      const res = await api.put(`/students/${student._id}`, payload)
      if (res.data?.success) {
        toast.success('Student profile updated successfully!')
        setStudent(res.data.data)
        initEditForm(res.data.data)
        setEditMode(false)
      }
    } catch (err) {
      logError(err)
      toast.error(err.response?.data?.message || 'Failed to update student profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    initEditForm(student)
    setEditMode(false)
  }

  return { handleEditPhotoUpload, handleSaveProfile, handleCancelEdit }
}
