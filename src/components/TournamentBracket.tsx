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
  is_bye?: boolean
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
    if (!localSelectedCategory) {
      setLoading(false)
      return
    }

    const fetchBracketData = async () => {
      try {
        console.log('🔍 Iniciando busca de dados do bracket para categoria:', localSelectedCategory)
        setLoading(true)

        // Buscar fases
        console.log('📊 Buscando fases...')
        const { data: phasesData, error: phasesError } = await supabase
          .from('elimination_phases')
          .select('*')
          .eq('category_id', localSelectedCategory)
          .order('phase_number', { ascending: true })

        if (phasesError) {
          console.error('❌ Erro ao buscar fases:', phasesError)
          throw phasesError
        }
        console.log('✅ Fases encontradas:', phasesData?.length || 0)

        // Buscar jogos
        console.log('🏸 Buscando jogos...')
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

        if (gamesError) {
          console.error('❌ Erro ao buscar jogos:', gamesError)
          throw gamesError
        }
        console.log('✅ Jogos encontrados:', gamesData?.length || 0)

        setPhases(phasesData || [])
        setGames(gamesData || [])
        console.log('🎯 Dados do bracket carregados com sucesso!')
      } catch (error) {
        console.error('💥 Erro crítico ao buscar dados do bracket:', error)
        // Definir estados vazios em caso de erro para evitar carregamento infinito
        setPhases([])
        setGames([])
      } finally {
        setLoading(false)
        console.log('🏁 Carregamento finalizado')
      }
    }

    fetchBracketData()
  }, [localSelectedCategory])

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
    const isByeGame = game.is_bye

    // Determinar se é um jogo BYE
    const isBye = isByeGame || (!player2Name && player1Name) || (!player1Name && player2Name)

    if (isBye) {
      const byePlayer = player1Name || player2Name
      return (
        <div className="relative group min-w-[200px]">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 border-2 border-yellow-300 rounded-lg p-3 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-yellow-900 bg-yellow-200 px-2 py-0.5 rounded-full">
                🏆 BYE
              </div>
              <div className="text-yellow-900 text-lg">⚡</div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-yellow-200 text-center">
              <div className="font-bold text-gray-800 text-sm mb-1">{byePlayer}</div>
              <div className="text-xs text-yellow-800 font-medium">Avança automaticamente</div>
            </div>
            
            <div className="mt-2 text-center">
              <div className="inline-flex items-center gap-1 bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                <span>✨</span>
                <span>CLASSIFICADO</span>
                <span>✨</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative group min-w-[200px]">
        <div className={`rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
          isCompleted 
            ? 'bg-white shadow-emerald-200'
            : 'bg-white shadow-blue-200'
        }`}>
          {/* Header do Jogo */}
          <div className={`p-2 rounded-t-lg ${
            isCompleted 
              ? 'bg-gradient-to-r from-emerald-500 to-green-600'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-white text-xs font-bold">
                🏸 Jogo {index + 1}
              </div>
              {isCompleted && (
                <div className="text-white text-sm animate-pulse">🏆</div>
              )}
            </div>
          </div>
          
          {/* Área dos Jogadores */}
          <div className="p-3">
            {/* Jogador 1 */}
            <div className={`p-2 rounded-md mb-1 transition-all duration-200 ${
              isCompleted && (game.player1_id === game.winner_id || game.team1_id === game.winner_id)
                ? 'bg-gradient-to-r from-emerald-100 to-green-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${
                  isCompleted && (game.player1_id === game.winner_id || game.team1_id === game.winner_id)
                    ? 'text-emerald-900'
                    : 'text-gray-800'
                }`}>
                  {player1Name || 'TBD'}
                </span>
                {isCompleted && (game.player1_id === game.winner_id || game.team1_id === game.winner_id) && (
                  <span className="text-emerald-700 font-bold text-sm animate-bounce">👑</span>
                )}
              </div>
            </div>
            
            {/* Divisor VS */}
            <div className="text-center my-1">
              <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                isCompleted 
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-blue-200 text-blue-800'
              }`}>
                VS
              </div>
            </div>
            
            {/* Jogador 2 */}
            <div className={`p-2 rounded-md transition-all duration-200 ${
              isCompleted && (game.player2_id === game.winner_id || game.team2_id === game.winner_id)
                ? 'bg-gradient-to-r from-emerald-100 to-green-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${
                  isCompleted && (game.player2_id === game.winner_id || game.team2_id === game.winner_id)
                    ? 'text-emerald-900'
                    : 'text-gray-800'
                }`}>
                  {player2Name || 'TBD'}
                </span>
                {isCompleted && (game.player2_id === game.winner_id || game.team2_id === game.winner_id) && (
                  <span className="text-emerald-700 font-bold text-sm animate-bounce">👑</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer com Status */}
          {isCompleted && (
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-b-lg">
              <div className="text-center text-white">
                <div className="text-xs font-medium opacity-90">🏆 VENCEDOR</div>
                <div className="font-bold text-sm">{winnerName}</div>
              </div>
            </div>
          )}
          
          {game.status === 'pending' && (
            <div className="p-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-b-lg">
              <div className="text-center text-white">
                <div className="text-xs font-bold animate-pulse">⏳ AGUARDANDO</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPhase = (phase: Phase) => {
    const phaseGames = getGamesByPhase(phase.phase_number)
    const isFirstPhase = phase.phase_number === 1
    const isLastPhase = phase.phase_number === Math.max(...phases.map(p => p.phase_number))
    
    return (
      <div className="flex flex-col items-center relative">
        {/* Cabeçalho da Fase */}
          <div className={`text-center mb-3 p-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[200px] max-w-[200px] backdrop-blur-sm ${
              phase.phase_name.toLowerCase().includes('final') && !phase.phase_name.toLowerCase().includes('semi') && !phase.phase_name.toLowerCase().includes('quartas')
                ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 shadow-yellow-300/60'
                : phase.phase_name.toLowerCase().includes('semi')
                ? 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 shadow-orange-300/60'
                : phase.phase_name.toLowerCase().includes('quartas')
                ? 'bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 shadow-purple-300/60'
                : phase.phase_name.toLowerCase().includes('oitavas')
                ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 shadow-green-300/60'
                : 'bg-gradient-to-br from-blue-400 via-cyan-500 to-sky-600 shadow-blue-300/60'
            }`}>
              <h3 className={`font-black text-base truncate tracking-wider drop-shadow-md ${
                 phase.phase_name.toLowerCase().includes('final') && !phase.phase_name.toLowerCase().includes('semi') && !phase.phase_name.toLowerCase().includes('quartas')
                   ? 'text-white drop-shadow-yellow-800/50'
                   : phase.phase_name.toLowerCase().includes('semi')
                   ? 'text-white drop-shadow-orange-800/50'
                   : phase.phase_name.toLowerCase().includes('quartas')
                   ? 'text-white drop-shadow-purple-800/50'
                   : phase.phase_name.toLowerCase().includes('oitavas')
                   ? 'text-white drop-shadow-green-800/50'
                   : 'text-white drop-shadow-blue-800/50'
               }`}>
                {phase.phase_name}
              </h3>
              <div className={`text-sm mt-2 font-bold opacity-95 ${
                 phase.phase_name.toLowerCase().includes('final') && !phase.phase_name.toLowerCase().includes('semi') && !phase.phase_name.toLowerCase().includes('quartas')
                   ? 'text-yellow-100'
                   : phase.phase_name.toLowerCase().includes('semi')
                   ? 'text-orange-100'
                   : phase.phase_name.toLowerCase().includes('quartas')
                   ? 'text-purple-100'
                   : phase.phase_name.toLowerCase().includes('oitavas')
                   ? 'text-green-100'
                   : 'text-blue-100'
               }`}>
                {phaseGames.length} jogo{phaseGames.length !== 1 ? 's' : ''}
              </div>
            </div>
        
        {/* Container dos Jogos com Layout Bracket */}
         <div className="flex flex-col justify-center space-y-3 relative">
          {phaseGames.length > 0 ? (
            phaseGames.map((game, index) => (
              <div key={game.id} className="relative">
                {renderGame(game, index)}
                
                {/* Conectores verticais entre jogos da mesma fase */}
                  {index < phaseGames.length - 1 && phaseGames.length > 1 && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-0.5 h-2 bg-gray-300"></div>
                    </div>
                  )}
              </div>
            ))
          ) : (
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 shadow-inner min-w-[200px]">
                 <div className="text-2xl mb-1 opacity-50">📋</div>
                 <div className="text-gray-500 font-medium text-sm">Nenhum jogo criado</div>
                 <div className="text-gray-400 text-xs mt-1">Esta fase ainda não possui jogos</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/95 to-blue-50/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-spin">
            <span className="text-white text-2xl">⚡</span>
          </div>
          <div className="text-xl font-bold text-gray-700 mb-2">Carregando Chaveamento</div>
          <div className="text-gray-500">Buscando dados do torneio...</div>
        </div>
      </div>
    )
  }

  if (!localSelectedCategory) {
    return (
      <div className="bg-gradient-to-br from-white/95 to-blue-50/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl">
        {/* Cabeçalho Principal */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <span className="text-white text-2xl">🏆</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chaveamento do Torneio
              </h2>
              <p className="text-gray-600 text-sm font-medium">Acompanhe o progresso das eliminatórias</p>
            </div>
          </div>
        </div>
        
        {/* Filtro de Categoria */}
        <div className="mb-4">
          <select
            value={localSelectedCategory}
            onChange={(e) => setLocalSelectedCategory(e.target.value)}
            className="px-2 py-1 rounded bg-white/90 text-sm border-0 shadow-sm"
          >
              <option value="">🎯 Escolha uma categoria para visualizar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  🏸 {category.name}
                </option>
              ))}
            </select>
          </div>
        
        {/* Estado Vazio Melhorado */}
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-12 shadow-lg text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-white text-4xl">🏆</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Selecione uma Categoria</h3>
          <p className="text-gray-600 text-lg mb-2">Escolha uma categoria acima para visualizar</p>
          <p className="text-gray-500">o chaveamento completo do torneio</p>
        </div>
      </div>
    )
  }

  if (phases.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white/95 to-blue-50/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl">
        {/* Cabeçalho Principal */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <span className="text-white text-2xl">🏆</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chaveamento do Torneio
              </h2>
              <p className="text-gray-600 text-sm font-medium">Acompanhe o progresso das eliminatórias</p>
            </div>
          </div>
        </div>
        
        {/* Filtro de Categoria */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
            <label className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-4">
              <span className="text-2xl">🏷️</span>
              <span>Selecionar Categoria</span>
            </label>
            <select
              value={localSelectedCategory}
              onChange={(e) => setLocalSelectedCategory(e.target.value)}
              className="w-full max-w-lg p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-lg font-medium shadow-inner hover:shadow-lg"
            >
              <option value="">🎯 Escolha uma categoria para visualizar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  🏸 {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Estado Sem Fases */}
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-12 border border-white/40 shadow-lg text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-4xl">📊</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Nenhuma Fase Encontrada</h3>
          <p className="text-gray-600 text-lg mb-2">Esta categoria ainda não possui</p>
          <p className="text-gray-500">fases ou jogos criados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white/95 to-blue-50/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl border border-white/30">
      {/* Cabeçalho Principal */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white text-2xl">🏆</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chaveamento do Torneio
            </h2>
            <p className="text-gray-600 text-sm font-medium">Acompanhe o progresso das eliminatórias</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          <span className="animate-pulse">🔴</span>
          <span>AO VIVO</span>
        </div>
      </div>
      
      {/* Filtro de Categoria Melhorado */}
      <div className="mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-4">
            <span className="text-2xl">🏷️</span>
            <span>Selecionar Categoria</span>
          </label>
          <select
            value={localSelectedCategory}
            onChange={(e) => setLocalSelectedCategory(e.target.value)}
            className="w-full max-w-lg p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-lg font-medium shadow-inner hover:shadow-lg"
          >
            <option value="">🎯 Escolha uma categoria para visualizar</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                🏸 {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Área do Chaveamento */}
      <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-bold text-gray-800">Bracket de Eliminação</h3>
        </div>
        
        <div className="overflow-x-auto pb-3">
          <div className="flex items-start justify-center gap-3 min-w-max relative">
            {phases.map((phase, phaseIndex) => (
              <div key={phase.id} className="relative">
                {renderPhase(phase)}
                
                {/* Conectores entre fases */}
                  {phaseIndex < phases.length - 1 && (
                    <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Guia de Instruções Melhorado */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💡</span>
          <h4 className="text-xl font-bold text-gray-800">Como Funciona o Chaveamento</h4>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">🏆</span>
              <div>
                <div className="font-semibold text-gray-800">Vencedores Avançam</div>
                <div className="text-sm text-gray-600">Jogadores vitoriosos passam para a próxima fase</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-lg">🔥</span>
              <div>
                <div className="font-semibold text-gray-800">Fase Ativa</div>
                <div className="text-sm text-gray-600">Onde novos jogos podem ser criados e gerenciados</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <div className="font-semibold text-gray-800">Jogos BYE</div>
                <div className="text-sm text-gray-600">Jogadores avançam automaticamente quando não há oponente</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-lg">👑</span>
              <div>
                <div className="font-semibold text-gray-800">Indicadores Visuais</div>
                <div className="text-sm text-gray-600">Coroas e troféus mostram vencedores claramente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}