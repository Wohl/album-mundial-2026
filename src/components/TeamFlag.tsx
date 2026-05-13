'use client'

import { TEAM_ISO2 } from '@/lib/teamFlags'

/**
 * Renders a flag-icons SVG flag for a given album team code (MEX, ARG, etc.)
 * Size is controlled via className: 'text-sm', 'text-xl', 'text-4xl', etc.
 */
export const TeamFlag = ({
  code,
  className = 'text-xl',
}: {
  code: string
  className?: string
}) => {
  const iso2 = TEAM_ISO2[code]
  if (!iso2) return null
  return (
    <span
      className={`fi fi-${iso2} rounded-sm shrink-0 ${className}`}
      role="img"
      aria-label={code}
    />
  )
}

/**
 * Renders a flag for a sticker key (e.g. 'MEX_5', 'ARG_0').
 * Returns null for intro stickers that have no team code.
 */
export const StickerFlag = ({
  stickerKey,
  className = 'text-xl',
}: {
  stickerKey: string
  className?: string
}) => {
  const underscore = stickerKey.indexOf('_')
  if (underscore === -1) return null
  return <TeamFlag code={stickerKey.slice(0, underscore)} className={className} />
}
