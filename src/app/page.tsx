'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PlayerForm from '@/components/PlayerForm'
import PlayerList from '@/components/PlayerList'
import CategoryForm from '@/components/CategoryForm'
import CategoryList from '@/components/CategoryList'
import GamesList from '@/components/GamesList'
import GameSchedule from '@/components/GameSchedule'
import Standings from '@/components/Standings'
import Login from '@/components/Login'
import EliminationTournament from '@/components/EliminationTournament'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('players')
  const [activeSubTab, setActiveSubTab] = useState('games')
  const [players, setPlayers] = useState([])
  const [categories, setCategories] = useState([])
  const [games, setGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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
        team1:teams!team1_id(name),
        team2:teams!team2_id(name),
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('badminton_auth', 'true')
      }
      // Carregar dados após login bem-sucedido
      fetchCategories()
      fetchPlayers()
      fetchGames()
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('badminton_auth')
    }
    setActiveTab('players')
  }

  useEffect(() => {
    // Verificar se já está autenticado no localStorage
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('badminton_auth')
      if (savedAuth === 'true') {
        setIsAuthenticated(true)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Só carregar dados se estiver autenticado
    if (isAuthenticated) {
      fetchCategories()
      fetchPlayers()
      fetchGames()
    }
  }, [isAuthenticated])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏸</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const tabs = [
    { id: 'players', name: 'Jogadores', icon: '👤' },
    { id: 'elimination', name: 'Jogos por eliminação', icon: '🥇' },
    { id: 'games-possibilities', name: 'Jogos por possibilidades', icon: '🎯' },
    { id: 'categories', name: 'Cadastro de categorias', icon: '🏆' }
  ]

  const subTabs = [
    { id: 'games', name: 'Jogos', icon: '🏸' },
    { id: 'schedule', name: 'Agendamentos', icon: '📅' },
    { id: 'standings', name: 'Classificação', icon: '📊' },
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

      {activeTab === 'games-possibilities' && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {subTabs.map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`${
                      activeSubTab === subTab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <span>{subTab.icon}</span>
                    {subTab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Sub Tab Content */}
          {activeSubTab === 'games' && (
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

          {activeSubTab === 'schedule' && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Agendamento de Jogos</h2>
              <GameSchedule 
                games={games}
                categories={categories}
                onGamesUpdated={fetchGames}
              />
            </div>
          )}

          {activeSubTab === 'standings' && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Classificação por Categoria</h2>
              <Standings 
                games={games}
                players={players}
                categories={categories}
              />
            </div>
          )}

          {activeSubTab === 'settings' && (
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
      )}

      {activeTab === 'elimination' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
          <EliminationTournament 
            players={players}
            categories={categories}
            teams={[]}
          />
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
    </div>
  )
}