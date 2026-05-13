'use client'

import { useState } from 'react'

interface AuthModalProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string, displayName: string) => Promise<void>
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('email') && msg.includes('invalid')) return 'Email inválido'
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de ingresar'
  return msg
}

export const AuthModal = ({ onSignIn, onSignUp }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m)
    setError(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (mode === 'signup' && !displayName.trim()) {
      setError('Ingresá tu nombre')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await onSignIn(email.trim(), password)
      } else {
        await onSignUp(email.trim(), password, displayName.trim())
        setSuccessMsg('¡Cuenta creada! Si se requiere confirmación, revisá tu email.')
      }
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-surface3 border border-surface3 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold2 transition'

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface2 border-2 border-gold2/60 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-4xl font-display text-gold2 text-center mb-1 uppercase">Álbum</h1>
        <p className="text-center text-gray-400 text-sm mb-7">Mundial 2026</p>

        {/* Mode tabs */}
        <div className="flex rounded-xl overflow-hidden border border-surface3 mb-6">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                mode === m
                  ? 'bg-gradient-to-r from-gold to-gold2 text-dark'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'signin' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Nombre
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre..."
                className={inputClass}
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={inputClass}
              disabled={loading}
              autoFocus={mode === 'signin'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-xl px-4 py-2.5 text-green-400 text-sm">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-gradient-to-r from-gold to-gold2 text-dark font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-gold/30 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide mt-2"
          >
            {loading ? 'Cargando...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center mt-6">
          Tu colección sincronizada en todos tus dispositivos
        </p>
      </div>
    </div>
  )
}
