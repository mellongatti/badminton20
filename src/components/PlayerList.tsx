'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Pencil, Trash2 } from 'lucide-react'

interface Player {
  id: number
  name: string
  category_id: number
  categories?: {
    name: string
  }
}

interface PlayerListProps {
  players: Player[]
  categories: any[]
  onPlayerUpdated: () => void
}

export default function PlayerList({ players, categories, onPlayerUpdated }: PlayerListProps) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setEditName(player.name)
    setEditCategoryId(player.category_id.toString())
  }

  const handleUpdate = async () => {
    if (!editingPlayer || !editName.trim() || !editCategoryId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: editName.trim(),
          category_id: parseInt(editCategoryId)
        })
        .eq('id', editingPlayer.id)

      if (error) {
        console.error('Erro ao atualizar jogador:', error)
        alert('Erro ao atualizar jogador')
      } else {
        setEditingPlayer(null)
        onPlayerUpdated()
        alert('Jogador atualizado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar jogador')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (playerId: number, playerName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o jogador "${playerName}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) {
        console.error('Erro ao excluir jogador:', error)
        alert('Erro ao excluir jogador')
      } else {
        onPlayerUpdated()
        alert('Jogador excluído com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir jogador')
    } finally {
      setLoading(false)
    }
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum jogador cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {players.map((player) => (
            <tr key={player.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingPlayer?.id === player.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{player.name}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingPlayer?.id === player.id ? (
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-900">{player.categories?.name}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {editingPlayer?.id === player.id ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdate}
                      disabled={loading}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingPlayer(null)}
                      disabled={loading}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(player)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id, player.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}