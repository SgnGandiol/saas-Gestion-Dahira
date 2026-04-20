'use client'

import { useState } from 'react'
import { useMutation, ApolloError } from '@apollo/client/react'
import { X, Copy, CheckCircle } from 'lucide-react'
import { DahiraForm, DahiraFormData } from './DahiraForm'
import { CREATE_DAHIRA, UPDATE_DAHIRA } from '@/graphql/mutations/dahiras'
import { Dahira } from '@/types'

interface AdminCredentials {
  email: string
  password: string
}

interface DahiraModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  dahira?: Dahira
}

export function DahiraModal({ isOpen, onClose, onSuccess, dahira }: DahiraModalProps) {
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null)
  const [copied, setCopied] = useState(false)

  const [createDahira, { loading: createLoading }] = useMutation(CREATE_DAHIRA, {
    onCompleted: (data) => {
      onSuccess()
      setCredentials({
        email: data.createDahira.admin_email,
        password: data.createDahira.admin_password,
      })
    },
    onError: (err: ApolloError) => {
      setError(err.graphQLErrors?.[0]?.message ?? 'Erreur lors de la création')
    },
  })

  const [updateDahira, { loading: updateLoading }] = useMutation(UPDATE_DAHIRA, {
    onCompleted: () => { onSuccess(); onClose() },
    onError: (err: ApolloError) => {
      setError(err.graphQLErrors?.[0]?.message ?? 'Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (data: DahiraFormData) => {
    setError('')
    const variables = {
      ...data,
      city: data.city || null,
      country: data.country || null,
      phone: data.phone || null,
      email: data.email || null,
      description: data.description || null,
    }

    if (dahira) {
      updateDahira({ variables: { id: dahira.id, ...variables } })
    } else {
      createDahira({ variables })
    }
  }

  const handleCopy = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`Email: ${credentials.email}\nMot de passe: ${credentials.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setCredentials(null)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {credentials ? 'Dahira créée' : dahira ? 'Modifier la Dahira' : 'Nouvelle Dahira'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {credentials ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">
                  Dahira créée avec succès. Un compte admin a été généré.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Identifiants de connexion — à transmettre à l'admin
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Email</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{credentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Mot de passe</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{credentials.password}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Ces identifiants ne seront plus affichés. Copiez-les avant de fermer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copié !' : 'Copier les identifiants'}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <DahiraForm
              dahira={dahira}
              onSubmit={handleSubmit}
              isLoading={createLoading || updateLoading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  )
}
