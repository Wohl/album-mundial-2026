'use client'

import { useState } from 'react'

interface WelcomeModalProps {
  onSubmit: (name: string) => void
  isLoading?: boolean
}

export const WelcomeModal = ({ onSubmit, isLoading = false }: WelcomeModalProps) => {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name)
      setName('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface2 border-2 border-gold2 rounded-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-4xl font-display text-gold2 text-center mb-2 uppercase">
          Álbum
        </h1>
        <p className="text-center text-gray-300 mb-6">Mundial 2026</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              ¿Cuál es tu nombre?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre..."
              className="w-full bg-surface3 border border-surface border-opacity-50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold2 transition"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-gradient-to-r from-gold to-gold2 text-dark font-bold py-2 rounded-lg hover:shadow-lg hover:shadow-gold/50 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {isLoading ? 'Cargando...' : 'Comenzar'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Tu colección se guarda localmente
        </p>
      </div>
    </div>
  )
}
