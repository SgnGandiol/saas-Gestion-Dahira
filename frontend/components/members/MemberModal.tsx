'use client'

import { useState } from 'react'
import { useMutation, ApolloError } from '@apollo/client/react'
import { X } from 'lucide-react'
import { MemberForm, MemberFormData } from './MemberForm'
import { CREATE_MEMBER, UPDATE_MEMBER } from '@/graphql/mutations/members'
import { Member } from '@/types'

interface MemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  dahiraId: string
  member?: Member
}

export function MemberModal({ isOpen, onClose, onSuccess, dahiraId, member }: MemberModalProps) {
  const [error, setError] = useState('')

  const [createMember, { loading: createLoading }] = useMutation(CREATE_MEMBER, {
    onCompleted: () => {
      onSuccess()
      onClose()
    },
    onError: (err: ApolloError) => {
      setError((err as ApolloError).graphQLErrors?.[0]?.message ?? 'Erreur lors de la création')
    },
  })

  const [updateMember, { loading: updateLoading }] = useMutation(UPDATE_MEMBER, {
    onCompleted: () => {
      onSuccess()
      onClose()
    },
    onError: (err: ApolloError) => {
      setError((err as ApolloError).graphQLErrors?.[0]?.message ?? 'Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (data: MemberFormData) => {
    setError('')

    if (!member && !dahiraId) {
      setError('Aucune Dahira associée à votre compte.')
      return
    }

    if (member) {
      // Édition
      updateMember({
        variables: {
          id: member.id,
          ...data,
          phone: data.phone || null,
          email: data.email || null,
          profession: data.profession || null,
        },
      })
    } else {
      // Création
      createMember({
        variables: {
          dahira_id: dahiraId,
          ...data,
          phone: data.phone || null,
          email: data.email || null,
          profession: data.profession || null,
        },
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {member ? 'Modifier un membre' : 'Ajouter un membre'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <MemberForm
            member={member}
            onSubmit={handleSubmit}
            isLoading={createLoading || updateLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
