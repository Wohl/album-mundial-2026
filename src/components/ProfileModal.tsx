'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types'

interface ProfileModalProps {
  profile: Profile
  onChangePassword: (newPassword: string) => Promise<void>
  onUpdateDisplayName: (name: string) => Promise<void>
  onClose: () => void
}

type Section = 'profile' | 'password'

function translateError(msg: string): string {
  if (msg.includes('New password should be different')) return 'La nueva contraseña debe ser diferente a la actual'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('weak_password')) return 'Contraseña demasiado débil'
  return msg
}

export const ProfileModal = ({ profile, onChangePassword, onUpdateDisplayName, onClose }: ProfileModalProps) => {
  const [section, setSection] = useState<Section>('profile')

  // Profile section state
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Password section state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState(false)

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed || trimmed === profile.display_name) return
    setNameError(null)
    setNameSuccess(false)
    setNameLoading(true)
    try {
      await onUpdateDisplayName(trimmed)
      setNameSuccess(true)
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : String(err))
    } finally {
      setNameLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassSuccess(false)
    if (newPassword.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas no coinciden')
      return
    }
    setPassLoading(true)
    try {
      await onChangePassword(newPassword)
      setPassSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setPassError(translateError(err instanceof Error ? err.message : String(err)))
    } finally {
      setPassLoading(false)
    }
  }

  const inputClass =
    'w-full bg-surface3 border border-surface3 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold2/50 transition text-sm'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="bg-surface2 border border-surface3 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 480, damping: 32 }}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-surface3">
            <div className="header-accent" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display text-gold2 uppercase tracking-wide">Mi perfil</h2>
                <p className="text-[11px] text-gray-600 mt-0.5">{profile.display_name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-surface3 transition-all text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 mt-4">
              {(['profile', 'password'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    section === s
                      ? 'bg-gradient-to-r from-gold to-gold2 text-dark'
                      : 'bg-surface3 text-gray-500 hover:text-gray-200 hover:bg-surface4 border border-surface4'
                  }`}
                >
                  {s === 'profile' ? '👤 Datos' : '🔐 Contraseña'}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {section === 'profile' && (
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Nombre visible
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setNameSuccess(false); setNameError(null) }}
                    className={inputClass}
                    maxLength={30}
                    disabled={nameLoading}
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-700 mt-1">Así te ven otros jugadores en el mercado</p>
                </div>

                {nameError && (
                  <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-2.5 text-red-400 text-xs">
                    {nameError}
                  </div>
                )}
                {nameSuccess && (
                  <div className="bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-2.5 text-green-400 text-xs">
                    ✓ Nombre actualizado correctamente
                  </div>
                )}

                <button
                  type="submit"
                  disabled={nameLoading || !displayName.trim() || displayName.trim() === profile.display_name}
                  className="w-full bg-gradient-to-r from-gold to-gold2 text-dark font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-gold/25 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                >
                  {nameLoading ? 'Guardando...' : 'Guardar nombre'}
                </button>
              </form>
            )}

            {section === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPassSuccess(false); setPassError(null) }}
                    placeholder="••••••••"
                    className={inputClass}
                    disabled={passLoading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPassSuccess(false); setPassError(null) }}
                    placeholder="••••••••"
                    className={inputClass}
                    disabled={passLoading}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                {passError && (
                  <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-2.5 text-red-400 text-xs">
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div className="bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-2.5 text-green-400 text-xs">
                    ✓ Contraseña actualizada correctamente
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passLoading || !newPassword || !confirmPassword}
                  className="w-full bg-gradient-to-r from-gold to-gold2 text-dark font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-gold/25 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                >
                  {passLoading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>

                <p className="text-[10px] text-gray-700 text-center">
                  Supabase envía un email de confirmación si tiene esa opción activada
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
