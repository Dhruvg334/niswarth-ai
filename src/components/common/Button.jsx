import { Link } from 'react-router-dom'

export default function Button({ children, to, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus-ring'
  const variants = {
    primary: 'bg-forest text-white shadow-soft hover:bg-emerald-900',
    secondary: 'border border-green-200 bg-white/80 text-forest hover:bg-green-50',
    light: 'bg-white text-forest shadow-[0_16px_35px_-24px_rgba(255,255,255,0.9)] hover:bg-green-50',
    ghost: 'text-forest hover:bg-green-50',
  }
  const classes = `${base} ${variants[variant]} ${className}`

  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>
  return <button className={classes} {...props}>{children}</button>
}
