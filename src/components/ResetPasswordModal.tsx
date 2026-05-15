'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ResetPasswordModalProps {
  onConfirm: (newPassword: string) => Promise<void>
}

function translateError(msg: string): string {
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('weak_password') || msg.includes('Weak password')) return 'Contraseña demasiado débil, usá una más segura'
  if (msg.includes('New password should be different')) return 'La nueva contraseña debe ser diferente a la anterior'
  return msg
}

export const ResetPasswordModal = ({ onConfirm }: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
  const passwordsDontMatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await onConfirm(newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-surface3 border border-surface3 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold2/50 transition text-sm'

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-surface2 border-2 border-gold2/50 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 32 }}
      >
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-gold2/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-display text-gold2 uppercase tracking-wide mb-1">Nueva contraseña</h2>
          <p className="text-xs text-gray-600">Elegí una contraseña segura para tu cuenta</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-green-400 font-semibold">¡Contraseña actualizada!</p>
            <p className="text-xs text-gray-600">Ya podés usar tu cuenta con tu nueva contraseña.</p>
            <p className="text-xs text-gray-700">La página se actualizará automáticamente...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null) }}
                placeholder="Mínimo 6 caracteres"
                className={inputClass}
                disabled={loading}
                autoFocus
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                  placeholder="Repetí la contraseña"
                  className={`${inputClass} ${
                    passwordsMatch ? 'border-green-600/50' : passwordsDontMatch ? 'border-red-600/50' : ''
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                {passwordsMatch && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-400">✓</span>
                )}
                {passwordsDontMatch && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400">✗</span>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full bg-gradient-to-r from-gold to-gold2 text-dark font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-gold/30 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide mt-2"
            >
              {loading ? 'Guardando...' : 'Establecer contraseña'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
