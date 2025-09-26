'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Player {
  id: number
  name: string
}

interface Team {
  id: number
  name: string
}

interface Game {
  id: number
  category_id: number
  phase: number
  player1_id?: number
  player2_id?: number
  team1_id?: number
  team2_id?: number
  winner_id?: number
  status: string
  is_team_game: boolean
  player1?: Player
  player2?: Player
  team1?: Team
  team2?: Team
}

interface Phase {
  id: number
  category_id: number
  phase_number: number
  phase_name: string
  is_active: boolean
  total_players: number
}

interface BracketProps {
  selectedCategory: string
  categories: any[]
}

export default function TournamentBracket({ selectedCategory, categories }: BracketProps) {
  const [games, setGames] = useState<Game[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory)

  useEffect(() => {
    setLocalSelectedCategory(selectedCategory)
  }, [selectedCategory])

  useEffect(() => {
    if (localSelectedCategory) {
      fetchBracketData()
    }
  }, [localSelectedCategory])

  const fetchBracketData = async () => {
    try {
      setLoading(true)

      // Buscar fases
      const { data: phasesData, error: phasesError } = await supabase
        .from('elimination_phases')
        .select('*')
        .eq('category_id', localSelectedCategory)
        .order('phase_number', { ascending: true })

      if (phasesError) throw phasesError

      // Buscar jogos
      const { data: gamesData, error: gamesError } = await supabase
        .from('elimination_games')
        .select(`
          *,
          player1:players!elimination_games_player1_id_fkey(id, name),
          player2:players!elimination_games_player2_id_fkey(id, name),
          team1:teams!elimination_games_team1_id_fkey(id, name),
          team2:teams!elimination_games_team2_id_fkey(id, name)
        `)
        .eq('category_id', localSelectedCategory)
        .order('phase', { ascending: true })

      if (gamesError) throw gamesError

      setPhases(phasesData || [])
      setGames(gamesData || [])
    } catch (error) {
      console.error('Erro ao buscar dados do bracket:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (game: Game, position: 'player1' | 'player2') => {
    if (game.is_team_game) {
      return position === 'player1' ? game.team1?.name : game.team2?.name
    } else {
      return position === 'player1' ? game.player1?.name : game.player2?.name
    }
  }

  const getWinnerName = (game: Game) => {
    if (!game.winner_id) return null
    
    if (game.is_team_game) {
      if (game.team1_id === game.winner_id) return game.team1?.name
      if (game.team2_id === game.winner_id) return game.team2?.name
    } else {
      if (game.player1_id === game.winner_id) return game.player1?.name
      if (game.player2_id === game.winner_id) return game.player2?.name
    }
    return null
  }

  const getGamesByPhase = (phaseNumber: number) => {
    return games.filter(game => game.phase === phaseNumber)
  }

  const renderGame = (game: Game, index: number) => {
    const player1Name = getPlayerName(game, 'player1')
    const player2Name = getPlayerName(game, 'player2')
    const winnerName = getWinnerName(game)
    const isCompleted = game.status === 'completed' && game.winner_id

    return (
      <div key={game.id} className="bg-white border-2 border-gray-300 rounded-lg p-3 mb-2 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Jogo {index + 1}</div>
        
        <div className="space-y-1">
          <div className={`flex justify-between items-center p-2 rounded ${
            isCompleted && (game.player1_id === game.winner_id || game.team1_id === game.winner_id)
              ? 'bg-green-100 border-green-300 border'
              : 'bg-gray-50'
          }`}>
            <span className="font-medium">{player1Name || 'TBD'}</span>
            {isCompleted && (game.player1_id === game.winner_id || game.team1_id === game.winner_id) && (
              <span className="text-green-600 font-bold">✓</span>
            )}
          </div>
          
          <div className="text-center text-xs text-gray-400">vs</div>
          
          <div className={`flex justify-between items-center p-2 rounded ${
            isCompleted && (game.player2_id === game.winner_id || game.team2_id === game.winner_id)
              ? 'bg-green-100 border-green-300 border'
              : 'bg-gray-50'
          }`}>
            <span className="font-medium">{player2Name || 'TBD'}</span>
            {isCompleted && (game.player2_id === game.winner_id || game.team2_id === game.winner_id) && (
              <span className="text-green-600 font-bold">✓</span>
            )}
          </div>
        </div>
        
        {isCompleted && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">Vencedor:</div>
            <div className="font-bold text-green-600">{winnerName}</div>
          </div>
        )}
        
        {game.status === 'pending' && (
          <div className="mt-2 text-center text-xs text-orange-500">
            Aguardando resultado
          </div>
        )}
      </div>
    )
  }

  const renderPhase = (phase: Phase) => {
    const phaseGames = getGamesByPhase(phase.phase_number)
    
    return (
      <div key={phase.id} className="flex-shrink-0">
        <div className={`text-center mb-4 p-2 rounded-lg ${
          phase.is_active ? 'bg-blue-100 border-blue-300 border-2' : 'bg-gray-100'
        }`}>
          <h3 className={`font-bold ${
            phase.is_active ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {phase.phase_name}
          </h3>
          <div className="text-xs text-gray-500">
            {phaseGames.length} jogo(s)
          </div>
          {phase.is_active && (
            <div className="text-xs text-blue-600 font-medium mt-1">
              ● FASE ATIVA
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {phaseGames.map((game, index) => renderGame(game, index))}
        </div>
        
        {phaseGames.length === 0 && (
          <div className="text-center text-gray-400 text-sm p-4 border-2 border-dashed border-gray-300 rounded-lg">
            Nenhum jogo criado
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Carregando chaveamento...</div>
      </div>
    )
  }

  if (!localSelectedCategory) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🏆</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Chaveamento do Torneio</h2>
        </div>
        
        {/* Filtro de Categoria */}
        <div className="mb-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="text-lg">🏷️</span>
              Filtrar por Categoria
            </label>
            <select
              value={localSelectedCategory}
              onChange={(e) => setLocalSelectedCategory(e.target.value)}
              className="w-full max-w-md p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-white/50"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-base text-gray-600 font-medium">Selecione uma categoria</p>
          <p className="text-gray-500 mt-1 text-sm">Escolha uma categoria acima para visualizar o chaveamento</p>
        </div>
      </div>
    )
  }

  if (phases.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🏆</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Chaveamento do Torneio</h2>
        </div>
        
        {/* Filtro de Categoria */}
        <div className="mb-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="text-lg">🏷️</span>
              Filtrar por Categoria
            </label>
            <select
              value={localSelectedCategory}
              onChange={(e) => setLocalSelectedCategory(e.target.value)}
              className="w-full max-w-md p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-white/50"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-base text-gray-600 font-medium">Nenhuma fase encontrada</p>
          <p className="text-gray-500 mt-1 text-sm">Esta categoria ainda não possui fases criadas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg">🏆</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Chaveamento do Torneio</h2>
      </div>
      
      {/* Filtro de Categoria */}
      <div className="mb-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="text-lg">🏷️</span>
            Filtrar por Categoria
          </label>
          <select
            value={localSelectedCategory}
            onChange={(e) => setLocalSelectedCategory(e.target.value)}
            className="w-full max-w-md p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-white/50"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {phases.map(phase => renderPhase(phase))}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">Como funciona:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Os vencedores de cada jogo avançam para a próxima fase</li>
          <li>• A fase ativa é onde novos jogos podem ser criados</li>
          <li>• Jogos marcados com ✓ mostram o vencedor</li>
          <li>• "TBD" significa "To Be Determined" (a ser determinado)</li>
        </ul>
      </div>
    </div>
  )
}