'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Game {
  id: number
  player1_id: number
  player2_id: number
  category_id: number
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
  is_editable?: boolean
  player1?: { name: string }
  player2?: { name: string }
  category?: { name: string }
}

interface GamesListProps {
  games: Game[]
  players: any[]
  categories: any[]
  onGamesUpdated: () => void
}

export default function GamesList({ games, players, categories, onGamesUpdated }: GamesListProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPlayer, setFilterPlayer] = useState('')

  const generateGames = async () => {
    if (!selectedCategory) {
      alert('Selecione uma categoria')
      return
    }

    setLoading(true)
    try {
      // Buscar jogadores da categoria selecionada
      const categoryPlayers = players.filter(p => p.category_id.toString() === selectedCategory)
      
      if (categoryPlayers.length < 2) {
        alert('É necessário pelo menos 2 jogadores na categoria para gerar jogos')
        setLoading(false)
        return
      }

      // Buscar jogos já existentes para esta categoria
      const { data: existingGames } = await supabase
        .from('games')
        .select('player1_id, player2_id')
        .eq('category_id', selectedCategory)

      // Criar um Set com as combinações já existentes para verificação rápida
      const existingCombinations = new Set()
      if (existingGames) {
        existingGames.forEach(game => {
          // Adicionar ambas as combinações (player1-player2 e player2-player1)
          existingCombinations.add(`${game.player1_id}-${game.player2_id}`)
          existingCombinations.add(`${game.player2_id}-${game.player1_id}`)
        })
      }

      // Gerar apenas os jogos que ainda não existem
      const newGames = []
      for (let i = 0; i < categoryPlayers.length; i++) {
        for (let j = i + 1; j < categoryPlayers.length; j++) {
          const player1Id = categoryPlayers[i].id
          const player2Id = categoryPlayers[j].id
          const combination = `${player1Id}-${player2Id}`
          
          // Verificar se esta combinação já existe
          if (!existingCombinations.has(combination)) {
            newGames.push({
              player1_id: player1Id,
              player2_id: player2Id,
              category_id: parseInt(selectedCategory)
            })
          }
        }
      }

      // Verificar se há novos jogos para inserir
      if (newGames.length === 0) {
        alert('Todos os jogos possíveis já foram gerados para esta categoria!')
        setLoading(false)
        return
      }

      // Inserir apenas os novos jogos no banco
      const { error } = await supabase
        .from('games')
        .insert(newGames)

      if (error) {
        console.error('Erro ao gerar jogos:', error)
        alert('Erro ao gerar jogos')
      } else {
        onGamesUpdated()
        alert(`${newGames.length} jogos gerados com sucesso!`)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao gerar jogos')
    } finally {
      setLoading(false)
    }
  }

  const updateGameResult = async (gameId: number, sets: any, winnerId: number) => {
    setLoading(true)
    try {
      // Calcular placar total baseado nos sets
      const player1Total = (sets.set1_player1 || 0) + (sets.set2_player1 || 0) + (sets.set3_player1 || 0)
      const player2Total = (sets.set1_player2 || 0) + (sets.set2_player2 || 0) + (sets.set3_player2 || 0)
      
      const { error } = await supabase
        .from('games')
        .update({
          set1_player1: sets.set1_player1 || 0,
          set1_player2: sets.set1_player2 || 0,
          set2_player1: sets.set2_player1 || 0,
          set2_player2: sets.set2_player2 || 0,
          set3_player1: sets.set3_player1 || 0,
          set3_player2: sets.set3_player2 || 0,
          player1_score: player1Total,
          player2_score: player2Total,
          winner_id: winnerId,
          is_editable: true
        })
        .eq('id', gameId)

      if (error) {
        console.error('Erro ao atualizar resultado:', error)
        alert('Erro ao salvar resultado')
      } else {
        onGamesUpdated()
        alert('Resultado salvo com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao salvar resultado')
    } finally {
      setLoading(false)
    }
  }

  const updateGameDate = async (gameId: number, date: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('games')
        .update({ game_date: date })
        .eq('id', gameId)

      if (error) {
        console.error('Erro ao atualizar data:', error)
        alert('Erro ao atualizar data')
      } else {
        onGamesUpdated()
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Gerador de Jogos */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Gerar Jogos por Categoria</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-black mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black"
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
            onClick={generateGames}
            disabled={loading || !selectedCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Gerar Jogos'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Filtrar por Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Filtrar por Jogador
            </label>
            <select
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="">Todos os jogadores</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Jogos */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            <span className="bg-blue-100 p-2 rounded-lg">
              🏸
            </span>
            Jogos Cadastrados
          </h3>
          <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <span className="text-sm font-medium text-blue-700">
              {(() => {
                let filteredGames = games
                
                if (filterCategory) {
                  filteredGames = filteredGames.filter(game => game.category_id.toString() === filterCategory)
                }
                
                if (filterPlayer) {
                  filteredGames = filteredGames.filter(game => 
                    game.player1_id.toString() === filterPlayer || game.player2_id.toString() === filterPlayer
                  )
                }
                
                return filteredGames.length
              })()} jogos
            </span>
          </div>
        </div>
        
        {(() => {
          let filteredGames = games
          
          if (filterCategory) {
            filteredGames = filteredGames.filter(game => game.category_id.toString() === filterCategory)
          }
          
          if (filterPlayer) {
            filteredGames = filteredGames.filter(game => 
              game.player1_id.toString() === filterPlayer || game.player2_id.toString() === filterPlayer
            )
          }
          
          return filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
                <div className="text-6xl mb-4">🏸</div>
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Nenhum jogo encontrado</h4>
                <p className="text-blue-600">
                  {games.length === 0 ? 'Cadastre novos jogos para começar.' : 'Ajuste os filtros ou cadastre novos jogos.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredGames.map((game, index) => (
                <div key={game.id} className="transform hover:scale-[1.01] transition-all duration-200">
                  <GameCard
                    game={game}
                    onUpdateResult={updateGameResult}
                    onUpdateDate={updateGameDate}
                    loading={loading}
                  />
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

interface GameCardProps {
  game: Game
  onUpdateResult: (gameId: number, sets: any, winnerId: number) => void
  onUpdateDate: (gameId: number, date: string) => void
  loading: boolean
}

function GameCard({ game, onUpdateResult, onUpdateDate, loading }: GameCardProps) {
  const [isEditing, setIsEditing] = useState(!game.winner_id)
  const [gameDate, setGameDate] = useState(game.game_date || '')
  
  // Estados para os 3 sets
  const [set1Player1, setSet1Player1] = useState(game.set1_player1 || 0)
  const [set1Player2, setSet1Player2] = useState(game.set1_player2 || 0)
  const [set2Player1, setSet2Player1] = useState(game.set2_player1 || 0)
  const [set2Player2, setSet2Player2] = useState(game.set2_player2 || 0)
  const [set3Player1, setSet3Player1] = useState(game.set3_player1 || 0)
  const [set3Player2, setSet3Player2] = useState(game.set3_player2 || 0)

  const handleSubmitResult = () => {
    // Verificar se pelo menos um set foi preenchido
    if (set1Player1 === 0 && set1Player2 === 0) {
      alert('Preencha pelo menos o primeiro set')
      return
    }
    
    // Calcular vencedor baseado nos sets ganhos
    let player1Sets = 0
    let player2Sets = 0
    
    if (set1Player1 > set1Player2) player1Sets++
    else if (set1Player2 > set1Player1) player2Sets++
    
    if (set2Player1 > set2Player2) player1Sets++
    else if (set2Player2 > set2Player1) player2Sets++
    
    if (set3Player1 > set3Player2) player1Sets++
    else if (set3Player2 > set3Player1) player2Sets++
    
    if (player1Sets === player2Sets) {
      alert('Deve haver um vencedor (quem ganhou mais sets)')
      return
    }
    
    const winnerId = player1Sets > player2Sets ? game.player1_id : game.player2_id
    
    const sets = {
      set1_player1: set1Player1,
      set1_player2: set1Player2,
      set2_player1: set2Player1,
      set2_player2: set2Player2,
      set3_player1: set3Player1,
      set3_player2: set3Player2
    }
    
    onUpdateResult(game.id, sets, winnerId)
    setIsEditing(false)
  }

  const handleDateChange = (newDate: string) => {
    setGameDate(newDate)
    onUpdateDate(game.id, newDate)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Restaurar valores originais
    setSet1Player1(game.set1_player1 || 0)
    setSet1Player2(game.set1_player2 || 0)
    setSet2Player1(game.set2_player1 || 0)
    setSet2Player2(game.set2_player2 || 0)
    setSet3Player1(game.set3_player1 || 0)
    setSet3Player2(game.set3_player2 || 0)
    setIsEditing(false)
  }

  return (
    <div className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-lg">⚔️</span>
            </div>
            <h4 className="font-bold text-lg text-blue-900">
              {game.player1?.name} vs {game.player2?.name}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-blue-200 p-1 rounded text-xs">🏆</span>
              <span className="text-blue-700 font-medium">{game.category?.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              game.winner_id 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {game.winner_id ? '✅ Finalizado' : '⏳ Pendente'}
            </span>
          </div>
          <input
            type="date"
            value={gameDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border rounded px-2 py-1 text-sm text-black"
            disabled={loading}
          />
        </div>
      </div>

      {/* Placar dos 3 Sets */}
      <div className="bg-white rounded-lg p-4 border border-blue-100 space-y-4">
        <div className="text-center">
          <h5 className="font-bold text-blue-800 mb-4 flex items-center justify-center gap-2">
            <span className="bg-blue-100 p-1 rounded">🏸</span>
            Placares dos Sets
          </h5>
        </div>
        
        {/* Sets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((setNumber) => {
            const player1Score = setNumber === 1 ? set1Player1 : setNumber === 2 ? set2Player1 : set3Player1
            const player2Score = setNumber === 1 ? set1Player2 : setNumber === 2 ? set2Player2 : set3Player2
            const hasWinner = player1Score > 0 || player2Score > 0
            const setWinner = player1Score > player2Score ? 'player1' : player1Score < player2Score ? 'player2' : null
            
            return (
              <div key={setNumber} className={`bg-gradient-to-br from-blue-50 to-white border-2 rounded-xl p-4 transition-all ${
                hasWinner ? 'border-blue-300 shadow-md' : 'border-blue-200'
              }`}>
                <div className="text-center mb-3">
                  <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-sm">🏸</span>
                    <span className="text-sm font-bold text-blue-800">Set {setNumber}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-2 rounded-lg ${
                    setWinner === 'player1' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                  }`}>
                    <span className="text-sm font-medium text-gray-700 truncate flex-1">
                      {game.player1?.name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={player1Score || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        if (setNumber === 1) setSet1Player1(value)
                        else if (setNumber === 2) setSet2Player1(value)
                        else setSet3Player1(value)
                      }}
                      className="w-16 p-1 border border-blue-300 rounded text-center font-bold text-blue-900 bg-white"
                      disabled={loading || !isEditing}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="text-center text-blue-400 font-bold">VS</div>
                  
                  <div className={`flex items-center justify-between p-2 rounded-lg ${
                    setWinner === 'player2' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                  }`}>
                    <span className="text-sm font-medium text-gray-700 truncate flex-1">
                      {game.player2?.name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={player2Score || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        if (setNumber === 1) setSet1Player2(value)
                        else if (setNumber === 2) setSet2Player2(value)
                        else setSet3Player2(value)
                      }}
                      className="w-16 p-1 border border-blue-300 rounded text-center font-bold text-blue-900 bg-white"
                      disabled={loading || !isEditing}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-blue-100">
        {isEditing ? (
          <>
            <button
              onClick={handleSubmitResult}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <span>{loading ? '⏳' : '💾'}</span>
              {loading ? 'Salvando...' : 'Salvar Resultado'}
            </button>
            {game.winner_id && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <span>❌</span>
                Cancelar
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleEdit}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <span>✏️</span>
            Editar Resultado
          </button>
        )}
      </div>
      
      {/* Mostrar vencedor */}
      {game.winner_id && (
        <div className="mt-4 text-center">
          <p className="text-sm text-green-600 font-medium">
            🏆 Vencedor: {game.winner_id === game.player1_id ? game.player1?.name : game.player2?.name}
          </p>
          <p className="text-xs text-black">
            Placar total: {game.player1_score || 0} x {game.player2_score || 0}
          </p>
        </div>
      )}
    </div>
  )
}