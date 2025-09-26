-- Script para padronizar nomes das fases no banco de dados
-- Execute este script no Supabase Dashboard > SQL Editor

-- Atualizar todas as fases para seguir o padrão: Primeira Fase, Segunda Fase, etc.
UPDATE elimination_phases 
SET phase_name = CASE 
  WHEN phase_number = 1 THEN 'Primeira Fase'
  WHEN phase_number = 2 THEN 'Segunda Fase'
  WHEN phase_number = 3 THEN 'Terceira Fase'
  WHEN phase_number = 4 THEN 'Quarta Fase'
  WHEN phase_number = 5 THEN 'Quinta Fase'
  WHEN phase_number = 6 THEN 'Sexta Fase'
  WHEN phase_number = 7 THEN 'Sétima Fase'
  WHEN phase_number = 8 THEN 'Oitava Fase'
  WHEN phase_number = 9 THEN 'Nona Fase'
  WHEN phase_number = 10 THEN 'Décima Fase'
  ELSE phase_number || 'ª Fase'
END
WHERE phase_name != CASE 
  WHEN phase_number = 1 THEN 'Primeira Fase'
  WHEN phase_number = 2 THEN 'Segunda Fase'
  WHEN phase_number = 3 THEN 'Terceira Fase'
  WHEN phase_number = 4 THEN 'Quarta Fase'
  WHEN phase_number = 5 THEN 'Quinta Fase'
  WHEN phase_number = 6 THEN 'Sexta Fase'
  WHEN phase_number = 7 THEN 'Sétima Fase'
  WHEN phase_number = 8 THEN 'Oitava Fase'
  WHEN phase_number = 9 THEN 'Nona Fase'
  WHEN phase_number = 10 THEN 'Décima Fase'
  ELSE phase_number || 'ª Fase'
END;

-- Verificar todas as fases após a atualização
SELECT 
  id,
  category_id,
  phase_number,
  phase_name,
  total_players,
  is_active
FROM elimination_phases 
ORDER BY category_id, phase_number;

SELECT 'Nomes das fases padronizados com sucesso!' as status;