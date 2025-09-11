-- Script para atualizar a tabela games para suportar 3 sets
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas para os 3 sets
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS set1_player1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS set1_player2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS set2_player1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS set2_player2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS set3_player1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS set3_player2 INTEGER DEFAULT 0;

-- Adicionar coluna para indicar se o jogo pode ser editado
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;

-- Comentários sobre as colunas
COMMENT ON COLUMN games.set1_player1 IS 'Pontuação do jogador 1 no set 1';
COMMENT ON COLUMN games.set1_player2 IS 'Pontuação do jogador 2 no set 1';
COMMENT ON COLUMN games.set2_player1 IS 'Pontuação do jogador 1 no set 2';
COMMENT ON COLUMN games.set2_player2 IS 'Pontuação do jogador 2 no set 2';
COMMENT ON COLUMN games.set3_player1 IS 'Pontuação do jogador 1 no set 3';
COMMENT ON COLUMN games.set3_player2 IS 'Pontuação do jogador 2 no set 3';
COMMENT ON COLUMN games.is_editable IS 'Indica se o jogo pode ser editado após salvar';

-- Manter as colunas antigas para compatibilidade (player1_score e player2_score)
-- Elas podem ser usadas para mostrar o placar total ou removidas futuramente