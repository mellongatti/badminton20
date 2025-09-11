'use client'

import { useState } from 'react'
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

      // Gerar todos os jogos possíveis (cada jogador joga com cada outro uma vez)
      const newGames = []
      for (let i = 0; i < categoryPlayers.length; i++) {
        for (let j = i + 1; j < categoryPlayers.length; j++) {
          newGames.push({
            player1_id: categoryPlayers[i].id,
            player2_id: categoryPlayers[j].id,
            category_id: parseInt(selectedCategory)
          })
        }
      }

      // Verificar se já existem jogos para esta categoria
      const { data: existingGames } = await supabase
        .from('games')
        .select('*')
        .eq('category_id', selectedCategory)

      if (existingGames && existingGames.length > 0) {
        if (!confirm('Já existem jogos para esta categoria. Deseja adicionar novos jogos mesmo assim?')) {
          setLoading(false)
          return
        }
      }

      // Inserir jogos no banco
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

  const updateGameResult = async (gameId: number, player1Score: number, player2Score: number, winnerId: number) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('games')
        .update({
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId
        })
        .eq('id', gameId)

      if (error) {
        console.error('Erro ao atualizar resultado:', error)
        alert('Erro ao atualizar resultado')
      } else {
        onGamesUpdated()
        alert('Resultado atualizado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar resultado')
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
        <h3 className="text-lg font-medium mb-4">Gerar Jogos por Categoria</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
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

      {/* Lista de Jogos */}
      <div>
        <h3 className="text-lg font-medium mb-4">Jogos Cadastrados</h3>
        {games.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum jogo cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onUpdateResult={updateGameResult}
                onUpdateDate={updateGameDate}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface GameCardProps {
  game: Game
  onUpdateResult: (gameId: number, player1Score: number, player2Score: number, winnerId: number) => void
  onUpdateDate: (gameId: number, date: string) => void
  loading: boolean
}

function GameCard({ game, onUpdateResult, onUpdateDate, loading }: GameCardProps) {
  const [player1Score, setPlayer1Score] = useState(game.player1_score || 0)
  const [player2Score, setPlayer2Score] = useState(game.player2_score || 0)
  const [gameDate, setGameDate] = useState(game.game_date || '')

  const handleSubmitResult = () => {
    if (player1Score === player2Score) {
      alert('O placar não pode ser empate')
      return
    }
    
    const winnerId = player1Score > player2Score ? game.player1_id : game.player2_id
    onUpdateResult(game.id, player1Score, player2Score, winnerId)
  }

  const handleDateChange = (newDate: string) => {
    setGameDate(newDate)
    onUpdateDate(game.id, newDate)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium text-lg">
            {game.player1?.name} vs {game.player2?.name}
          </h4>
          <p className="text-sm text-gray-600">{game.category?.name}</p>
        </div>
        <div className="text-right">
          <input
            type="date"
            value={gameDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="text-center">
          <p className="text-sm font-medium">{game.player1?.name}</p>
          <input
            type="number"
            min="0"
            value={player1Score}
            onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
            className="w-16 border rounded px-2 py-1 text-center mt-1"
            disabled={loading}
          />
        </div>
        
        <div className="text-center">
          <span className="text-2xl font-bold">VS</span>
        </div>
        
        <div className="text-center">
          <p className="text-sm font-medium">{game.player2?.name}</p>
          <input
            type="number"
            min="0"
            value={player2Score}
            onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
            className="w-16 border rounded px-2 py-1 text-center mt-1"
            disabled={loading}
          />
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={handleSubmitResult}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Resultado'}
        </button>
        
        {game.winner_id && (
          <p className="mt-2 text-sm text-green-600 font-medium">
            Vencedor: {game.winner_id === game.player1_id ? game.player1?.name : game.player2?.name}
          </p>
        )}
      </div>
    </div>
  )
}