-- Script para adicionar suporte a WO (Walk Over) na tabela games
-- Execute este script no Supabase Dashboard > SQL Editor

-- Adicionar coluna is_wo se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'games' AND column_name = 'is_wo') THEN
        ALTER TABLE games ADD COLUMN is_wo BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Atualizar jogos existentes para definir is_wo como false por padrão
UPDATE games SET is_wo = FALSE WHERE is_wo IS NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_games_is_wo ON games(is_wo);

-- Comentário da coluna
COMMENT ON COLUMN games.is_wo IS 'Indica se o jogo terminou por Walk Over (WO)';

SELECT 'Suporte a WO adicionado com sucesso!' as status;