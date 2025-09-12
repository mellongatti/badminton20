'use client'

import React, { useState } from 'react'
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

interface Team {
  id: number
  name: string
  player1_id: number
  player2_id: number
  category_id: number
  player1?: { name: string }
  player2?: { name: string }
  categories?: { name: string }
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
  
  // Estados para duplas
  const [teams, setTeams] = useState<Team[]>([])
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamPlayer1, setTeamPlayer1] = useState('')
  const [teamPlayer2, setTeamPlayer2] = useState('')
  const [teamCategory, setTeamCategory] = useState('')
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Função para carregar duplas
  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          player1:players!teams_player1_id_fkey(name),
          player2:players!teams_player2_id_fkey(name),
          categories(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar duplas:', error)
      } else {
        setTeams(data || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  // Função para criar dupla
  const handleCreateTeam = async () => {
    if (!teamName.trim() || !teamPlayer1 || !teamPlayer2 || !teamCategory) {
      alert('Preencha todos os campos')
      return
    }

    if (teamPlayer1 === teamPlayer2) {
      alert('Selecione jogadores diferentes')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          player1_id: parseInt(teamPlayer1),
          player2_id: parseInt(teamPlayer2),
          category_id: parseInt(teamCategory)
        })

      if (error) {
        console.error('Erro ao criar dupla:', error)
        alert('Erro ao criar dupla')
      } else {
        setTeamName('')
        setTeamPlayer1('')
        setTeamPlayer2('')
        setTeamCategory('')
        setShowTeamForm(false)
        loadTeams()
        alert('Dupla criada com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar dupla')
    } finally {
      setLoading(false)
    }
  }

  // Função para excluir dupla
  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a dupla "${teamName}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) {
        console.error('Erro ao excluir dupla:', error)
        alert('Erro ao excluir dupla')
      } else {
        loadTeams()
        alert('Dupla excluída com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir dupla')
    } finally {
      setLoading(false)
    }
  }

  // Carregar duplas quando o componente for montado
  React.useEffect(() => {
    loadTeams()
  }, [])

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
      <div className="text-center py-8 text-black">
        Nenhum jogador cadastrado ainda.
      </div>
    )
  }

  return (
    <div>
      {/* Botões para alternar entre jogadores e duplas */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setShowTeamForm(false)}
          className={`px-4 py-2 rounded-lg font-medium ${
            !showTeamForm
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Jogadores Individuais
        </button>
        <button
          onClick={() => setShowTeamForm(true)}
          className={`px-4 py-2 rounded-lg font-medium ${
            showTeamForm
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Duplas
        </button>
      </div>

      {showTeamForm ? (
        /* Seção de Duplas */
        <div>
          {/* Formulário para criar dupla */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Cadastrar Nova Dupla</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Nome da Dupla
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Dupla dos Campeões"
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Jogador 1
                </label>
                <select
                  value={teamPlayer1}
                  onChange={(e) => setTeamPlayer1(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Selecione o jogador 1</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Jogador 2
                </label>
                <select
                  value={teamPlayer2}
                  onChange={(e) => setTeamPlayer2(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Selecione o jogador 2</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Categoria
                </label>
                <select
                  value={teamCategory}
                  onChange={(e) => setTeamCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Selecione a categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleCreateTeam}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Dupla'}
              </button>
            </div>
          </div>

          {/* Tabela de duplas */}
          {teams.length === 0 ? (
            <div className="text-center py-8 text-black">
              Nenhuma dupla cadastrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Nome da Dupla
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Jogador 1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Jogador 2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {teams.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })).map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{team.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{team.player1?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{team.player2?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{team.categories?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Seção de Jogadores Individuais */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-200">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Nome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-blue-100">
          {players.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })).map((player) => (
            <tr key={player.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingPlayer?.id === player.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-2 py-1 w-full text-black"
                  />
                ) : (
                  <div className="text-sm font-medium text-black">{player.name}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingPlayer?.id === player.id ? (
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="border rounded px-2 py-1 w-full text-black"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-black">{player.categories?.name}</div>
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
      )}
    </div>
  )
}