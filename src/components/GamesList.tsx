'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Game {
  id: number
  player1_id?: number
  player2_id?: number
  team1_id?: number
  team2_id?: number
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
  is_doubles?: boolean
  is_wo?: boolean
  player1?: { name: string }
  player2?: { name: string }
  team1?: { name: string }
  team2?: { name: string }
  category?: { name: string }
}

interface GamesListProps {
  games: Game[]
  players: any[]
  categories: any[]
  onGamesUpdated: () => void
  settingsMode?: boolean
}

export default function GamesList({ games, players, categories, onGamesUpdated, settingsMode = false }: GamesListProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPlayer, setFilterPlayer] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterGameType, setFilterGameType] = useState('')
  const [gameType, setGameType] = useState<'individual' | 'doubles'>('individual')
  const [teams, setTeams] = useState<any[]>([])

  // Carregar duplas
  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name')

      if (error) {
        console.error('Erro ao carregar duplas:', error)
      } else {
        setTeams(data || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  React.useEffect(() => {
    loadTeams()
  }, [])

  const deleteGame = async (gameId: number) => {
    // Solicitar senha do sistema
    const password = prompt('⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\nPara excluir este jogo, digite a senha do sistema:')
    
    if (!password) {
      return // Usuário cancelou
    }
    
    if (password !== 'zendesk') {
      alert('❌ Senha incorreta! Exclusão cancelada.')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este jogo?\n\nEsta ação não pode ser desfeita!')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)

      if (error) {
        console.error('Erro ao excluir jogo:', error)
        alert('❌ Erro ao excluir jogo')
      } else {
        onGamesUpdated()
        alert('✅ Jogo excluído com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('❌ Erro ao excluir jogo')
    } finally {
      setLoading(false)
    }
  }

  const removeDuplicateGames = async () => {
    if (!confirm('Deseja remover todos os jogos duplicados? Esta ação não pode ser desfeita.')) {
      return
    }

    setLoading(true)
    try {
      // Buscar todos os jogos
      const { data: allGames } = await supabase
        .from('games')
        .select('*')
        .order('id')

      if (!allGames) {
        setLoading(false)
        return
      }

      // Identificar duplicatas
      const seenCombinations = new Set()
      const duplicateIds = []

      allGames.forEach(game => {
        const combination1 = `${game.player1_id}-${game.player2_id}-${game.category_id}`
        const combination2 = `${game.player2_id}-${game.player1_id}-${game.category_id}`
        
        if (seenCombinations.has(combination1) || seenCombinations.has(combination2)) {
          duplicateIds.push(game.id)
        } else {
          seenCombinations.add(combination1)
        }
      })

      if (duplicateIds.length === 0) {
        alert('Nenhum jogo duplicado encontrado!')
        setLoading(false)
        return
      }

      // Remover duplicatas
      const { error } = await supabase
        .from('games')
        .delete()
        .in('id', duplicateIds)

      if (error) {
        console.error('Erro ao remover duplicatas:', error)
        alert('Erro ao remover jogos duplicados')
      } else {
        onGamesUpdated()
        alert(`${duplicateIds.length} jogo(s) duplicado(s) removido(s) com sucesso!`)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao remover jogos duplicados')
    } finally {
      setLoading(false)
    }
  }

  const generateGames = async () => {
    if (!selectedCategory) {
      alert('Selecione uma categoria')
      return
    }

    setLoading(true)
    try {
      if (gameType === 'individual') {
        await generateIndividualGames()
      } else {
        await generateDoublesGames()
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao gerar jogos')
    } finally {
      setLoading(false)
    }
  }

  const generateIndividualGames = async () => {
    // Buscar jogadores da categoria selecionada
    const categoryPlayers = players.filter(p => p.category_id.toString() === selectedCategory)
    
    if (categoryPlayers.length < 2) {
      alert('É necessário pelo menos 2 jogadores na categoria para gerar jogos')
      return
    }

    // Buscar jogos já existentes para esta categoria
    const { data: existingGames } = await supabase
      .from('games')
      .select('player1_id, player2_id')
      .eq('category_id', selectedCategory)
      .eq('is_doubles', false)

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
            category_id: parseInt(selectedCategory),
            is_doubles: false
          })
        }
      }
    }

    // Verificar se há novos jogos para inserir
    if (newGames.length === 0) {
      alert('Todos os jogos individuais possíveis já foram gerados para esta categoria!')
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
      alert(`${newGames.length} jogos individuais gerados com sucesso!`)
    }
  }

  const generateDoublesGames = async () => {
    // Buscar duplas da categoria selecionada
    const categoryTeams = teams.filter(t => t.category_id.toString() === selectedCategory)
    
    if (categoryTeams.length < 2) {
      alert('É necessário pelo menos 2 duplas na categoria para gerar jogos')
      return
    }

    // Buscar jogos de duplas já existentes para esta categoria
    const { data: existingGames } = await supabase
      .from('games')
      .select('team1_id, team2_id')
      .eq('category_id', selectedCategory)
      .eq('is_doubles', true)

    // Criar um Set com as combinações já existentes para verificação rápida
    const existingCombinations = new Set()
    if (existingGames) {
      existingGames.forEach(game => {
        // Adicionar ambas as combinações (team1-team2 e team2-team1)
        existingCombinations.add(`${game.team1_id}-${game.team2_id}`)
        existingCombinations.add(`${game.team2_id}-${game.team1_id}`)
      })
    }

    // Gerar apenas os jogos que ainda não existem
    const newGames = []
    for (let i = 0; i < categoryTeams.length; i++) {
      for (let j = i + 1; j < categoryTeams.length; j++) {
        const team1Id = categoryTeams[i].id
        const team2Id = categoryTeams[j].id
        const combination = `${team1Id}-${team2Id}`
        
        // Verificar se esta combinação já existe
        if (!existingCombinations.has(combination)) {
          newGames.push({
            team1_id: team1Id,
            team2_id: team2Id,
            category_id: parseInt(selectedCategory),
            is_doubles: true
          })
        }
      }
    }

    // Verificar se há novos jogos para inserir
    if (newGames.length === 0) {
      alert('Todos os jogos de duplas possíveis já foram gerados para esta categoria!')
      return
    }

    // Inserir apenas os novos jogos no banco
    const { error } = await supabase
      .from('games')
      .insert(newGames)

    if (error) {
      console.error('Erro ao gerar jogos de duplas:', error)
      alert('Erro ao gerar jogos de duplas')
    } else {
      onGamesUpdated()
      alert(`${newGames.length} jogos de duplas gerados com sucesso!`)
    }
  }

  const updateGameResult = async (gameId: number, sets: any, winnerId: number) => {
    setLoading(true)
    try {
      // Calcular placar total baseado nos sets
      const player1Total = (sets.set1_player1 || 0) + (sets.set2_player1 || 0) + (sets.set3_player1 || 0)
      const player2Total = (sets.set1_player2 || 0) + (sets.set2_player2 || 0) + (sets.set3_player2 || 0)
      
      // Primeiro, verificar se o jogo existe e se é de duplas
      const { data: gameData, error: fetchError } = await supabase
        .from('games')
        .select('is_doubles')
        .eq('id', gameId)
        .single()

      if (fetchError) {
        console.error('Erro ao buscar jogo:', fetchError)
        alert('Erro ao buscar informações do jogo')
        return
      }

      // Preparar dados para atualização
      const updateData: any = {
        set1_player1: sets.set1_player1 || 0,
        set1_player2: sets.set1_player2 || 0,
        set2_player1: sets.set2_player1 || 0,
        set2_player2: sets.set2_player2 || 0,
        set3_player1: sets.set3_player1 || 0,
        set3_player2: sets.set3_player2 || 0,
        player1_score: player1Total,
        player2_score: player2Total,
        winner_id: winnerId
      }

      // Adicionar is_editable apenas se a coluna existir
      try {
        updateData.is_editable = true
      } catch (e) {
        // Ignorar se a coluna não existir
      }
      
      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)

      if (error) {
        console.error('Erro ao atualizar resultado:', error)
        
        // Verificar se o erro é relacionado a colunas inexistentes
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ ERRO: As colunas necessárias para jogos de duplas não existem no banco de dados.\n\nPara resolver:\n1. Abra o Supabase Dashboard\n2. Vá para SQL Editor\n3. Execute o script "add-doubles-games-support.sql"')
        } else {
          alert('Erro ao salvar resultado: ' + error.message)
        }
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
      // Usar a data diretamente sem conversão para evitar problemas de fuso horário
      const formattedDate = date || null
      
      const { error } = await supabase
        .from('games')
        .update({ game_date: formattedDate })
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

  // Se estiver no modo configurações, mostrar apenas as ferramentas de manutenção
  if (settingsMode) {
    return (
      <div className="space-y-6">
        {/* Ferramentas de Manutenção */}
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold mb-4 text-red-800">🛠️ Ferramentas de Manutenção</h3>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border border-red-100">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Remover Jogos Duplicados</h4>
                  <p className="text-xs text-gray-600">Remove automaticamente jogos duplicados do sistema</p>
                </div>
                <button
                  onClick={removeDuplicateGames}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Removendo...' : '🗑️ Remover Duplicatas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gerador de Jogos */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Gerar Jogos por Categoria</h3>
        <div className="space-y-4">
          {/* Seletor de Tipo de Jogo */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Tipo de Jogo
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gameType"
                  value="individual"
                  checked={gameType === 'individual'}
                  onChange={(e) => setGameType(e.target.value as 'individual' | 'doubles')}
                  className="mr-2"
                />
                <span className="text-black">Jogos Individuais</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gameType"
                  value="doubles"
                  checked={gameType === 'doubles'}
                  onChange={(e) => setGameType(e.target.value as 'individual' | 'doubles')}
                  className="mr-2"
                />
                <span className="text-black">Jogos de Duplas</span>
              </label>
            </div>
          </div>
          
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
              {loading ? 'Gerando...' : `Gerar Jogos ${gameType === 'individual' ? 'Individuais' : 'de Duplas'}`}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-blue-800">Filtros</h3>
          <button
            onClick={() => {
              setFilterCategory('')
              setFilterPlayer('')
              setFilterStatus('')
              setFilterDateFrom('')
              setFilterGameType('')
            }}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
          >
            🗑️ Limpar Filtros
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Filtrar por Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="">Todos os status</option>
              <option value="pendente">🟡 Pendentes</option>
              <option value="finalizado">🟢 Finalizados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Data do Jogo
            </label>
            <select
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="">Todas as datas</option>
              {(() => {
                // Extrair datas únicas dos jogos cadastrados
                const uniqueDates = Array.from(new Set(
                  games
                    .filter(game => game.game_date)
                    .map(game => game.game_date)
                    .sort()
                ))
                
                return uniqueDates.map(date => {
                  // Formatar a data para exibição
                  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
                  return (
                    <option key={date} value={date}>
                      {formattedDate}
                    </option>
                  )
                })
              })()} 
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Tipo de Jogo
            </label>
            <select
              value={filterGameType}
              onChange={(e) => setFilterGameType(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="">Todos os tipos</option>
              <option value="individual">🏸 Individual</option>
              <option value="doubles">👥 Duplas</option>
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
                  filteredGames = filteredGames.filter(game => game.category_id && game.category_id.toString() === filterCategory)
                }
                
                if (filterPlayer) {
                  filteredGames = filteredGames.filter(game => 
                    (game.player1_id && game.player1_id.toString() === filterPlayer) || 
                    (game.player2_id && game.player2_id.toString() === filterPlayer)
                  )
                }
                
                if (filterStatus) {
                  filteredGames = filteredGames.filter(game => {
                    const isFinished = game.winner_id !== null && game.winner_id !== undefined
                    return filterStatus === 'finalizado' ? isFinished : !isFinished
                  })
                }
                
                if (filterDateFrom) {
                  filteredGames = filteredGames.filter(game => {
                    if (!game.game_date) return false
                    // Normalizar ambas as datas para comparação
                    const gameDate = game.game_date.split('T')[0] // Remove hora se existir
                    const filterDate = filterDateFrom.split('T')[0] // Remove hora se existir
                    return gameDate === filterDate
                  })
                }
                
                if (filterGameType) {
                  filteredGames = filteredGames.filter(game => {
                    if (filterGameType === 'individual') {
                      return !game.is_doubles
                    } else if (filterGameType === 'doubles') {
                      return game.is_doubles
                    }
                    return true
                  })
                }
                
                // Ordenar jogos: pendentes primeiro, depois finalizados
                filteredGames = filteredGames.sort((a, b) => {
                  const aIsPending = !a.winner_id
                  const bIsPending = !b.winner_id
                  
                  // Se um é pendente e outro não, o pendente vem primeiro
                  if (aIsPending && !bIsPending) return -1
                  if (!aIsPending && bIsPending) return 1
                  
                  // Se ambos têm o mesmo status, manter ordem original (por ID)
                  return a.id - b.id
                })
                
                return filteredGames.length
              })()} jogos
            </span>
          </div>
        </div>
        
        {(() => {
          let filteredGames = games
          
          if (filterCategory) {
            filteredGames = filteredGames.filter(game => game.category_id && game.category_id.toString() === filterCategory)
          }
          
          if (filterPlayer) {
            filteredGames = filteredGames.filter(game => {
              // Para jogos individuais
              const isInIndividualGame = (game.player1_id && game.player1_id.toString() === filterPlayer) || 
                                       (game.player2_id && game.player2_id.toString() === filterPlayer)
              
              // Para jogos de duplas - verificar se o jogador está em alguma das duplas
              const isInDoublesGame = game.is_doubles && (
                (game.team1_id && teams.some(team => 
                  team.id === game.team1_id && 
                  (team.player1_id.toString() === filterPlayer || team.player2_id.toString() === filterPlayer)
                )) ||
                (game.team2_id && teams.some(team => 
                  team.id === game.team2_id && 
                  (team.player1_id.toString() === filterPlayer || team.player2_id.toString() === filterPlayer)
                ))
              )
              
              return isInIndividualGame || isInDoublesGame
            })
          }
          
          if (filterStatus) {
            filteredGames = filteredGames.filter(game => {
              const isFinished = game.winner_id !== null && game.winner_id !== undefined
              return filterStatus === 'finalizado' ? isFinished : !isFinished
            })
          }
          
          if (filterDateFrom) {
            filteredGames = filteredGames.filter(game => {
              if (!game.game_date) return false
              // Normalizar ambas as datas para comparação
              const gameDate = game.game_date.split('T')[0] // Remove hora se existir
              const filterDate = filterDateFrom.split('T')[0] // Remove hora se existir
              return gameDate === filterDate
            })
          }
          
          if (filterGameType) {
            filteredGames = filteredGames.filter(game => {
              if (filterGameType === 'individual') {
                return !game.is_doubles
              } else if (filterGameType === 'doubles') {
                return game.is_doubles
              }
              return true
            })
          }
          
          // Ordenar jogos: pendentes primeiro, depois finalizados, ambos em ordem alfabética
          filteredGames = filteredGames.sort((a, b) => {
            const aIsPending = !a.winner_id
            const bIsPending = !b.winner_id
            
            // Se um é pendente e outro não, o pendente vem primeiro
            if (aIsPending && !bIsPending) return -1
            if (!aIsPending && bIsPending) return 1
            
            // Se ambos têm o mesmo status, ordenar alfabeticamente pelos nomes dos jogadores/duplas
            const aName = a.is_doubles 
              ? `${a.team1?.name || ''} vs ${a.team2?.name || ''}`
              : `${a.player1?.name || ''} vs ${a.player2?.name || ''}`
            const bName = b.is_doubles 
              ? `${b.team1?.name || ''} vs ${b.team2?.name || ''}`
              : `${b.player1?.name || ''} vs ${b.player2?.name || ''}`
            
            return aName.localeCompare(bName, 'pt-BR', { sensitivity: 'base' })
          })
          
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
                    onDeleteGame={deleteGame}
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
  onDeleteGame: (gameId: number) => void
  loading: boolean
}

function GameCard({ game, onUpdateResult, onUpdateDate, onDeleteGame, loading }: GameCardProps) {
  const [isEditing, setIsEditing] = useState(!game.winner_id)
  const [gameDate, setGameDate] = useState(game.game_date || '')
  const [isWO, setIsWO] = useState(false)
  
  // Estados para os 3 sets
  const [set1Player1, setSet1Player1] = useState(game.set1_player1 || 0)
  const [set1Player2, setSet1Player2] = useState(game.set1_player2 || 0)
  const [set2Player1, setSet2Player1] = useState(game.set2_player1 || 0)
  const [set2Player2, setSet2Player2] = useState(game.set2_player2 || 0)
  const [set3Player1, setSet3Player1] = useState(game.set3_player1 || 0)
  const [set3Player2, setSet3Player2] = useState(game.set3_player2 || 0)

  const handleWO = (winnerSide: 'player1' | 'player2') => {
    if (!confirm(`Confirma WO (Walk Over) para ${winnerSide === 'player1' ? 
      (game.is_doubles ? game.team1?.name : game.player1?.name) : 
      (game.is_doubles ? game.team2?.name : game.player2?.name)}?`)) {
      return
    }

    let winnerId: number | undefined
    
    if (game.is_doubles) {
      winnerId = winnerSide === 'player1' ? game.team1_id : game.team2_id
      if (!game.team1_id || !game.team2_id) {
        alert('Erro: IDs das duplas não encontrados.')
        return
      }
    } else {
      winnerId = winnerSide === 'player1' ? game.player1_id : game.player2_id
      if (!game.player1_id || !game.player2_id) {
        alert('Erro: IDs dos jogadores não encontrados.')
        return
      }
    }

    if (!winnerId) {
      alert('Erro: Não foi possível determinar o vencedor.')
      return
    }

    // Para WO, definir placar como 2-0 em sets (vencedor ganha por WO)
    const sets = {
      set1_player1: winnerSide === 'player1' ? 21 : 0,
      set1_player2: winnerSide === 'player1' ? 0 : 21,
      set2_player1: winnerSide === 'player1' ? 21 : 0,
      set2_player2: winnerSide === 'player1' ? 0 : 21,
      set3_player1: 0,
      set3_player2: 0,
      is_wo: true
    }

    onUpdateResult(game.id, sets, winnerId)
    setIsEditing(false)
    setIsWO(false)
  }

  const handleSubmitResult = () => {
    // Se for WO, não validar sets
    if (isWO) {
      return // WO é tratado pelos botões específicos
    }

    // Verificar se pelo menos um set foi preenchido
    if (set1Player1 === 0 && set1Player2 === 0) {
      alert('Preencha pelo menos o primeiro set ou declare WO')
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
      alert('Deve haver um vencedor (quem ganhou mais sets) ou declare WO')
      return
    }
    
    // Determinar o vencedor com validação
    let winnerId: number | undefined
    
    if (game.is_doubles) {
      // Para jogos de duplas, usar team_id
      winnerId = player1Sets > player2Sets ? game.team1_id : game.team2_id
      
      // Validar se os team_ids existem
      if (!game.team1_id || !game.team2_id) {
        alert('Erro: IDs das duplas não encontrados. Verifique se o jogo foi criado corretamente.')
        return
      }
    } else {
      // Para jogos individuais, usar player_id
      winnerId = player1Sets > player2Sets ? game.player1_id : game.player2_id
      
      // Validar se os player_ids existem
      if (!game.player1_id || !game.player2_id) {
        alert('Erro: IDs dos jogadores não encontrados. Verifique se o jogo foi criado corretamente.')
        return
      }
    }
    
    // Validar se o winnerId foi determinado corretamente
    if (!winnerId) {
      alert('Erro: Não foi possível determinar o vencedor. Verifique os dados do jogo.')
      return
    }
    
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
              {game.is_doubles 
                ? `${game.team1?.name} vs ${game.team2?.name}`
                : `${game.player1?.name} vs ${game.player2?.name}`
              }
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

        {/* Opção de WO */}
        {isEditing && (
          <div className="text-center mb-2">
            <div className="flex gap-1 justify-center">
              <button
                onClick={() => handleWO('player1')}
                disabled={loading}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                🚫 WO {game.is_doubles ? game.team1?.name : game.player1?.name}
              </button>
              <button
                onClick={() => handleWO('player2')}
                disabled={loading}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                🚫 WO {game.is_doubles ? game.team2?.name : game.player2?.name}
              </button>
            </div>
          </div>
        )}
        
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
                      {game.is_doubles ? game.team1?.name : game.player1?.name}
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
                      {game.is_doubles ? game.team2?.name : game.player2?.name}
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
            <button
              onClick={() => onDeleteGame(game.id)}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <span>🗑️</span>
              Excluir
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
          <>
            <button
              onClick={handleEdit}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <span>✏️</span>
              Editar Resultado
            </button>
            <button
              onClick={() => onDeleteGame(game.id)}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <span>🗑️</span>
              Excluir
            </button>
          </>
        )}
      </div>
      
      {/* Mostrar vencedor */}
      {game.winner_id && (
        <div className="mt-4 text-center">
          <p className="text-sm text-green-600 font-medium">
            {game.is_wo ? '🚫 WO - Vencedor' : '🏆 Vencedor'}: {game.is_doubles 
              ? (game.winner_id === game.team1_id ? game.team1?.name : game.team2?.name)
              : (game.winner_id === game.player1_id ? game.player1?.name : game.player2?.name)
            }
          </p>
          {game.is_wo ? (
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Jogo finalizado por Walk Over (WO)
            </p>
          ) : (
            <p className="text-xs text-black">
              Placar total: {game.player1_score || 0} x {game.player2_score || 0}
            </p>
          )}
        </div>
      )}
    </div>
  )
}