import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { categoryId, currentPhase: selectedPhase } = await request.json()

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    if (!selectedPhase) {
      return NextResponse.json(
        { error: 'Current phase is required' },
        { status: 400 }
      )
    }

    // Buscar todas as fases da categoria
    const { data: phases, error: phasesError } = await supabase
      .from('elimination_phases')
      .select('*')
      .eq('category_id', categoryId)
      .order('phase_number', { ascending: true })

    if (phasesError) throw phasesError

    if (!phases || phases.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma fase encontrada para esta categoria' },
        { status: 400 }
      )
    }

    // Encontrar a fase selecionada pelo usuário
    let currentPhase = phases.find(phase => phase.phase_number === selectedPhase)
    
    if (!currentPhase) {
      return NextResponse.json(
        { error: `Fase ${selectedPhase} não encontrada para esta categoria` },
        { status: 400 }
      )
    }

    // Buscar todos os jogos da fase atual
    const { data: currentPhaseGames, error: gamesError } = await supabase
      .from('elimination_games')
      .select(`
        *,
        player1:players!elimination_games_player1_id_fkey(name),
        player2:players!elimination_games_player2_id_fkey(name),
        team1:teams!elimination_games_team1_id_fkey(name),
        team2:teams!elimination_games_team2_id_fkey(name)
      `)
      .eq('category_id', categoryId)
      .eq('phase', currentPhase.phase_number)

    if (gamesError) throw gamesError

    if (!currentPhaseGames || currentPhaseGames.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum jogo encontrado na fase atual' },
        { status: 400 }
      )
    }

    // Verificar quantos jogos estão finalizados
    const finishedGames = currentPhaseGames.filter(game => 
      game.status === 'completed' && game.winner_id
    )
    const unfinishedGames = currentPhaseGames.filter(game => 
      game.status !== 'completed' || !game.winner_id
    )

    // Se não há jogos finalizados, não há nada para avançar
    if (finishedGames.length === 0) {
      return NextResponse.json(
        { 
          error: `Nenhum jogo finalizado na ${currentPhase.phase_name}`,
          finishedGames: 0,
          totalGames: currentPhaseGames.length
        },
        { status: 400 }
      )
    }

    // Coletar vencedores dos jogos finalizados (incluindo BYEs)
    const winners = []
    for (const game of finishedGames) {
      if (game.winner_id) {
        if (game.is_team_game) {
          const winner = game.winner_id === game.team1_id ? game.team1 : game.team2
          if (winner) {
            winners.push({
              id: game.winner_id,
              name: winner.name,
              isTeam: true,
              isBye: game.is_bye || false
            })
          }
        } else {
          const winner = game.winner_id === game.player1_id ? game.player1 : game.player2
          if (winner) {
            winners.push({
              id: game.winner_id,
              name: winner.name,
              isTeam: false,
              isBye: game.is_bye || false
            })
          }
        }
      }
    }

    // Verificar se todos os jogos da fase atual estão finalizados
    const allGamesFinished = unfinishedGames.length === 0

    console.log(`📊 Status da fase ${currentPhase.phase_name}:`)
    console.log(`   - Total de jogos: ${currentPhaseGames.length}`)
    console.log(`   - Jogos finalizados: ${finishedGames.length}`)
    console.log(`   - Jogos não finalizados: ${unfinishedGames.length}`)
    console.log(`   - Todos jogos finalizados: ${allGamesFinished}`)
    console.log(`🏆 Vencedores da ${currentPhase.phase_name}:`, winners.map(w => w.name))

    // Se todos os jogos estão finalizados e há apenas 1 vencedor, ele é o campeão
    if (allGamesFinished && winners.length === 1) {
      // Desativar a fase atual
      await supabase
        .from('elimination_phases')
        .update({ is_active: false })
        .eq('id', currentPhase.id)

      return NextResponse.json(
        { 
          message: `🏆 Torneio finalizado! Campeão: ${winners[0].name}`,
          champion: winners[0],
          tournamentComplete: true
        },
        { status: 200 }
      )
    }

    // Se há 0 vencedores, algo está errado
    if (winners.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum vencedor encontrado nos jogos finalizados' },
        { status: 400 }
      )
    }

    // Para modelo de chave de torneio, vencedores devem avançar imediatamente
    console.log(`🚀 Processando ${winners.length} vencedor(es) para próxima fase`)

    // Verificar se a próxima fase já existe
    const nextPhaseNumber = currentPhase.phase_number + 1
    const { data: existingNextPhase } = await supabase
      .from('elimination_phases')
      .select('*')
      .eq('category_id', categoryId)
      .eq('phase_number', nextPhaseNumber)
      .single()

    let nextPhase
    if (existingNextPhase) {
      nextPhase = existingNextPhase
    } else {
      // Criar nova fase apenas se não existir
      const nextPhaseName = getNextPhaseName(nextPhaseNumber, winners.length)
      const { data: newPhase, error: phaseError } = await supabase
        .from('elimination_phases')
        .insert({
          category_id: categoryId,
          phase_number: nextPhaseNumber,
          phase_name: nextPhaseName,
          total_players: winners.length,
          is_active: false
        })
        .select()
        .single()

      if (phaseError) throw phaseError
      nextPhase = newPhase
    }

    // Verificar se já existem jogos na próxima fase
    const { data: existingNextPhaseGames } = await supabase
      .from('elimination_games')
      .select('*')
      .eq('category_id', categoryId)
      .eq('phase', nextPhaseNumber)

    // Coletar vencedores que ainda não foram usados na próxima fase
    const usedWinnerIds = new Set()
    if (existingNextPhaseGames) {
      existingNextPhaseGames.forEach(game => {
        if (game.is_team_game) {
          if (game.team1_id) usedWinnerIds.add(game.team1_id)
          if (game.team2_id) usedWinnerIds.add(game.team2_id)
        } else {
          if (game.player1_id) usedWinnerIds.add(game.player1_id)
          if (game.player2_id) usedWinnerIds.add(game.player2_id)
        }
      })
    }

    // Filtrar vencedores que ainda não foram usados
    const availableWinners = winners.filter(winner => !usedWinnerIds.has(winner.id))
    
    console.log(`🔍 Análise de vencedores:`)
    console.log(`   - Total de vencedores: ${winners.length}`)
    console.log(`   - IDs já usados: [${Array.from(usedWinnerIds).join(', ')}]`)
    console.log(`   - Vencedores disponíveis: ${availableWinners.length}`)
    console.log(`   - Nomes disponíveis: [${availableWinners.map(w => w.name).join(', ')}]`)
    
    if (availableWinners.length < 1) {
      console.log(`❌ Nenhum vencedor disponível para criar jogos`)
      return NextResponse.json(
        { 
          message: `Nenhum vencedor disponível ainda`,
          processedWinners: winners.length - availableWinners.length,
          availableWinners: availableWinners.length
        },
        { status: 200 }
      )
    }
    
    // Sempre processar vencedores disponíveis, mesmo que seja apenas 1
    console.log(`⚡ Processando ${availableWinners.length} vencedor(es) para próxima fase`)
    
    // Ativar próxima fase sempre que há vencedores
    await supabase
      .from('elimination_phases')
      .update({ is_active: true })
      .eq('id', nextPhase.id)
    
    // Se há apenas 1 vencedor disponível, criar um jogo BYE para ele
    if (availableWinners.length === 1) {
      const winner = availableWinners[0]
      console.log(`🎯 Criando jogo BYE para ${winner.name} - avança automaticamente`)
      
      const byeGameData: any = {
        category_id: categoryId,
        phase: nextPhaseNumber,
        is_team_game: winner.isTeam,
        status: 'completed',
        is_bye: true,
        winner_id: winner.id
      }

      if (winner.isTeam) {
        byeGameData.team1_id = winner.id
      } else {
        byeGameData.player1_id = winner.id
      }

      const { error: insertError } = await supabase
        .from('elimination_games')
        .insert([byeGameData])

      if (insertError) throw insertError
      
      return NextResponse.json(
        { 
          message: `${winner.name} avançou para a ${nextPhase.phase_name} com BYE`,
          currentPhase: currentPhase.phase_name,
          nextPhase: nextPhase.phase_name,
          waitingPlayer: winner.name,
          gamesCreated: 1,
          playersAdvanced: 1
        },
        { status: 200 }
      )
    }

    // Embaralhar vencedores disponíveis para próxima fase
    const shuffledWinners = [...availableWinners].sort(() => Math.random() - 0.5)
    
    // Criar jogos da próxima fase com os vencedores disponíveis
    const nextPhaseGames = []
    for (let i = 0; i < shuffledWinners.length; i += 2) {
      if (i + 1 < shuffledWinners.length) {
        const gameData: any = {
          category_id: categoryId,
          phase: nextPhaseNumber,
          is_team_game: shuffledWinners[i].isTeam,
          status: 'pending'
        }

        if (shuffledWinners[i].isTeam) {
          gameData.team1_id = shuffledWinners[i].id
          gameData.team2_id = shuffledWinners[i + 1].id
        } else {
          gameData.player1_id = shuffledWinners[i].id
          gameData.player2_id = shuffledWinners[i + 1].id
        }

        nextPhaseGames.push(gameData)
        console.log(`⚽ Novo jogo criado: ${shuffledWinners[i].name} vs ${shuffledWinners[i + 1].name}`)
      } else {
        // Se há número ímpar de vencedores disponíveis, criar um jogo BYE para o último
        const gameData: any = {
          category_id: categoryId,
          phase: nextPhaseNumber,
          is_team_game: shuffledWinners[i].isTeam,
          status: 'completed',
          is_bye: true
        }

        if (shuffledWinners[i].isTeam) {
          gameData.team1_id = shuffledWinners[i].id
          gameData.winner_id = shuffledWinners[i].id
        } else {
          gameData.player1_id = shuffledWinners[i].id
          gameData.winner_id = shuffledWinners[i].id
        }

        nextPhaseGames.push(gameData)
        console.log(`🎯 Jogo BYE criado para ${shuffledWinners[i].name} - avança automaticamente`)
      }
    }

    // Inserir novos jogos da próxima fase
    let gamesCreated = 0
    if (nextPhaseGames.length > 0) {
      const { error: insertError } = await supabase
        .from('elimination_games')
        .insert(nextPhaseGames)

      if (insertError) throw insertError
      gamesCreated = nextPhaseGames.length
    }

    console.log(`✅ Fase ${nextPhase.phase_name} ativada com ${availableWinners.length} vencedor(es)`)

    // Se todos os jogos da fase atual estão finalizados, desativar a fase atual
    if (allGamesFinished) {
      await supabase
        .from('elimination_phases')
        .update({ is_active: false })
        .eq('id', currentPhase.id)
    }

    // Verificar se há apenas 1 vencedor E todos os jogos estão finalizados (campeão)
    if (allGamesFinished && availableWinners.length === 1 && gamesCreated === 0) {
      return NextResponse.json(
        { 
          message: `🏆 Torneio finalizado! Campeão: ${availableWinners[0].name}`,
          champion: availableWinners[0],
          tournamentComplete: true,
          totalGamesCreated: gamesCreated
        },
        { status: 200 }
      )
    }

    const message = gamesCreated > 0 
      ? `✅ ${gamesCreated} jogo(s) criado(s) para a fase ${nextPhase.phase_name}! Cadastre os resultados para continuar.`
      : `⏳ Aguardando mais vencedores para criar novos jogos`

    return NextResponse.json(
      { 
        message,
        currentPhase: currentPhase.phase_name,
        nextPhase: nextPhase.phase_name,
        totalWinners: winners.length,
        gamesCreated,
        allCurrentPhaseFinished: allGamesFinished,
        advancedPlayers: availableWinners.slice(0, gamesCreated * 2).map(w => w.name)
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Erro ao avançar para próxima fase:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getNextPhaseName(phaseNumber: number, playersCount: number): string {
  if (playersCount <= 2) {
    return 'Final'
  } else if (playersCount <= 4) {
    return 'Semifinal'
  } else if (playersCount <= 8) {
    return 'Quartas de Final'
  } else if (playersCount <= 16) {
    return 'Oitavas de Final'
  } else {
    return `Fase ${phaseNumber}`
  }
}