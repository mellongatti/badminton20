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
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
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
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar Categoria'}
      </button>
    </form>
  )
}