import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://swrirrtlraudksgoknxh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cmlycnRscmF1ZGtzZ29rbnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDg2NjYsImV4cCI6MjA3MzE4NDY2Nn0.IhVzFXJH51LrRroeChnBgfU9xIgxdA0M3JLL0zbLztQ'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para as tabelas
export interface Player {
  id: number
  name: string
  category_id: number
  created_at: string
  categories?: {
    name: string
  }
}

export interface Category {
  id: number
  name: string
  created_at: string
}

export interface Game {
  id: number
  player1_id: number
  player2_id: number
  category_id: number
  game_date?: string
  player1_score?: number
  player2_score?: number
  winner_id?: number
  created_at: string
  player1?: {
    name: string
  }
  player2?: {
    name: string
  }
  category?: {
    name: string
  }
}