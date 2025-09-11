'use client'

import React, { useMemo } from 'react'

interface Game {
  id: number
  player1_id: number
  player2_id: number
  category_id: number
  player1_score?: number
  player2_score?: number
  winner_id?: number
  player1?: { name: string }
  player2?: { name: string }
  category?: { name: string }
}

interface Player {
  id: number
  name: string
  category_id: number
  categories?: { name: string }
}

interface Category {
  id: number
  name: string
}

interface StandingsProps {
  games: Game[]
  players: Player[]
  categories: Category[]
}

interface PlayerStats {
  playerId: number
  playerName: string
  wins: number
  losses: number
  gamesPlayed: number
  pointsFor: number
  pointsAgainst: number
  winPercentage: number
}

export default function Standings({ games, players, categories }: StandingsProps) {
  const standingsByCategory = useMemo(() => {
    const categoryStandings: { [categoryId: number]: PlayerStats[] } = {}

    categories.forEach(category => {
      const categoryPlayers = players.filter(p => p.category_id === category.id)
      const categoryGames = games.filter(g => g.category_id === category.id && g.winner_id)

      const playerStats: { [playerId: number]: PlayerStats } = {}

      // Inicializar stats para todos os jogadores da categoria
      categoryPlayers.forEach(player => {
        playerStats[player.id] = {
          playerId: player.id,
          playerName: player.name,
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          winPercentage: 0
        }
      })

      // Calcular estatísticas baseadas nos jogos
      categoryGames.forEach(game => {
        if (game.player1_score !== undefined && game.player2_score !== undefined) {
          const player1Stats = playerStats[game.player1_id]
          const player2Stats = playerStats[game.player2_id]

          if (player1Stats && player2Stats) {
            // Atualizar jogos disputados
            player1Stats.gamesPlayed++
            player2Stats.gamesPlayed++

            // Atualizar pontos
            player1Stats.pointsFor += game.player1_score
            player1Stats.pointsAgainst += game.player2_score
            player2Stats.pointsFor += game.player2_score
            player2Stats.pointsAgainst += game.player1_score

            // Atualizar vitórias e derrotas
            if (game.winner_id === game.player1_id) {
              player1Stats.wins++
              player2Stats.losses++
            } else if (game.winner_id === game.player2_id) {
              player2Stats.wins++
              player1Stats.losses++
            }
          }
        }
      })

      // Calcular porcentagem de vitórias
      Object.values(playerStats).forEach(stats => {
        stats.winPercentage = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0
      })

      // Ordenar por: 1) % vitórias, 2) número de vitórias, 3) saldo de pontos
      const sortedStats = Object.values(playerStats)
        .filter(stats => stats.gamesPlayed > 0) // Só mostrar quem jogou
        .sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) {
            return b.winPercentage - a.winPercentage
          }
          if (b.wins !== a.wins) {
            return b.wins - a.wins
          }
          const aPointDiff = a.pointsFor - a.pointsAgainst
          const bPointDiff = b.pointsFor - b.pointsAgainst
          return bPointDiff - aPointDiff
        })

      categoryStandings[category.id] = sortedStats
    })

    return categoryStandings
  }, [games, players, categories])

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const standings = standingsByCategory[category.id] || []
        
        if (standings.length === 0) {
          return (
            <div key={category.id} className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-blue-800">{category.name}</h3>
              <p className="text-black">Nenhum jogo finalizado nesta categoria ainda.</p>
            </div>
          )
        }

        return (
          <div key={category.id} className="bg-white border rounded-xl overflow-hidden shadow-lg border-blue-100">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <h3 className="text-xl font-bold text-blue-800">{category.name}</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Jogador
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Jogos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Vitórias
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Derrotas
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Sets Ganhos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Sets Perdidos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Pontos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {standings.map((stats, index) => {
                    const saldo = stats.pointsFor - stats.pointsAgainst
                    const isChampion = index === 0
                    
                    return (
                      <tr key={stats.playerId} className={isChampion ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            isChampion ? 'text-yellow-600' : 'text-black'
                          }`}>
                            {index + 1}º
                            {isChampion && ' 🏆'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            isChampion ? 'text-yellow-600' : 'text-black'
                          }`}>
                            {stats.playerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                          {stats.gamesPlayed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                          {stats.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                          {stats.losses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black font-medium">
                          {stats.winPercentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                          {stats.pointsFor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                          {stats.pointsAgainst}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                          {saldo >= 0 ? '+' : ''}{saldo}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
      
      {categories.length === 0 && (
        <div className="text-center py-8 text-black">
          Nenhuma categoria cadastrada ainda.
        </div>
      )}
    </div>
  )
}