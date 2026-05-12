'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StickerContextMenuProps {
  x: number
  y: number
  onOwned: () => void
  onRepeated: () => void
  onMissing: () => void
  onClose: () => void
}

export const StickerContextMenu = ({
  x,
  y,
  onOwned,
  onRepeated,
  onMissing,
  onClose,
}: StickerContextMenuProps) => {
  const menuItems = [
    { label: '✓ No repetida', onClick: onOwned, hoverClass: 'hover:bg-green-700' },
    { label: '× Repetida', onClick: onRepeated, hoverClass: 'hover:bg-amber-700' },
    { label: '○ Faltante', onClick: onMissing, hoverClass: 'hover:bg-red-700' },
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50"
        style={{ left: x, top: y }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
      >
        <div className="bg-surface2 border-2 border-gold2 rounded-lg shadow-xl overflow-hidden min-w-48">
          {menuItems.map((item, idx) => (
            <motion.button
              key={item.label}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`w-full px-4 py-3 text-white font-semibold text-left transition text-sm uppercase ${item.hoverClass}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    </AnimatePresence>
  )
}
