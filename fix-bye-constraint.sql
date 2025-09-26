-- Script para corrigir a constraint different_players_elimination para suportar jogos BYE
-- Execute este script no Supabase Dashboard > SQL Editor

-- Remover a constraint existente que impede jogos BYE
ALTER TABLE elimination_games DROP CONSTRAINT IF EXISTS different_players_elimination;

-- Criar nova constraint que permite jogos BYE (onde apenas um jogador está presente)
ALTER TABLE elimination_games ADD CONSTRAINT different_players_elimination CHECK (
  -- Para jogos individuais: permite BYE (apenas player1) ou jogo normal (player1 != player2)
  (player1_id IS NOT NULL AND (player2_id IS NULL OR player1_id != player2_id)) OR
  -- Para jogos de duplas: permite BYE (apenas team1) ou jogo normal (team1 != team2)
  (team1_id IS NOT NULL AND (team2_id IS NULL OR team1_id != team2_id))
);

-- Também precisamos atualizar a constraint valid_game_type para permitir jogos BYE
ALTER TABLE elimination_games DROP CONSTRAINT IF EXISTS valid_game_type;

ALTER TABLE elimination_games ADD CONSTRAINT valid_game_type CHECK (
  -- Jogo individual normal: player1 e player2 presentes, sem teams
  (player1_id IS NOT NULL AND player2_id IS NOT NULL AND team1_id IS NULL AND team2_id IS NULL) OR
  -- Jogo individual BYE: apenas player1 presente, sem teams
  (player1_id IS NOT NULL AND player2_id IS NULL AND team1_id IS NULL AND team2_id IS NULL) OR
  -- Jogo de duplas normal: team1 e team2 presentes, sem players individuais
  (team1_id IS NOT NULL AND team2_id IS NOT NULL AND player1_id IS NULL AND player2_id IS NULL) OR
  -- Jogo de duplas BYE: apenas team1 presente, sem players individuais
  (team1_id IS NOT NULL AND team2_id IS NULL AND player1_id IS NULL AND player2_id IS NULL)
);

SELECT 'Constraints atualizadas! Agora suporta jogos BYE para eliminação.' as resultado;