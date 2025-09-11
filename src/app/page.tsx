'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PlayerForm from '@/components/PlayerForm'
import PlayerList from '@/components/PlayerList'
import CategoryForm from '@/components/CategoryForm'
import CategoryList from '@/components/CategoryList'
import GamesList from '@/components/GamesList'
import Standings from '@/components/Standings'

export default function Home() {
  const [activeTab, setActiveTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [categories, setCategories] = useState([])
  const [games, setGames] = useState([])

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*, categories(name)')
    if (error) {
      console.error('Erro ao buscar jogadores:', error)
    } else {
      setPlayers(data || [])
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
    if (error) {
      console.error('Erro ao buscar categorias:', error)
    } else {
      setCategories(data || [])
    }
  }

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        player1:players!games_player1_id_fkey(name),
        player2:players!games_player2_id_fkey(name),
        category:categories(name)
      `)
    if (error) {
      console.error('Erro ao buscar jogos:', error)
    } else {
      setGames(data || [])
    }
  }

  useEffect(() => {
    fetchPlayers()
    fetchCategories()
    fetchGames()
  }, [])

  const tabs = [
    { id: 'players', name: 'Jogadores', icon: '👤' },
    { id: 'categories', name: 'Categorias', icon: '🏆' },
    { id: 'games', name: 'Jogos', icon: '🏸' },
    { id: 'standings', name: 'Classificação', icon: '📊' }
  ]

  return (
    <div className="px-4 py-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cadastrar Jogador</h2>
            <PlayerForm 
              categories={categories} 
              onPlayerAdded={fetchPlayers}
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Lista de Jogadores</h2>
            <PlayerList 
              players={players} 
              categories={categories}
              onPlayerUpdated={fetchPlayers}
            />
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cadastrar Categoria</h2>
            <CategoryForm onCategoryAdded={fetchCategories} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Lista de Categorias</h2>
            <CategoryList 
              categories={categories}
              onCategoryUpdated={fetchCategories}
            />
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Jogos do Campeonato</h2>
          <GamesList 
            games={games}
            players={players}
            categories={categories}
            onGamesUpdated={fetchGames}
          />
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Classificação por Categoria</h2>
          <Standings 
            games={games}
            players={players}
            categories={categories}
          />
        </div>
      )}
    </div>
  )
}