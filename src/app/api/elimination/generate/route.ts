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

    // Buscar todos os participantes da categoria
    let allParticipants: any[] = []
    let isTeamGame = false

    if (gameType === 'individual') {
      // Buscar jogadores da categoria
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .eq('category_id', categoryId)

      if (playersError) throw playersError
      allParticipants = players || []
      isTeamGame = false
    } else {
      // Buscar duplas da categoria
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('category_id', categoryId)

      if (teamsError) throw teamsError
      allParticipants = teams || []
      isTeamGame = true
    }

    if (allParticipants.length < 2) {
      return NextResponse.json(
        { error: `É necessário pelo menos 2 ${isTeamGame ? 'duplas' : 'jogadores'} na categoria` },
        { status: 400 }
      )
    }

    // Verificar jogos já existentes para esta categoria e fase
    const { data: existingGames } = await supabase
      .from('elimination_games')
      .select('*')
      .eq('category_id', categoryId)
      .eq('phase', 1)

    // Criar um Set com as combinações já existentes
    const existingCombinations = new Set()
    if (existingGames && existingGames.length > 0) {
      existingGames.forEach(game => {
        if (game.is_team_game) {
          if (game.team1_id && game.team2_id) {
            existingCombinations.add(`${game.team1_id}-${game.team2_id}`)
            existingCombinations.add(`${game.team2_id}-${game.team1_id}`)
          }
        } else {
          if (game.player1_id && game.player2_id) {
            existingCombinations.add(`${game.player1_id}-${game.player2_id}`)
            existingCombinations.add(`${game.player2_id}-${game.player1_id}`)
          }
        }
      })
    }

    // Verificar se já existem jogos para esta categoria
    if (existingGames && existingGames.length > 0) {
      return NextResponse.json(
        { message: 'Jogos já foram gerados para esta categoria na primeira fase!' },
        { status: 200 }
      )
    }

    // Embaralhar participantes para tornar o chaveamento aleatório
    const shuffledParticipants = [...allParticipants].sort(() => Math.random() - 0.5)
    
    console.log(`🎯 Total de participantes: ${shuffledParticipants.length}`)
    console.log('📋 Participantes embaralhados:', shuffledParticipants.map(p => p.name))
    
    // Função para calcular a próxima potência de 2
    function getNextPowerOfTwo(n: number): number {
      return Math.pow(2, Math.ceil(Math.log2(n)))
    }
    
    // Calcular número de byes necessários
    const nextPowerOfTwo = getNextPowerOfTwo(shuffledParticipants.length)
    const byesNeeded = nextPowerOfTwo - shuffledParticipants.length
    
    console.log(`📊 Análise do torneio:`)
    console.log(`   - Participantes: ${shuffledParticipants.length}`)
    console.log(`   - Próxima potência de 2: ${nextPowerOfTwo}`)
    console.log(`   - Byes necessários: ${byesNeeded}`)
    
    // Separar participantes que receberão bye dos que jogarão na primeira fase
    const participantsWithBye = shuffledParticipants.slice(0, byesNeeded)
    const participantsToPlay = shuffledParticipants.slice(byesNeeded)
    
    console.log(`🎯 Participantes com BYE (${participantsWithBye.length}):`, participantsWithBye.map(p => p.name))
    console.log(`⚽ Participantes que jogarão (${participantsToPlay.length}):`, participantsToPlay.map(p => p.name))
    
    // Gerar jogos de eliminação apenas para participantes que devem jogar na primeira fase
    const newGames = []
    for (let i = 0; i < participantsToPlay.length; i += 2) {
      const participant1 = participantsToPlay[i]
      const participant2 = participantsToPlay[i + 1]
      
      const gameData: any = {
        category_id: categoryId,
        phase: 1,
        is_team_game: isTeamGame,
        status: 'pending'
      }

      if (isTeamGame) {
        gameData.team1_id = participant1.id
        gameData.team2_id = participant2.id
      } else {
        gameData.player1_id = participant1.id
        gameData.player2_id = participant2.id
      }

      newGames.push(gameData)
      console.log(`⚽ Jogo de eliminação criado: ${participant1.name} vs ${participant2.name}`)
    }
    
    console.log(`🎲 Total de jogos de eliminação criados: ${newGames.length}`)

    // Inserir novos jogos no banco
    const { error: insertError } = await supabase
      .from('elimination_games')
      .insert(newGames)

    if (insertError) throw insertError

    // Criar registros de BYE para participantes que avançam automaticamente
    const byeGames = []
    for (const participant of participantsWithBye) {
      const byeGameData: any = {
        category_id: categoryId,
        phase: 1,
        is_team_game: isTeamGame,
        status: 'completed', // BYE é automaticamente "vencido"
        is_bye: true, // Marcar como BYE
        winner_id: participant.id
      }

      if (isTeamGame) {
        byeGameData.team1_id = participant.id
        byeGameData.team2_id = null // Sem oponente
      } else {
        byeGameData.player1_id = participant.id
        byeGameData.player2_id = null // Sem oponente
      }

      byeGames.push(byeGameData)
      console.log(`🎯 BYE criado para: ${participant.name}`)
    }

    // Inserir registros de BYE se houver
    if (byeGames.length > 0) {
      const { error: byeError } = await supabase
        .from('elimination_games')
        .insert(byeGames)

      if (byeError) {
        console.warn('Erro ao criar registros de BYE:', byeError)
      } else {
        console.log(`🎯 ${byeGames.length} registros de BYE criados com sucesso`)
      }
    }

    // Verificar se já existe uma fase para esta categoria
    const { data: existingPhase } = await supabase
      .from('elimination_phases')
      .select('*')
      .eq('category_id', categoryId)
      .eq('phase_number', 1)
      .single()

    if (!existingPhase) {
      // Criar registro da fase se não existir
      const phaseData = {
        category_id: categoryId,
        phase_number: 1,
        phase_name: 'Primeira Fase',
        total_players: shuffledParticipants.length,
        is_active: true
      }

      const { error: phaseError } = await supabase
        .from('elimination_phases')
        .insert(phaseData)

      if (phaseError) {
        console.warn('Erro ao criar fase:', phaseError)
      }
    }

    return NextResponse.json(
      { 
        message: `Torneio de eliminação criado! ${newGames.length} jogos gerados e ${byeGames.length} byes distribuídos para ${shuffledParticipants.length} participantes.`,
        gamesCreated: newGames.length,
        byesCreated: byeGames.length,
        totalParticipants: shuffledParticipants.length,
        participantsWithBye: participantsWithBye.map(p => p.name),
        phase: 1,
        description: 'Cada participante joga apenas uma vez. Vencedores avançam para a próxima fase.'
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