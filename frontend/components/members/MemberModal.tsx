'use client'

import { useRef, useState, useEffect } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { X, Home, Plus, CheckCircle, AlertTriangle } from 'lucide-react'
import { MemberForm, MemberFormData } from './MemberForm'
import { ImageCropper } from './ImageCropper'
import { CREATE_MEMBER, UPDATE_MEMBER } from '@/graphql/mutations/members'
import { CREATE_HOUSE } from '@/graphql/mutations/families'
import { GET_HOUSES } from '@/graphql/queries/families'
import { GET_MEMBER_CATEGORIES } from '@/graphql/queries/categories'
import { Member, House, MemberCategory } from '@/types'

// Backend base URL derived from GraphQL endpoint
const BACKEND = (process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:8081/graphql').replace('/graphql', '')

interface MemberModalProps {
  isOpen:    boolean
  onClose:   () => void
  onSuccess: () => void
  dahiraId:  string
  member?:   Member
}

export function MemberModal({ isOpen, onClose, onSuccess, dahiraId, member }: MemberModalProps) {
  const [error, setError]   = useState('')
  const [houseId, setHouseId] = useState(member?.house?.id ?? '')

  // Photo state
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const [rawImageSrc, setRawImageSrc]     = useState<string | null>(null)   // file blob URL → cropper
  const [photoBlob, setPhotoBlob]         = useState<Blob | null>(null)     // confirmed cropped blob
  const [photoPreview, setPhotoPreview]   = useState<string>(              // shown in form
    member?.photo_url
      ? (member.photo_url.startsWith('http') ? member.photo_url : BACKEND + member.photo_url)
      : ''
  )
  const [photoUploading, setPhotoUploading] = useState(false)

  // Reset photo + house state whenever the targeted member changes
  useEffect(() => {
    setHouseId(member?.house?.id ?? '')
    setPhotoBlob(null)
    setRawImageSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setPhotoPreview(
      member?.photo_url
        ? (member.photo_url.startsWith('http') ? member.photo_url : BACKEND + member.photo_url)
        : ''
    )
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id])

  // House form state
  const [showHouseForm, setShowHouseForm]       = useState(false)
  const [houseLabel,        setHouseLabel]        = useState('')
  const [houseAddress,      setHouseAddress]      = useState('')
  const [houseNeighborhood, setHouseNeighborhood] = useState('')
  const [houseCapacity,     setHouseCapacity]     = useState('')
  const [houseError,        setHouseError]        = useState('')

  // ── Queries ──────────────────────────────────────────────────
  const { data: housesData, refetch: refetchHouses } = useQuery(GET_HOUSES, {
    variables: { dahira_id: dahiraId, first: 100, page: 1 },
    skip: !dahiraId,
  })
  const houses: House[] = housesData?.houses?.data ?? []

  const { data: categoriesData } = useQuery(GET_MEMBER_CATEGORIES, {
    variables: { dahira_id: dahiraId },
    skip: !dahiraId,
  })
  const categories: MemberCategory[] = categoriesData?.memberCategories ?? []

  // ── Mutations ────────────────────────────────────────────────
  const [createMember, { loading: createLoading }] = useMutation(CREATE_MEMBER, {
    onCompleted: () => { onSuccess(); handleClose() },
    onError: (err: any) => setError(err.graphQLErrors?.[0]?.message ?? 'Erreur lors de la création'),
  })

  const [updateMember, { loading: updateLoading }] = useMutation(UPDATE_MEMBER, {
    onCompleted: () => { onSuccess(); handleClose() },
    onError: (err: any) => setError(err.graphQLErrors?.[0]?.message ?? 'Erreur lors de la mise à jour'),
  })

  const [createHouse, { loading: houseLoading }] = useMutation(CREATE_HOUSE, {
    onCompleted: (d: any) => {
      refetchHouses().then(() => {
        setHouseId(d.createHouse.id)
        setShowHouseForm(false)
        resetHouseForm()
      })
    },
    onError: (err: any) => setHouseError(err.graphQLErrors?.[0]?.message ?? 'Erreur création maison'),
  })

  // ── Photo helpers ────────────────────────────────────────────
  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Revoke previous raw src
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc)
    setRawImageSrc(URL.createObjectURL(file))
    // Reset input so same file can be reselected
    e.target.value = ''
  }

  function handleCropConfirm(blob: Blob, preview: string) {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoBlob(blob)
    setPhotoPreview(preview)
    setRawImageSrc(null)
  }

  function handleCropCancel() {
    if (rawImageSrc) { URL.revokeObjectURL(rawImageSrc); setRawImageSrc(null) }
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoBlob) return null
    setPhotoUploading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sgd_token') : null
      const fd = new FormData()
      fd.append('file', photoBlob, 'avatar.jpg')
      const res = await fetch(`${BACKEND}/api/member-photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const json = await res.json()
      return json.url as string
    } catch (err: any) {
      setError('Erreur lors de l\'upload de la photo : ' + err.message)
      return null
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Member submit ─────────────────────────────────────────────
  async function handleMemberSubmit(data: MemberFormData) {
    setError('')
    let photoUrl: string | null | undefined = member?.photo_url ?? null
    if (photoBlob) {
      photoUrl = await uploadPhoto()
      if (photoUrl === null && photoBlob) return // upload failed, error already set
    }

    const vars: any = {
      house_id:           houseId || null,
      member_category_id: data.member_category_id || null,
      first_name:         data.first_name,
      last_name:          data.last_name,
      phone:              data.phone     || null,
      email:              data.email     || null,
      gender:             data.gender,
      profession:         data.profession || null,
      photo_url:          photoUrl,
    }

    if (member) {
      updateMember({ variables: { id: member.id, ...vars } })
    } else {
      createMember({ variables: { dahira_id: dahiraId, ...vars } })
    }
  }

  // ── House helpers ─────────────────────────────────────────────
  function handleCreateHouse() {
    setHouseError('')
    if (!houseAddress.trim()) { setHouseError("L'adresse est requise"); return }
    createHouse({
      variables: {
        dahira_id:    dahiraId,
        label:        houseLabel.trim()        || undefined,
        address:      houseAddress.trim(),
        neighborhood: houseNeighborhood.trim() || undefined,
        capacity:     houseCapacity ? parseInt(houseCapacity) : undefined,
      },
    })
  }

  function resetHouseForm() {
    setHouseLabel(''); setHouseAddress(''); setHouseNeighborhood(''); setHouseCapacity(''); setHouseError('')
  }

  function handleClose() {
    onClose()
    setError('')
    setHouseId(member?.house?.id ?? '')
    setShowHouseForm(false)
    resetHouseForm()
    setPhotoBlob(null)
    setRawImageSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setPhotoPreview(
      member?.photo_url
        ? (member.photo_url.startsWith('http') ? member.photo_url : BACKEND + member.photo_url)
        : ''
    )
  }

  if (!isOpen) return null

  const isSubmitting = createLoading || updateLoading || photoUploading

  const AVATAR_COLORS = ['bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-teal-500']
  const avatarColor   = member ? AVATAR_COLORS[member.first_name.charCodeAt(0) % AVATAR_COLORS.length] : 'bg-emerald-600'

  return (
    <>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handleFileInputChange} />

      {/* Crop overlay (above the modal) */}
      {rawImageSrc && (
        <ImageCropper
          imageSrc={rawImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Main modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <div className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${member ? avatarColor : 'bg-emerald-600'}`}>
                {member?.photo_url ? (
                  <img
                    src={member.photo_url.startsWith('http') ? member.photo_url : BACKEND + member.photo_url}
                    alt="avatar"
                    className="h-full w-full object-cover rounded-2xl"
                  />
                ) : member ? (
                  <span className="text-white font-bold text-lg">{member.first_name.charAt(0).toUpperCase()}</span>
                ) : (
                  <Plus className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  {member ? `Modifier · ${member.full_name}` : 'Nouveau membre'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {member ? 'Modifiez les informations du membre' : 'Remplissez les informations ci-dessous'}
                </p>
              </div>
              <button onClick={handleClose}
                className="shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4">
            <MemberForm
              member={member}
              houses={houses}
              categories={categories}
              houseId={houseId}
              photoPreview={photoPreview}
              onHouseChange={setHouseId}
              onCreateHouse={() => { setShowHouseForm(true); setHouseError('') }}
              onPhotoClick={() => fileInputRef.current?.click()}
              onSubmit={handleMemberSubmit}
              isLoading={isSubmitting}
              error={error}
            />

            {/* Inline house creation */}
            {showHouseForm && (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shrink-0">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Nouvelle maison</p>
                      <p className="text-[11px] text-emerald-600">Assignée automatiquement au membre</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowHouseForm(false); resetHouseForm() }} disabled={houseLoading}
                    className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg p-1.5 transition-colors disabled:opacity-40">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {houseError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{houseError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-1">Libellé</label>
                    <input type="text" placeholder="ex: Maison Diaw" value={houseLabel}
                      onChange={e => setHouseLabel(e.target.value)} disabled={houseLoading}
                      className="h-9 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-1">Capacité</label>
                    <input type="number" placeholder="40" min={1} value={houseCapacity}
                      onChange={e => setHouseCapacity(e.target.value)} disabled={houseLoading}
                      className="h-9 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none disabled:opacity-60" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                    Adresse <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input type="text" placeholder="Rue 10, Dakar" value={houseAddress}
                    onChange={e => setHouseAddress(e.target.value)} disabled={houseLoading}
                    className="h-9 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-1">Quartier</label>
                  <input type="text" placeholder="Médina, Plateau..." value={houseNeighborhood}
                    onChange={e => setHouseNeighborhood(e.target.value)} disabled={houseLoading}
                    className="h-9 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none disabled:opacity-60" />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => { setShowHouseForm(false); resetHouseForm() }}
                    disabled={houseLoading}
                    className="flex-1 h-10 rounded-xl border-2 border-emerald-200 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                    Annuler
                  </button>
                  <button type="button" onClick={handleCreateHouse} disabled={houseLoading}
                    className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {houseLoading ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <><CheckCircle className="h-3.5 w-3.5" /> Créer la maison</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
