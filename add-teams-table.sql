-- Script para adicionar tabela de duplas (teams) ao banco de dados
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de duplas/equipes
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  player1_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  player2_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_players_in_team CHECK (player1_id != player2_id),
  CONSTRAINT unique_team_players UNIQUE (player1_id, player2_id)
);

-- Habilitar RLS (Row Level Security) para permitir acesso público
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso público
CREATE POLICY "Allow public access" ON teams FOR ALL USING (true);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_teams_player1 ON teams(player1_id);
CREATE INDEX IF NOT EXISTS idx_teams_player2 ON teams(player2_id);
CREATE INDEX IF NOT EXISTS idx_teams_category ON teams(category_id);

-- Modificar tabela de jogos para suportar duplas (opcional)
-- Adicionar colunas para identificar se é jogo individual ou de duplas
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_doubles BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS team1_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS team2_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;

-- Adicionar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_games_team1 ON games(team1_id);
CREATE INDEX IF NOT EXISTS idx_games_team2 ON games(team2_id);