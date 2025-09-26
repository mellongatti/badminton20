-- Script para adicionar suporte ao sistema BYE na tabela elimination_games
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna is_bye se não existir
ALTER TABLE elimination_games 
ADD COLUMN IF NOT EXISTS is_bye BOOLEAN DEFAULT FALSE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_elimination_games_is_bye ON elimination_games(is_bye);

-- Comentário sobre a nova coluna
COMMENT ON COLUMN elimination_games.is_bye IS 'Indica se o jogo é um BYE (participante avança automaticamente)';

-- Atualizar jogos existentes para definir is_bye como false por padrão
UPDATE elimination_games SET is_bye = FALSE WHERE is_bye IS NULL;

SELECT 'Coluna is_bye adicionada com sucesso à tabela elimination_games!' as status;