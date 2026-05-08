'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react'

// ── Canvas helper (handles rotation correctly) ─────────────────
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = url   // no crossOrigin — blob URLs are always same-origin
  })
}

export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<Blob> {
  const image = await loadImage(imageSrc)

  // Step 1 – draw the whole image on a "safe" canvas big enough to contain any rotation
  const maxDim  = Math.max(image.width, image.height)
  const safeArea = Math.ceil(2 * ((maxDim / 2) * Math.sqrt(2)))

  const rotCanvas = document.createElement('canvas')
  rotCanvas.width  = safeArea
  rotCanvas.height = safeArea
  const rotCtx = rotCanvas.getContext('2d')!
  rotCtx.translate(safeArea / 2, safeArea / 2)
  rotCtx.rotate((rotation * Math.PI) / 180)
  rotCtx.translate(-safeArea / 2, -safeArea / 2)
  rotCtx.drawImage(
    image,
    safeArea / 2 - image.width  / 2,
    safeArea / 2 - image.height / 2,
  )

  // Step 2 – read back the pixel data from the full rotated canvas
  const imageData = rotCtx.getImageData(0, 0, safeArea, safeArea)

  // Step 3 – extract just the crop rectangle
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width  = pixelCrop.width
  cropCanvas.height = pixelCrop.height
  const cropCtx = cropCanvas.getContext('2d')!
  cropCtx.putImageData(
    imageData,
    Math.round(0 - safeArea / 2 + image.width  * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y),
  )

  // Step 4 – scale to 400×400 output
  const SIZE = 400
  const out  = document.createElement('canvas')
  out.width  = SIZE
  out.height = SIZE
  const outCtx = out.getContext('2d')!
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(cropCanvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, SIZE, SIZE)

  return new Promise<Blob>((resolve, reject) =>
    out.toBlob(
      b => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/jpeg',
      0.88,
    ),
  )
}

// ── Component ──────────────────────────────────────────────────
interface ImageCropperProps {
  imageSrc:  string
  onConfirm: (blob: Blob, preview: string) => void
  onCancel:  () => void
}

export function ImageCropper({ imageSrc, onConfirm, onCancel }: ImageCropperProps) {
  const [crop,   setCrop]   = useState({ x: 0, y: 0 })
  const [zoom,   setZoom]   = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [cropError, setCropError]   = useState('')

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    setCropError('')
    try {
      const blob    = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation)
      const preview = URL.createObjectURL(blob)
      onConfirm(blob, preview)
    } catch (e: any) {
      setCropError('Erreur de recadrage : ' + (e?.message ?? 'inconnue'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
          <p className="text-sm font-bold text-white">Recadrer la photo</p>
          <button onClick={onCancel} disabled={processing}
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg p-1.5 transition-colors disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop zone — explicit inline dimensions required by react-easy-crop */}
        <div style={{ position: 'relative', width: '100%', height: 300, background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Error */}
        {cropError && (
          <p className="mx-5 mt-3 rounded-lg bg-red-900/50 border border-red-700 px-3 py-2 text-xs text-red-300">
            {cropError}
          </p>
        )}

        {/* Controls */}
        <div className="px-5 pt-4 pb-2 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-gray-400 shrink-0" />
            <input type="range" min={1} max={3} step={0.02}
              value={zoom} onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-emerald-500 cursor-pointer" />
            <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-gray-400 shrink-0" />
            <input type="range" min={-180} max={180} step={1}
              value={rotation} onChange={e => setRotation(Number(e.target.value))}
              className="flex-1 accent-blue-500 cursor-pointer" />
            <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{rotation}°</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5 pt-2">
          <button onClick={onCancel} disabled={processing}
            className="flex-1 h-10 rounded-xl border border-gray-600 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40">
            Annuler
          </button>
          <button onClick={handleConfirm} disabled={processing || !croppedAreaPixels}
            className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {processing
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <><Check className="h-4 w-4" /> Confirmer</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}
