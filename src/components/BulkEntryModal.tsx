'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllStickers, displayKey, parseInputKey } from '@/lib/stickers'

interface BulkEntryModalProps {
  onConfirm: (ids: string[]) => void
  onClose: () => void
}

export const BulkEntryModal = ({ onConfirm, onClose }: BulkEntryModalProps) => {
  const [input, setInput] = useState('')

  const allIds = useMemo(() => new Set(getAllStickers().map((s) => s.id)), [])

  const parsed = useMemo(() => {
    const parts = input
      .split(/[\s,;/\n]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean)
    const valid: string[] = []
    const invalid: string[] = []
    const seen = new Set<string>()
    parts.forEach((p) => {
      const internalKey = parseInputKey(p)
      if (allIds.has(internalKey)) {
        if (!seen.has(internalKey)) { valid.push(internalKey); seen.add(internalKey) }
      } else {
        invalid.push(p)
      }
    })
    return { valid, invalid }
  }, [input, allIds])

  const handleConfirm = () => {
    if (parsed.valid.length === 0) return
    onConfirm(parsed.valid)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />

        <motion.div
          className="relative bg-surface2 border border-gold2/30 rounded-2xl shadow-2xl w-full max-w-lg"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="p-5 border-b border-surface3">
            <h2 className="text-xl font-display text-gold2 uppercase">Entrada rápida</h2>
            <p className="text-gray-400 text-sm mt-1">
              Ingresá los códigos separados por coma, espacio o nueva línea
            </p>
          </div>

          <div className="p-5 space-y-4">
            <textarea
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'Ejemplos:\nMEX_1, MEX_3, MEX_5\nARG_1 BRA_7 FWC1\nFWC2'}
              rows={5}
              className="w-full bg-surface3 border border-surface3/80 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold2/40 transition resize-none font-mono"
            />

            {(parsed.valid.length > 0 || parsed.invalid.length > 0) && (
              <div className="space-y-3">
                {parsed.valid.length > 0 && (
                  <div>
                    <p className="text-xs text-green-400 font-semibold mb-2">
                      ✓ {parsed.valid.length} figurita{parsed.valid.length !== 1 ? 's' : ''} reconocida{parsed.valid.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {parsed.valid.map((id) => (
                        <span
                          key={id}
                          className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono"
                        >
                          {displayKey(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {parsed.invalid.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-2">
                      ✗ {parsed.invalid.length} no reconocida{parsed.invalid.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.invalid.slice(0, 20).map((id, i) => (
                        <span
                          key={i}
                          className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono"
                        >
                          {id}
                        </span>
                      ))}
                      {parsed.invalid.length > 20 && (
                        <span className="text-xs text-red-400">+{parsed.invalid.length - 20} más</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-gray-600">
              Formato: <span className="font-mono text-gray-500">CÓDIGO_EQUIPO_NÚMERO</span> · Ej: <span className="font-mono text-gray-400">MEX_1, ARG_1, FWC3</span>
            </div>
          </div>

          <div className="p-5 border-t border-surface3 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface3 hover:bg-gray-600 text-white font-bold rounded-xl text-sm uppercase transition"
            >
              Cancelar
            </button>
            <button
              disabled={parsed.valid.length === 0}
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-gradient-to-r from-gold to-gold2 text-dark font-bold rounded-xl text-sm uppercase transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Marcar {parsed.valid.length > 0 ? parsed.valid.length : ''} como Tengo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
