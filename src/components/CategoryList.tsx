'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Category {
  id: number
  name: string
}

interface CategoryListProps {
  categories: Category[]
  onCategoryUpdated: () => void
}

export default function CategoryList({ categories, onCategoryUpdated }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setEditName(category.name)
  }

  const handleUpdate = async () => {
    if (!editingCategory || !editName.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editName.trim()
        })
        .eq('id', editingCategory.id)

      if (error) {
        console.error('Erro ao atualizar categoria:', error)
        alert('Erro ao atualizar categoria')
      } else {
        setEditingCategory(null)
        onCategoryUpdated()
        alert('Categoria atualizada com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) {
        console.error('Erro ao excluir categoria:', error)
        alert('Erro ao excluir categoria')
      } else {
        onCategoryUpdated()
        alert('Categoria excluída com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir categoria')
    } finally {
      setLoading(false)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma categoria cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div key={category.id} className="bg-gray-50 p-4 rounded-lg border">
          {editingCategory?.id === category.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingCategory(null)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">{category.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}