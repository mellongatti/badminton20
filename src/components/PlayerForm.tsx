'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PlayerFormProps {
  categories: any[]
  onPlayerAdded: () => void
}

export default function PlayerForm({ categories, onPlayerAdded }: PlayerFormProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('players')
        .insert([
          {
            name: name.trim(),
            category_id: parseInt(categoryId)
          }
        ])

      if (error) {
        console.error('Erro ao cadastrar jogador:', error)
        alert('Erro ao cadastrar jogador')
      } else {
        setName('')
        setCategoryId('')
        onPlayerAdded()
        alert('Jogador cadastrado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao cadastrar jogador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-blue-800 mb-1">
          Nome do Jogador
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 text-black placeholder-gray-500"
          placeholder="Digite o nome do jogador"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-blue-800 mb-1">
          Categoria
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 text-black"
          required
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar Jogador'}
      </button>
    </form>
  )
}