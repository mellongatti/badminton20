-- Script para adicionar suporte a jogos de duplas na tabela games
-- Execute este script no Supabase Dashboard > SQL Editor

-- Adicionar colunas para suporte a duplas
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS team1_id INTEGER REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS team2_id INTEGER REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS is_doubles BOOLEAN DEFAULT FALSE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_games_team1_id ON games(team1_id);
CREATE INDEX IF NOT EXISTS idx_games_team2_id ON games(team2_id);
CREATE INDEX IF NOT EXISTS idx_games_is_doubles ON games(is_doubles);

-- Atualizar jogos existentes para marcar como individuais
UPDATE games SET is_doubles = FALSE WHERE is_doubles IS NULL;

-- Comentários sobre as novas colunas:
-- team1_id: ID da primeira dupla (para jogos de duplas)
-- team2_id: ID da segunda dupla (para jogos de duplas)
-- is_doubles: Flag para identificar se é jogo de duplas (true) ou individual (false)

-- Para jogos individuais: usar player1_id e player2_id, is_doubles = false
-- Para jogos de duplas: usar team1_id e team2_id, is_doubles = true

SELECT 'Script executado com sucesso! Tabela games agora suporta jogos de duplas.' as resultado;