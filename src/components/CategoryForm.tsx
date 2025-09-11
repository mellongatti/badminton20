'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CategoryFormProps {
  onCategoryAdded: () => void
}

export default function CategoryForm({ onCategoryAdded }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name: name.trim()
          }
        ])

      if (error) {
        console.error('Erro ao cadastrar categoria:', error)
        alert('Erro ao cadastrar categoria')
      } else {
        setName('')
        onCategoryAdded()
        alert('Categoria cadastrada com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao cadastrar categoria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-blue-800 mb-1">
          Nome da Categoria
        </label>
        <input
          type="text"
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 text-black placeholder-gray-500"
          placeholder="Ex: Masculino Iniciante, Feminino Avançado"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar Categoria'}
      </button>
    </form>
  )
}