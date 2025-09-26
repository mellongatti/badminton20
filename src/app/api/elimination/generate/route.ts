import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { categoryId, gameType } = await request.json()

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Verificar se já existem jogos para esta categoria
    const { data: existingGames } = await supabase
      .from('elimination_games')
      .select('*')
      .eq('category_id', categoryId)
      .eq('phase', 1)

    let existingParticipantIds: number[] = []
    if (existingGames && existingGames.length > 0) {
      // Extrair IDs dos participantes que já jogaram
      existingGames.forEach(game => {
        if (game.is_team_game) {
          if (game.team1_id) existingParticipantIds.push(game.team1_id)
          if (game.team2_id) existingParticipantIds.push(game.team2_id)
        } else {
          if (game.player1_id) existingParticipantIds.push(game.player1_id)
          if (game.player2_id) existingParticipantIds.push(game.player2_id)
        }
      })
    }

    let participants: any[] = []
    let isTeamGame = false

    if (gameType === 'individual') {
      // Buscar jogadores da categoria
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .eq('category_id', categoryId)

      if (playersError) throw playersError
      // Filtrar apenas jogadores que ainda não jogaram
      participants = (players || []).filter(player => !existingParticipantIds.includes(player.id))
      isTeamGame = false
    } else {
      // Buscar duplas da categoria
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('category_id', categoryId)

      if (teamsError) throw teamsError
      // Filtrar apenas duplas que ainda não jogaram
      participants = (teams || []).filter(team => !existingParticipantIds.includes(team.id))
      isTeamGame = true
    }

    if (participants.length === 0) {
      if (existingParticipantIds.length > 0) {
        return NextResponse.json(
          { message: 'Todos os participantes já foram incluídos nos jogos da primeira fase' },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          { error: `É necessário pelo menos 2 ${isTeamGame ? 'duplas' : 'jogadores'} na categoria` },
          { status: 400 }
        )
      }
    }

    if (participants.length === 1 && existingParticipantIds.length === 0) {
      return NextResponse.json(
        { error: `É necessário pelo menos 2 ${isTeamGame ? 'duplas' : 'jogadores'} na categoria` },
        { status: 400 }
      )
    }

    // Embaralhar participantes para torneio aleatório
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)
    
    // Gerar jogos da primeira fase
    const games = []
    const totalParticipants = shuffledParticipants.length
    
    console.log(`🎯 Total de participantes: ${totalParticipants}`)
    console.log('📋 Participantes:', shuffledParticipants.map(p => p.name))
    
    // Para torneio eliminatório simples - emparelhar novos participantes
    if (participants.length === 1) {
      // Se há apenas 1 novo participante, ele passa direto para a próxima fase
      console.log(`🎪 ${shuffledParticipants[0].name} passa direto para a próxima fase (bye) - novo participante`)
    } else {
      // Emparelhar participantes sequencialmente
      for (let i = 0; i < shuffledParticipants.length; i += 2) {
        if (i + 1 < shuffledParticipants.length) {
          const gameData: any = {
            category_id: categoryId,
            phase: 1,
            is_team_game: isTeamGame,
            status: 'pending'
          }

          if (isTeamGame) {
            gameData.team1_id = shuffledParticipants[i].id
            gameData.team2_id = shuffledParticipants[i + 1].id
          } else {
            gameData.player1_id = shuffledParticipants[i].id
            gameData.player2_id = shuffledParticipants[i + 1].id
          }

          games.push(gameData)
          console.log(`⚽ Jogo criado: ${shuffledParticipants[i].name} vs ${shuffledParticipants[i + 1].name}`)
        } else {
          // Se há número ímpar de participantes, o último passa direto para a próxima fase
          console.log(`🎪 ${shuffledParticipants[i].name} passa direto para a próxima fase (bye)`)
        }
      }
    }
    
    console.log(`🎲 Total de jogos criados: ${games.length}`)

    // Inserir jogos no banco
    const { error: insertError } = await supabase
      .from('elimination_games')
      .insert(games)

    if (insertError) throw insertError

    // Criar registro da fase apenas se não existir
    if (existingParticipantIds.length === 0) {
      const phaseData = {
        category_id: categoryId,
        phase_number: 1,
        phase_name: 'Primeira Fase',
        total_players: totalParticipants,
        is_active: true
      }

      const { error: phaseError } = await supabase
        .from('elimination_phases')
        .insert(phaseData)

      if (phaseError) {
        console.warn('Erro ao criar fase (pode já existir):', phaseError)
      }
    } else {
      // Atualizar o total de jogadores na fase existente
      const { error: updateError } = await supabase
        .from('elimination_phases')
        .update({ total_players: totalParticipants + existingParticipantIds.length })
        .eq('category_id', categoryId)
        .eq('phase_number', 1)

      if (updateError) {
        console.warn('Erro ao atualizar total de jogadores na fase:', updateError)
      }
    }

    const message = existingParticipantIds.length > 0 
      ? `${games.length} novos jogos adicionados com sucesso para os novos participantes`
      : 'Jogos gerados com sucesso'

    return NextResponse.json(
      { 
        message,
        gamesCreated: games.length,
        newParticipants: totalParticipants,
        existingParticipants: existingParticipantIds.length
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Erro ao gerar jogos de eliminação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}