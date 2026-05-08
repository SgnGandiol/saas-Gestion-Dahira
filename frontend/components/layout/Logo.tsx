import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt="SGD Logo"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
      priority
    />
  )
}
