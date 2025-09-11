'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PlayerForm from '@/components/PlayerForm'
import PlayerList from '@/components/PlayerList'
import CategoryForm from '@/components/CategoryForm'
import CategoryList from '@/components/CategoryList'
import GamesList from '@/components/GamesList'
import Standings from '@/components/Standings'
import Login from '@/components/Login'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Erro ao buscar jogos:', error)
    } else {
      setGames(data || [])
    }
  }

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true)
      // Carregar dados após login bem-sucedido
      fetchCategories()
      fetchPlayers()
      fetchGames()
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setActiveTab('players')
  }

  useEffect(() => {
    // Só carregar dados se estiver autenticado
    if (isAuthenticated) {
      fetchCategories()
      fetchPlayers()
      fetchGames()
    }
  }, [isAuthenticated])

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const tabs = [
    { id: 'players', name: 'Jogadores', icon: '👤' },
    { id: 'games', name: 'Jogos', icon: '🏸' },
    { id: 'standings', name: 'Classificação', icon: '📊' },
    { id: 'categories', name: 'Categorias', icon: '🏆' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' }
  ]

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏸</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Campeonato de Badminton</h1>
            <p className="text-sm text-gray-600">Sistema de Gerenciamento</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>🚪</span>
          Sair
        </button>
      </div>

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
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
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
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Cadastrar Jogador</h2>
            <PlayerForm 
              categories={categories} 
              onPlayerAdded={fetchPlayers}
            />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Lista de Jogadores</h2>
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
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Cadastrar Categoria</h2>
            <CategoryForm onCategoryAdded={fetchCategories} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Lista de Categorias</h2>
            <CategoryList 
              categories={categories}
              onCategoryUpdated={fetchCategories}
            />
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Jogos do Campeonato</h2>
          <GamesList 
            games={games}
            players={players}
            categories={categories}
            onGamesUpdated={fetchGames}
          />
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Classificação por Categoria</h2>
          <Standings 
            games={games}
            players={players}
            categories={categories}
          />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Configurações do Sistema</h2>
          <GamesList 
            games={games}
            players={players}
            categories={categories}
            onGamesUpdated={fetchGames}
            settingsMode={true}
          />
        </div>
      )}
    </div>
  )
}