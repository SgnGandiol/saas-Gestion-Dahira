import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dir, '..', 'public')

const svg         = readFileSync(resolve(PUBLIC, 'icons', 'icon.svg'))
const svgMaskable = readFileSync(resolve(PUBLIC, 'icons', 'icon-maskable.svg'))

const icons = [
  { src: svg,         out: 'icon-192.png',            size: 192 },
  { src: svg,         out: 'icon-512.png',            size: 512 },
  { src: svgMaskable, out: 'icon-maskable-192.png',   size: 192 },
  { src: svgMaskable, out: 'icon-maskable-512.png',   size: 512 },
  { src: svg,         out: 'apple-touch-icon.png',    size: 180 },
  { src: svg,         out: 'favicon-32.png',          size:  32 },
]

for (const { src, out, size } of icons) {
  await sharp(src)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(PUBLIC, 'icons', out))
  console.log(`✓ ${out} (${size}×${size})`)
}
