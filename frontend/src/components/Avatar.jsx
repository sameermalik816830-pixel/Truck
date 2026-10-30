import { useEffect, useState } from 'react'
import { UserCircle } from 'lucide-react'
import { FILE_BASE } from '../api/client.js'

export default function Avatar({ src, name = '', size = 32, className = '' }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [src])

  if (src && !broken) {
    return (
      <img
        className={`avatar-img ${className}`}
        src={`${FILE_BASE}${src}`}
        alt={name ? `${name}'s profile picture` : 'Profile picture'}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    )
  }
  return <UserCircle size={size} strokeWidth={1.6} className={className} aria-hidden="true" />
}
