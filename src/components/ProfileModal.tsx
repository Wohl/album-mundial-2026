'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types'

interface ProfileModalProps {
  profile: Profile
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  onUpdateDisplayName: (name: string) => Promise<void>
  onClose: () => void
}

type Section = 'profile' | 'password'

function translateError(msg: string): string {
  if (msg.includes('contraseña actual es incorrecta')) return 'La contraseña actual es incorrecta'
  if (msg.includes('New password should be different')) return 'La nueva contraseña debe ser diferente a la actual'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('weak_password') || msg.includes('Weak password')) return 'Contraseña demasiado débil, usá una más segura'
  if (msg.includes('Invalid login credentials')) return 'La contraseña actual es incorrecta'
  if (msg.includes('No hay sesión')) return 'No hay sesión activa, recargá la página'
  return msg
}

export const ProfileModal = ({ profile, onChangePassword, onUpdateDisplayName, onClose }: ProfileModalProps) => {
  const [section, setSection] = useState<Section>('profile')

  // Profile section
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Password section
  const [currentPassword, setCurrentPassword] = useState('')
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

    if (!currentPassword) {
      setPassError('Ingresá tu contraseña actual')
      return
    }
    if (newPassword.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas nuevas no coinciden')
      return
    }
    if (currentPassword === newPassword) {
      setPassError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setPassLoading(true)
    try {
      await onChangePassword(currentPassword, newPassword)
      setPassSuccess(true)
      setCurrentPassword('')
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

  const passwordsMatch = confirmPassword && newPassword === confirmPassword
  const passwordsDontMatch = confirmPassword && newPassword !== confirmPassword

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-gold2/10 border border-gold/30 flex items-center justify-center shrink-0">
                  <span className="text-gold2 font-display text-lg leading-none">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-display text-gold2 uppercase tracking-wide leading-none mb-0.5">Mi perfil</h2>
                  <p className="text-[11px] text-gray-500">{profile.display_name}</p>
                </div>
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
                  onClick={() => { setSection(s); setPassError(null); setNameError(null) }}
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

            {/* ── Datos del perfil ── */}
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
                  <p className="text-[10px] text-gray-700 mt-1">Así te ven otros jugadores en el mercado de intercambios</p>
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

            {/* ── Cambio de contraseña ── */}
            {section === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Contraseña actual */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPassSuccess(false); setPassError(null) }}
                    placeholder="Tu contraseña actual"
                    className={inputClass}
                    disabled={passLoading}
                    autoFocus
                    autoComplete="current-password"
                  />
                </div>

                {/* Separador */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-surface3" />
                  <span className="text-[10px] text-gray-700 uppercase tracking-widest">Nueva</span>
                  <div className="flex-1 h-px bg-surface3" />
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPassSuccess(false); setPassError(null) }}
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                    disabled={passLoading}
                    autoComplete="new-password"
                  />
                </div>

                {/* Confirmar nueva contraseña */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPassSuccess(false); setPassError(null) }}
                      placeholder="Repetí la nueva contraseña"
                      className={`${inputClass} ${
                        passwordsMatch ? 'border-green-600/50' : passwordsDontMatch ? 'border-red-600/50' : ''
                      }`}
                      disabled={passLoading}
                      autoComplete="new-password"
                    />
                    {passwordsMatch && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
                    )}
                    {passwordsDontMatch && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 text-sm">✗</span>
                    )}
                  </div>
                </div>

                {passError && (
                  <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-2.5 text-red-400 text-xs">
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div className="bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-2.5 text-green-400 text-xs">
                    ✓ Contraseña cambiada correctamente
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-gradient-to-r from-gold to-gold2 text-dark font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-gold/25 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                >
                  {passLoading ? 'Verificando...' : 'Cambiar contraseña'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
