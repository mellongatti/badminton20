-- Script para atualizar a tabela elimination_games para suportar 3 sets e WO
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas para os 3 sets
ALTER TABLE elimination_games 
ADD COLUMN IF NOT EXISTS set1_player1 INTEGER,
ADD COLUMN IF NOT EXISTS set1_player2 INTEGER,
ADD COLUMN IF NOT EXISTS set2_player1 INTEGER,
ADD COLUMN IF NOT EXISTS set2_player2 INTEGER,
ADD COLUMN IF NOT EXISTS set3_player1 INTEGER,
ADD COLUMN IF NOT EXISTS set3_player2 INTEGER;

-- Adicionar coluna para Walk Over (WO)
ALTER TABLE elimination_games 
ADD COLUMN IF NOT EXISTS is_wo BOOLEAN DEFAULT FALSE;

-- Comentários sobre as colunas
COMMENT ON COLUMN elimination_games.set1_player1 IS 'Pontuação do jogador/time 1 no set 1';
COMMENT ON COLUMN elimination_games.set1_player2 IS 'Pontuação do jogador/time 2 no set 1';
COMMENT ON COLUMN elimination_games.set2_player1 IS 'Pontuação do jogador/time 1 no set 2';
COMMENT ON COLUMN elimination_games.set2_player2 IS 'Pontuação do jogador/time 2 no set 2';
COMMENT ON COLUMN elimination_games.set3_player1 IS 'Pontuação do jogador/time 1 no set 3';
COMMENT ON COLUMN elimination_games.set3_player2 IS 'Pontuação do jogador/time 2 no set 3';
COMMENT ON COLUMN elimination_games.is_wo IS 'Indica se o jogo terminou por Walk Over (WO)';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_elimination_games_is_wo ON elimination_games(is_wo);

-- Atualizar jogos existentes para definir is_wo como false por padrão
UPDATE elimination_games SET is_wo = FALSE WHERE is_wo IS NULL;

SELECT 'Tabela elimination_games atualizada com sucesso para suportar 3 sets e WO!' as status;