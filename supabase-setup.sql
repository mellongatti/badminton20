-- Script para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de jogadores
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de jogos
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  player2_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  game_date DATE,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_players CHECK (player1_id != player2_id)
);

-- Habilitar RLS (Row Level Security) para permitir acesso público
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público (qualquer pessoa pode ler/escrever)
CREATE POLICY "Allow public access" ON categories FOR ALL USING (true);
CREATE POLICY "Allow public access" ON players FOR ALL USING (true);
CREATE POLICY "Allow public access" ON games FOR ALL USING (true);

-- Inserir algumas categorias de exemplo
INSERT INTO categories (name) VALUES 
  ('Masculino Iniciante'),
  ('Masculino Intermediário'),
  ('Masculino Avançado'),
  ('Feminino Iniciante'),
  ('Feminino Intermediário'),
  ('Feminino Avançado'),
  ('Misto Iniciante'),
  ('Misto Intermediário'),
  ('Misto Avançado')
ON CONFLICT (name) DO NOTHING;