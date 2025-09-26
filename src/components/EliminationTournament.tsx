'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface EliminationGame {
  id: number
  player1_id?: number
  player2_id?: number
  team1_id?: number
  team2_id?: number
  category_id: number
  phase: number
  game_date?: string
  player1_score?: number
  player2_score?: number
  winner_id?: number
  set1_player1?: number
  set1_player2?: number
  set2_player1?: number
  set2_player2?: number
  set3_player1?: number
  set3_player2?: number
  is_team_game: boolean
  is_wo?: boolean
  status: string
  player1?: { name: string }
  player2?: { name: string }
  team1?: { name: string }
  team2?: { name: string }
  category?: { name: string }
}

interface EliminationPhase {
  id: number
  category_id: number
  phase_number: number
  phase_name: string
  total_players: number
  is_active: boolean
}

interface EliminationTournamentProps {
  players: any[]
  categories: any[]
  teams: any[]
}

export default function EliminationTournament({ players, categories, teams }: EliminationTournamentProps) {
  const [games, setGames] = useState<EliminationGame[]>([])
  const [phases, setPhases] = useState<EliminationPhase[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('individual')
  const [currentPhase, setCurrentPhase] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'games' | 'phases' | 'settings' | 'scheduling'>('games')
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set())
  const [schedulingDate, setSchedulingDate] = useState('')

  useEffect(() => {
    fetchGames()
    fetchPhases()
  }, [])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('elimination_games')
        .select(`
          *,
          player1:players!elimination_games_player1_id_fkey(name),
          player2:players!elimination_games_player2_id_fkey(name),
          team1:teams!elimination_games_team1_id_fkey(name),
          team2:teams!elimination_games_team2_id_fkey(name),
          category:categories(name)
        `)
        .order('phase', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('Erro ao buscar jogos:', error)
    }
  }

  const fetchPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('elimination_phases')
        .select('*')
        .order('phase_number', { ascending: true })

      if (error) throw error
      setPhases(data || [])
    } catch (error) {
      console.error('Erro ao buscar fases:', error)
    }
  }

  const generateGames = async () => {
    if (!selectedCategory) {
      alert('Por favor, selecione uma categoria')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/elimination/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: parseInt(selectedCategory),
          gameType: selectedGameType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar jogos')
      }

      await fetchGames()
      await fetchPhases()
      alert('Jogos gerados com sucesso!')
    } catch (error: any) {
      console.error('Erro ao gerar jogos:', error)
      alert(`Erro ao gerar jogos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateGameResult = async (gameId: number, result: any) => {
    try {
      const { error } = await supabase
        .from('elimination_games')
        .update(result)
        .eq('id', gameId)

      if (error) throw error
      await fetchGames()
    } catch (error) {
      console.error('Erro ao atualizar resultado:', error)
      alert('Erro ao salvar resultado')
    }
  }

  const deleteGame = async (gameId: number) => {
    if (!confirm('Tem certeza que deseja excluir este jogo?')) return

    try {
      const { error } = await supabase
        .from('elimination_games')
        .delete()
        .eq('id', gameId)

      if (error) throw error
      await fetchGames()
      await fetchPhases()
    } catch (error) {
      console.error('Erro ao excluir jogo:', error)
      alert('Erro ao excluir jogo')
    }
  }

  const deleteAllGames = async () => {
    if (!selectedCategory) {
      alert('Por favor, selecione uma categoria')
      return
    }

    if (!confirm('Tem certeza que deseja excluir TODOS os jogos desta categoria? Esta ação não pode ser desfeita.')) return

    setLoading(true)
    try {
      // Deletar todos os jogos da categoria
      const { error: gamesError } = await supabase
        .from('elimination_games')
        .delete()
        .eq('category_id', parseInt(selectedCategory))

      if (gamesError) throw gamesError

      // Deletar todas as fases da categoria
      const { error: phasesError } = await supabase
        .from('elimination_phases')
        .delete()
        .eq('category_id', parseInt(selectedCategory))

      if (phasesError) throw phasesError

      await fetchGames()
      await fetchPhases()
      alert('Todos os jogos foram excluídos com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir jogos:', error)
      alert('Erro ao excluir jogos')
    } finally {
      setLoading(false)
    }
  }

  const filteredGames = games.filter(game => {
    if (selectedCategory && game.category_id.toString() !== selectedCategory) return false
    if (currentPhase && game.phase !== currentPhase) return false
    if (selectedDate && game.game_date) {
      // Normalizar as datas para comparação (remover horário se existir)
      const gameDate = game.game_date.split('T')[0]
      const filterDate = selectedDate.split('T')[0]
      if (gameDate !== filterDate) return false
    }
    return true
  })

  const togglePhaseExpansion = (categoryId: number, phase: number) => {
    const phaseKey = `${categoryId}-${phase}`
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseKey)) {
      newExpanded.delete(phaseKey)
    } else {
      newExpanded.add(phaseKey)
    }
    setExpandedPhases(newExpanded)
  }

  const toggleGameSelection = (gameId: number) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId)
    } else {
      newSelected.add(gameId)
    }
    setSelectedGames(newSelected)
  }

  const selectAllGames = () => {
    const allGameIds = new Set(games.map(game => game.id))
    setSelectedGames(allGameIds)
  }

  const deselectAllGames = () => {
    setSelectedGames(new Set())
  }

  const scheduleSelectedGames = async () => {
    if (selectedGames.size === 0) {
      alert('Por favor, selecione pelo menos um jogo para agendar.')
      return
    }

    if (!schedulingDate) {
      alert('Por favor, selecione uma data para o agendamento.')
      return
    }

    setLoading(true)
    try {
      const gameIds = Array.from(selectedGames)
      
      // Usar a data diretamente sem conversão para evitar problemas de fuso horário
      const formattedDate = schedulingDate
      
      for (const gameId of gameIds) {
        const { error } = await supabase
          .from('elimination_games')
          .update({ game_date: formattedDate })
          .eq('id', gameId)

        if (error) throw error
      }

      alert(`${gameIds.length} jogo(s) agendado(s) com sucesso para ${new Date(schedulingDate + 'T00:00:00').toLocaleDateString('pt-BR')}!`)
      setSelectedGames(new Set())
      setSchedulingDate('')
      fetchGames() // Recarregar jogos para mostrar as datas atualizadas
    } catch (error) {
      console.error('Erro ao agendar jogos:', error)
      alert('Erro ao agendar jogos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🏆 Torneio por Eliminação</h1>
          <p className="text-sm text-gray-600">Gerencie e acompanhe os jogos eliminatórios</p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('games')}
              className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'games'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
              }`}
            >
              <span className="text-lg">🎮</span>
              <span className="text-sm">Jogos</span>
            </button>
            <button
              onClick={() => setActiveTab('phases')}
              className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'phases'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="text-sm">Tabela de Fases</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduling')}
              className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'scheduling'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
              }`}
            >
              <span className="text-lg">📅</span>
              <span className="text-sm">Agendamento</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Configurações</span>
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba Jogos */}
        {activeTab === 'games' && (
          <>
            {/* Controles */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">⚙️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Configurações do Torneio</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                    <span className="text-sm">🏷️</span>
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 text-sm"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                    <span className="text-sm">👥</span>
                    Tipo de Jogo
                  </label>
                  <select
                    value={selectedGameType}
                    onChange={(e) => setSelectedGameType(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 text-sm"
                  >
                    <option value="individual">Individual</option>
                    <option value="dupla">Dupla</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                    <span className="text-sm">🎯</span>
                    Fase Atual
                  </label>
                  <select
                    value={currentPhase}
                    onChange={(e) => setCurrentPhase(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((phase) => (
                      <option key={phase} value={phase}>
                        Fase {phase}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                    <span className="text-sm">📅</span>
                    Data do Jogo
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={generateGames}
                  disabled={loading || !selectedCategory}
                  className="w-32 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-1 px-2 rounded-md font-medium text-xs hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🎲</span>
                      <span>Gerar Jogos</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    setSelectedGameType('individual')
                    setCurrentPhase(1)
                    setSelectedDate('')
                  }}
                  className="w-32 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-1 px-2 rounded-md font-medium text-xs hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                >
                  <span className="text-sm">🧹</span>
                  <span>Limpar Filtros</span>
                </button>
              </div>
            </div>

            {/* Lista de Jogos */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🎮</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Lista de Jogos</h3>
              </div>

              {filteredGames.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-xl text-gray-600 font-medium">Nenhum jogo encontrado</p>
                  <p className="text-gray-500 mt-2">Gere jogos para começar o torneio</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredGames.map((game) => (
                    <EliminationGameCard
                      key={game.id}
                      game={game}
                      onUpdateResult={updateGameResult}
                      onDeleteGame={deleteGame}
                      loading={loading}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Conteúdo da Aba Configurações */}
        {activeTab === 'settings' && (
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Configurações Avançadas</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Zona de Perigo
                </h4>
                <p className="text-red-700 mb-4 text-sm">
                  Esta ação irá excluir TODOS os jogos e fases da categoria selecionada. Esta ação não pode ser desfeita.
                </p>
                <button
                  onClick={deleteAllGames}
                  disabled={loading || !selectedCategory}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg font-bold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🗑️</span>
                  <span>Deletar Todos os Jogos da Categoria</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba Tabela de Fases */}
        {activeTab === 'phases' && (
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Tabela de Fases do Torneio</h3>
            </div>
            
            {/* Filtros para a tabela de fases */}
            <div className="mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="text-lg">🏷️</span>
                  Filtrar por Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full max-w-md p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/50"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabela de Fases */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Fase</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Categoria</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Total de Jogadores</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Jogos Totais</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Jogos Concluídos</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Progresso</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {phases
                    .filter(phase => !selectedCategory || phase.category_id.toString() === selectedCategory)
                    .map((phase) => {
                      const phaseGames = games.filter(game => 
                        game.phase === phase.phase_number && 
                        game.category_id === phase.category_id
                      )
                      const completedGames = phaseGames.filter(game => game.status === 'completed')
                      const progressPercentage = phaseGames.length > 0 ? (completedGames.length / phaseGames.length) * 100 : 0
                      const category = categories.find(cat => cat.id === phase.category_id)
                      
                      return (
                        <tr key={`${phase.category_id}-${phase.phase_number}`} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">
                            {phase.phase_name}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            {category?.name || 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                            {phase.total_players}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                            {phaseGames.length}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                            {completedGames.length}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {Math.round(progressPercentage)}%
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              phase.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {phase.is_active ? '🟢 Ativa' : '⚪ Inativa'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
              
              {phases.filter(phase => !selectedCategory || phase.category_id.toString() === selectedCategory).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-xl text-gray-600 font-medium">Nenhuma fase encontrada</p>
                  <p className="text-gray-500 mt-2">Gere jogos para criar as fases do torneio</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba Agendamento */}
        {activeTab === 'scheduling' && (
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm">📅</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Agendamento de Jogos</h3>
            </div>
            
            {/* Controles de Agendamento */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg mb-4 border border-orange-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    📅 Data para Agendamento
                  </label>
                  <input
                    type="date"
                    value={schedulingDate}
                    onChange={(e) => setSchedulingDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={selectAllGames}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1 text-xs"
                  >
                    <span>✅</span>
                    <span>Selecionar Todos</span>
                  </button>
                  <button
                    onClick={deselectAllGames}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-3 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1 text-xs"
                  >
                    <span>❌</span>
                    <span>Limpar Seleção</span>
                  </button>
                </div>
                
                <button
                  onClick={scheduleSelectedGames}
                  disabled={loading || selectedGames.size === 0 || !schedulingDate}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1 text-xs"
                >
                  <span>📅</span>
                  <span>Agendar Selecionados ({selectedGames.size})</span>
                </button>
              </div>
            </div>

            {/* Lista de Jogos para Agendamento */}
            <div className="space-y-3">
              {games.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎮</div>
                  <p className="text-base text-gray-600 font-medium">Nenhum jogo encontrado</p>
                  <p className="text-gray-500 mt-1 text-sm">Gere jogos na aba Configurações para começar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className={`bg-gradient-to-br from-white to-gray-50 p-3 rounded-lg shadow-sm border transition-all duration-300 cursor-pointer hover:shadow-md ${
                        selectedGames.has(game.id)
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => toggleGameSelection(game.id)}
                    >
                      {/* Checkbox de Seleção */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedGames.has(game.id)
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'border-gray-300'
                          }`}>
                            {selectedGames.has(game.id) && <span className="text-xs">✓</span>}
                          </div>
                          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">F{game.phase}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          game.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {game.status === 'completed' ? '✅' : '⏳'}
                        </span>
                      </div>

                      {/* Informações do Jogo */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{game.category?.name}</p>
                        <p className="text-xs text-gray-600">
                          {game.is_team_game ? '👥 Dupla' : '👤 Individual'}
                        </p>
                        
                        {/* Jogadores/Times */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-2 rounded">
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {game.is_team_game && game.team1 ? game.team1.name : game.player1?.name || 'TBD'}
                            </p>
                            <div className="text-xs text-purple-600 font-bold">VS</div>
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {game.is_team_game && game.team2 ? game.team2.name : game.player2?.name || 'TBD'}
                            </p>
                          </div>
                        </div>

                        {/* Data Atual */}
                        {game.game_date && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-1 rounded border border-green-200">
                            <p className="text-xs text-green-800 font-medium text-center">
                              📅 {new Date(game.game_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface EliminationGameCardProps {
  game: EliminationGame
  onUpdateResult: (gameId: number, result: any) => void
  onDeleteGame: (gameId: number) => void
  loading: boolean
}

function EliminationGameCard({ game, onUpdateResult, onDeleteGame, loading }: EliminationGameCardProps) {
  const [showResultForm, setShowResultForm] = useState(false)
  const [isWalkOver, setIsWalkOver] = useState(false)
  const [woWinner, setWoWinner] = useState<'player1' | 'player2' | null>(null)
  const [sets, setSets] = useState([
    { player1: '', player2: '' },
    { player1: '', player2: '' },
    { player1: '', player2: '' }
  ])
  const [gameDate, setGameDate] = useState(game.game_date || '')

  const handleSaveResult = () => {
    if (isWalkOver) {
      if (!woWinner) {
        alert('Por favor, selecione qual jogador/equipe venceu por WO.')
        return
      }
      
      // Para Walk Over, definir vencedor baseado na seleção
      const winnerId = woWinner === 'player1' 
        ? (game.is_team_game ? game.team1_id : game.player1_id)
        : (game.is_team_game ? game.team2_id : game.player2_id)
      
      // Formatar a data corretamente para evitar problemas de fuso horário
      const formattedDate = gameDate || null
      
      onUpdateResult(game.id, {
        status: 'completed',
        is_wo: true,
        player1_score: woWinner === 'player1' ? 1 : 0,
        player2_score: woWinner === 'player2' ? 1 : 0,
        winner_id: winnerId,
        game_date: formattedDate
      })
    } else {
      // Calcular vencedor baseado nos sets
      let player1Wins = 0
      let player2Wins = 0
      
      // Formatar a data corretamente para evitar problemas de fuso horário
      const formattedDate = gameDate || null
      
      const resultData: any = {
        status: 'completed',
        is_wo: false,
        game_date: formattedDate
      }

      sets.forEach((set, index) => {
        const p1Score = parseInt(set.player1) || 0
        const p2Score = parseInt(set.player2) || 0
        
        if (p1Score > 0 || p2Score > 0) {
          resultData[`set${index + 1}_player1`] = p1Score
          resultData[`set${index + 1}_player2`] = p2Score
          
          if (p1Score > p2Score) player1Wins++
          else if (p2Score > p1Score) player2Wins++
        }
      })

      resultData.player1_score = player1Wins
      resultData.player2_score = player2Wins
      
      if (player1Wins > player2Wins) {
        resultData.winner_id = game.is_team_game ? game.team1_id : game.player1_id
      } else if (player2Wins > player1Wins) {
        resultData.winner_id = game.is_team_game ? game.team2_id : game.player2_id
      }

      onUpdateResult(game.id, resultData)
    }
    
    setShowResultForm(false)
    setSets([{ player1: '', player2: '' }, { player1: '', player2: '' }, { player1: '', player2: '' }])
    setIsWalkOver(false)
    setWoWinner(null)
    setGameDate('')
  }

  const getPlayerName = (isTeam: boolean, player?: any, team?: any) => {
    if (isTeam && team) return team.name
    if (!isTeam && player) return player.name
    return 'TBD'
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-3 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
      {/* Header do Card */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">F{game.phase}</span>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900">{game.category?.name}</h4>
            <p className="text-xs text-gray-600">
              {game.is_team_game ? '👥 Dupla' : '👤 Individual'} • 
              <span className={`font-semibold ${
                game.status === 'completed' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {game.status === 'completed' ? '✅ Concluído' : '⏳ Pendente'}
              </span>
            </p>
            {game.game_date && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">📅 Data:</span> {new Date(game.game_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onDeleteGame(game.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-all duration-200 text-sm"
          title="Excluir jogo"
        >
          🗑️
        </button>
      </div>

      {/* Jogadores/Times */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-2 rounded-lg mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.status === 'completed' && game.winner_id === (game.is_team_game ? game.team1_id : game.player1_id) && (
              <span className="text-yellow-500 text-sm">👑</span>
            )}
            <div>
              <p className="font-semibold text-sm text-gray-900">
                {getPlayerName(game.is_team_game, game.player1, game.team1)}
              </p>
              {game.status === 'completed' && (
                <p className="text-sm text-gray-600">Sets ganhos: {game.player1_score || 0}</p>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold text-sm shadow-lg">
              VS
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-semibold text-sm text-gray-900">
                {getPlayerName(game.is_team_game, game.player2, game.team2)}
              </p>
              {game.status === 'completed' && (
                <p className="text-sm text-gray-600">Sets ganhos: {game.player2_score || 0}</p>
              )}
            </div>
            {game.status === 'completed' && game.winner_id === (game.is_team_game ? game.team2_id : game.player2_id) && (
              <span className="text-yellow-500 text-sm">👑</span>
            )}
          </div>
        </div>
      </div>

      {/* Vencedor (se concluído) */}
      {game.status === 'completed' && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-2 rounded-lg mb-2 border border-yellow-200">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">🏆</span>
            <h5 className="font-semibold text-sm text-gray-900">Vencedor</h5>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-700">
              {game.winner_id === (game.is_team_game ? game.team1_id : game.player1_id)
                ? getPlayerName(game.is_team_game, game.player1, game.team1)
                : getPlayerName(game.is_team_game, game.player2, game.team2)
              }
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {game.is_wo ? 'Venceu por Walk Over (WO)' : (() => {
                const player1Score = game.player1_score || 0
                const player2Score = game.player2_score || 0
                const player1Id = game.is_team_game ? game.team1_id : game.player1_id
                const player2Id = game.is_team_game ? game.team2_id : game.player2_id
                
                if (game.winner_id === player1Id) {
                  return `Venceu por ${player1Score} sets a ${player2Score}`
                } else if (game.winner_id === player2Id) {
                  return `Venceu por ${player2Score} sets a ${player1Score}`
                } else {
                  return `Placar: ${player1Score} sets a ${player2Score}`
                }
              })()}
            </p>
          </div>
        </div>
      )}

      {/* Resultados dos Sets (se concluído) */}
      {game.status === 'completed' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🏸</span>
            <h5 className="font-semibold text-sm text-gray-900">Resultados dos Sets</h5>
          </div>
          
          {game.is_wo ? (
            <div className="text-center py-2">
              <p className="text-sm font-bold text-orange-600">⚠️ Walk Over (WO)</p>
              <p className="text-xs text-gray-600">Jogo não disputado</p>
            </div>
          ) : (
            <div className="flex justify-center">
              {(() => {
                const playedSets = [1, 2, 3].filter((setNum) => {
                  const p1Score = game[`set${setNum}_player1` as keyof EliminationGame] as number
                  const p2Score = game[`set${setNum}_player2` as keyof EliminationGame] as number
                  return p1Score !== undefined && p2Score !== undefined && (p1Score > 0 || p2Score > 0)
                })
                
                const gridCols = playedSets.length === 1 ? 'grid-cols-1' : playedSets.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                
                return (
                  <div className={`grid ${gridCols} gap-2 justify-items-center`}>
                    {playedSets.map((setNum) => {
                      const p1Score = game[`set${setNum}_player1` as keyof EliminationGame] as number
                      const p2Score = game[`set${setNum}_player2` as keyof EliminationGame] as number
                      
                      return (
                        <div key={setNum} className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg text-center min-w-[100px]">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Set {setNum}</p>
                          <p className="text-sm font-bold text-gray-900">
                            {p1Score} - {p2Score}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Botões de Ação */}
      {game.status === 'pending' && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowResultForm(true)}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-sm">📝</span>
            <span>Cadastrar Resultado</span>
          </button>
        </div>
      )}
      
      {game.status === 'completed' && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              // Pré-preencher o formulário com os dados existentes
              if (game.is_wo) {
                setIsWalkOver(true)
                setWoWinner(game.winner_id === (game.is_team_game ? game.team1_id : game.player1_id) ? 'player1' : 'player2')
              } else {
                setIsWalkOver(false)
                setWoWinner(null)
                const existingSets = [
                  { player1: game.set1_player1?.toString() || '', player2: game.set1_player2?.toString() || '' },
                  { player1: game.set2_player1?.toString() || '', player2: game.set2_player2?.toString() || '' },
                  { player1: game.set3_player1?.toString() || '', player2: game.set3_player2?.toString() || '' }
                ]
                setSets(existingSets)
              }
              setGameDate(game.game_date || '')
              setShowResultForm(true)
            }}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-sm">✏️</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este jogo?')) {
                onDeleteGame(game.id)
              }
            }}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-sm">🗑️</span>
          </button>
        </div>
      )}

      {/* Formulário de Resultado */}
      {showResultForm && (
        <div className="mt-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <h5 className="text-sm font-bold text-gray-900">Inserir Resultado</h5>
          </div>
          

          
          {/* Opção Walk Over */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">⚠️</span>
              <span className="font-semibold text-gray-800 text-sm">Walk Over (WO)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsWalkOver(false)
                  setWoWinner(null)
                }}
                className={`p-2 rounded-md font-semibold transition-all duration-200 text-sm ${
                  !isWalkOver
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                🏸 Jogo Normal
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsWalkOver(true)
                  setWoWinner('player1')
                }}
                className={`p-2 rounded-md font-semibold transition-all duration-200 text-sm ${
                  isWalkOver && woWinner === 'player1'
                    ? 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border border-orange-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                🏆 WO - {getPlayerName(game.is_team_game, game.player1, game.team1)}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsWalkOver(true)
                  setWoWinner('player2')
                }}
                className={`p-2 rounded-md font-semibold transition-all duration-200 text-sm ${
                  isWalkOver && woWinner === 'player2'
                    ? 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border border-orange-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                🏆 WO - {getPlayerName(game.is_team_game, game.player2, game.team2)}
              </button>
            </div>
          </div>

          {!isWalkOver && (
            <div className="space-y-3 mb-4">
              {sets.map((set, index) => (
                <div key={index} className="bg-gradient-to-r from-white to-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🏸</span>
                    <h6 className="font-bold text-gray-900 text-sm">Set {index + 1}</h6>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {getPlayerName(game.is_team_game, game.player1, game.team1)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={set.player1}
                        onChange={(e) => {
                          const newSets = [...sets]
                          newSets[index].player1 = e.target.value
                          setSets(newSets)
                        }}
                        className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-bold text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="text-center">
                      <span className="text-lg font-bold text-gray-400">×</span>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {getPlayerName(game.is_team_game, game.player2, game.team2)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={set.player2}
                        onChange={(e) => {
                          const newSets = [...sets]
                          newSets[index].player2 = e.target.value
                          setSets(newSets)
                        }}
                        className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-bold text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveResult}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-3 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
            >
              <span className="text-sm">💾</span>
              <span>Salvar</span>
            </button>
            <button
              onClick={() => {
                setShowResultForm(false)
                setIsWalkOver(false)
                setWoWinner(null)
                setSets([{ player1: '', player2: '' }, { player1: '', player2: '' }, { player1: '', player2: '' }])
                setGameDate(game.game_date || '')
              }}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-3 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
            >
              <span className="text-sm">❌</span>
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}