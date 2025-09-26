-- Script para criar tabela de jogos de eliminação
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de jogos de eliminação
CREATE TABLE IF NOT EXISTS elimination_games (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  player2_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  team1_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  team2_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL DEFAULT 1, -- Fase do torneio (1 = primeira fase, 2 = segunda fase, etc)
  game_date DATE,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id INTEGER, -- Pode referenciar players(id) ou teams(id)
  is_team_game BOOLEAN DEFAULT FALSE, -- Indica se é jogo de duplas
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, eliminated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_players_elimination CHECK (
    (player1_id IS NOT NULL AND player2_id IS NOT NULL AND player1_id != player2_id) OR
    (team1_id IS NOT NULL AND team2_id IS NOT NULL AND team1_id != team2_id)
  ),
  CONSTRAINT valid_game_type CHECK (
    (player1_id IS NOT NULL AND player2_id IS NOT NULL AND team1_id IS NULL AND team2_id IS NULL) OR
    (team1_id IS NOT NULL AND team2_id IS NOT NULL AND player1_id IS NULL AND player2_id IS NULL)
  )
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE elimination_games ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso público
CREATE POLICY "Allow public access" ON elimination_games FOR ALL USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_elimination_games_category ON elimination_games(category_id);
CREATE INDEX IF NOT EXISTS idx_elimination_games_phase ON elimination_games(phase);
CREATE INDEX IF NOT EXISTS idx_elimination_games_status ON elimination_games(status);

-- Criar tabela para controlar fases do torneio
CREATE TABLE IF NOT EXISTS elimination_phases (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  phase_name VARCHAR(100) NOT NULL, -- "Primeira Fase", "Segunda Fase", "Semifinal", "Final"
  total_players INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, phase_number)
);

-- Habilitar RLS para elimination_phases
ALTER TABLE elimination_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON elimination_phases FOR ALL USING (true);

COMMIT;