'use client'

import {useCallback, useState} from 'react'
import {UseFormReturn} from 'react-hook-form'

import {Session} from 'next-auth'

import {StudentDocument} from '@/types/mongoose'
import {Student} from '@/types/user'
import {FormFields, SelectionModeType} from '@/types/writeMessage'

import {RecipientForAdmin} from '@/components/admin/molecules/client/MessageRecipientSelectionForAdmin'
import {RecipientForStudent} from '@/components/molecules/client/MessageRecipientSelectionForStudent'
import {RecipientForTeacher} from '@/components/molecules/client/MessageRecipientSelectionForTeacher'

interface RecipientSelectionProps {
  form: UseFormReturn<FormFields>
  session: Session | null
  onValidEmailsChange: (emails: string[]) => void
  userRole: string | undefined
}

export const RecipientSelection = ({
  form,
  session,
  onValidEmailsChange,
  userRole,
}: RecipientSelectionProps) => {
  const [selectionMode, setSelectionMode] = useState<SelectionModeType>(null)

  const handleSelectionMode = useCallback(
    (mode: SelectionModeType, students: Student[] | StudentDocument[]) => {
      setSelectionMode(mode)

      if (!students) return

      if (mode === 'all') {
        const studentIds = students.map((s) => (s._id as any).toString()) ?? []
        form.setValue('recipients', studentIds)
      } else {
        form.setValue('recipients', []) // Réinitialisation si le mode n'est pas 'all'
      }
    },
    [form],
  )

  return (
    <div className="space-y-4">
      {userRole === 'student' && (
        <RecipientForStudent
          onValidEmailsChange={onValidEmailsChange}
          form={form}
          session={session}
        />
      )}

      {userRole === 'teacher' && (
        <RecipientForTeacher
          selectionMode={selectionMode}
          handleSelectionMode={handleSelectionMode}
          onValidEmailsChange={onValidEmailsChange}
          form={form}
          session={session}
        />
      )}

      {userRole === 'bureau' ||
        (userRole === 'admin' && (
          <RecipientForAdmin
            selectionMode={selectionMode}
            handleSelectionMode={handleSelectionMode}
            onValidEmailsChange={onValidEmailsChange}
            form={form}
          />
        ))}
    </div>
  )
}
