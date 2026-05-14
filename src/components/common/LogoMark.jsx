import { HandHeart } from 'lucide-react'

export default function LogoMark({ size = 'md', variant = 'default' }) {
  const sizeClass = size === 'sm' ? 'h-11 w-11 rounded-2xl' : 'h-12 w-12 rounded-3xl'
  const iconSize = size === 'sm' ? 21 : 25
  const variantClass = variant === 'light'
    ? 'bg-white text-forest shadow-[0_18px_42px_-26px_rgba(20,83,45,0.65)] ring-1 ring-green-100'
    : 'bg-gradient-to-br from-forest to-leaf text-white shadow-soft'

  return (
    <div className={`relative flex ${sizeClass} items-center justify-center ${variantClass}`} aria-hidden="true">
      <HandHeart size={iconSize} strokeWidth={2.35} />
      <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-300" />
    </div>
  )
}
