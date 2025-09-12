-- Script para corrigir a restrição de chave estrangeira do winner_id
-- Execute este script no Supabase Dashboard > SQL Editor

-- Primeiro, remover a restrição existente de winner_id
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_winner_id_fkey;

-- Agora o winner_id pode ser tanto um player_id quanto um team_id
-- Não vamos adicionar uma nova restrição de chave estrangeira específica
-- pois o winner_id pode referenciar duas tabelas diferentes dependendo do tipo de jogo

-- Para validação, vamos criar uma função que verifica se o winner_id é válido
CREATE OR REPLACE FUNCTION validate_winner_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é jogo de duplas, verificar se winner_id existe na tabela teams
  IF NEW.is_doubles = true THEN
    IF NEW.winner_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM teams WHERE id = NEW.winner_id
    ) THEN
      RAISE EXCEPTION 'winner_id deve referenciar um team_id válido para jogos de duplas';
    END IF;
  -- Se é jogo individual, verificar se winner_id existe na tabela players
  ELSE
    IF NEW.winner_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM players WHERE id = NEW.winner_id
    ) THEN
      RAISE EXCEPTION 'winner_id deve referenciar um player_id válido para jogos individuais';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar winner_id antes de inserir/atualizar
DROP TRIGGER IF EXISTS validate_winner_trigger ON games;
CREATE TRIGGER validate_winner_trigger
  BEFORE INSERT OR UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION validate_winner_id();

SELECT 'Restrição de winner_id corrigida! Agora suporta tanto jogos individuais quanto de duplas.' as resultado;