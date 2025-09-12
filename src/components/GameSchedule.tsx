'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Game {
  id: number
  player1_id?: number
  player2_id?: number
  team1_id?: number
  team2_id?: number
  category_id: number
  game_date?: string
  is_doubles?: boolean
  player1?: { name: string }
  player2?: { name: string }
  team1?: { name: string }
  team2?: { name: string }
  category?: { name: string }
}

interface Category {
  id: number
  name: string
}

interface GameScheduleProps {
  games: Game[]
  categories: Category[]
  onGamesUpdated: () => void
}

export default function GameSchedule({ games, categories, onGamesUpdated }: GameScheduleProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'scheduled' | 'unscheduled'>('scheduled')
  
  // Estados para filtros da seção de jogos agendados
  const [scheduledCategory, setScheduledCategory] = useState<number | 'all'>('all')
  const [scheduledDateFilter, setScheduledDateFilter] = useState('')
  const [scheduledNameFilter, setScheduledNameFilter] = useState('')
  const [scheduledTypeFilter, setScheduledTypeFilter] = useState<'all' | 'singles' | 'doubles'>('all')
  
  // Estados para filtros da seção de agendar jogos
  const [unscheduledDateFilter, setUnscheduledDateFilter] = useState('')
  const [unscheduledNameFilter, setUnscheduledNameFilter] = useState('')
  const [unscheduledTypeFilter, setUnscheduledTypeFilter] = useState<'all' | 'singles' | 'doubles'>('all')

  // Filtrar jogos por categoria selecionada e apenas jogos não agendados
  const filteredGames = games
    .filter(game => !game.game_date) // Apenas jogos sem data agendada
    .filter(game => selectedCategory === 'all' || game.category_id === selectedCategory)
    .filter(game => {
      if (!unscheduledNameFilter) return true
      const searchTerm = unscheduledNameFilter.toLowerCase()
      if (game.is_doubles) {
        return (game.team1?.name || '').toLowerCase().includes(searchTerm) ||
               (game.team2?.name || '').toLowerCase().includes(searchTerm)
      } else {
        return (game.player1?.name || '').toLowerCase().includes(searchTerm) ||
               (game.player2?.name || '').toLowerCase().includes(searchTerm)
      }
    })
    .filter(game => {
      if (unscheduledTypeFilter === 'all') return true
      if (unscheduledTypeFilter === 'singles') return !game.is_doubles
      if (unscheduledTypeFilter === 'doubles') return game.is_doubles
      return true
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente pelos nomes dos jogadores/duplas
      const aName = a.is_doubles 
        ? `${a.team1?.name || ''} vs ${a.team2?.name || ''}`
        : `${a.player1?.name || ''} vs ${a.player2?.name || ''}`
      const bName = b.is_doubles 
        ? `${b.team1?.name || ''} vs ${b.team2?.name || ''}`
        : `${b.player1?.name || ''} vs ${b.player2?.name || ''}`
      
      return aName.localeCompare(bName, 'pt-BR', { sensitivity: 'base' })
    })
    
  // Filtrar jogos agendados com todos os filtros
  const scheduledGames = games
    .filter(game => game.game_date) // Apenas jogos com data agendada
    .filter(game => scheduledCategory === 'all' || game.category_id === scheduledCategory)
    .filter(game => {
      if (!scheduledDateFilter) return true
      const gameDate = game.game_date?.split('T')[0]
      return gameDate === scheduledDateFilter
    })
    .filter(game => {
      if (!scheduledNameFilter) return true
      const searchTerm = scheduledNameFilter.toLowerCase()
      if (game.is_doubles) {
        return (game.team1?.name || '').toLowerCase().includes(searchTerm) ||
               (game.team2?.name || '').toLowerCase().includes(searchTerm)
      } else {
        return (game.player1?.name || '').toLowerCase().includes(searchTerm) ||
               (game.player2?.name || '').toLowerCase().includes(searchTerm)
      }
    })
    .filter(game => {
      if (scheduledTypeFilter === 'all') return true
      if (scheduledTypeFilter === 'singles') return !game.is_doubles
      if (scheduledTypeFilter === 'doubles') return game.is_doubles
      return true
    })
    .sort((a, b) => {
      // Ordenar alfabeticamente pelos nomes dos jogadores/duplas
      const aName = a.is_doubles 
        ? `${a.team1?.name || ''} vs ${a.team2?.name || ''}`
        : `${a.player1?.name || ''} vs ${a.player2?.name || ''}`
      const bName = b.is_doubles 
        ? `${b.team1?.name || ''} vs ${b.team2?.name || ''}`
        : `${b.player1?.name || ''} vs ${b.player2?.name || ''}`
      
      return aName.localeCompare(bName, 'pt-BR', { sensitivity: 'base' })
    })

  const handleDateChange = async (gameId: number, newDate: string) => {
    setLoading(true)
    try {
      // Adicionar horário para evitar problemas de fuso horário
      const dateWithTime = newDate + 'T12:00:00'
      
      const { error } = await supabase
        .from('games')
        .update({ game_date: dateWithTime })
        .eq('id', gameId)

      if (error) {
        console.error('Erro ao atualizar data do jogo:', error)
        alert('Erro ao atualizar data do jogo')
      } else {
        onGamesUpdated()
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar data do jogo')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    // Extrair apenas a parte da data para evitar problemas de fuso horário
    return dateString.split('T')[0]
  }

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'Não agendado'
    // Criar data sem conversão de fuso horário
    const [year, month, day] = dateString.split('T')[0].split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Navegação por Abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scheduled'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📅 Jogos Agendados ({scheduledGames.length})
          </button>
          <button
            onClick={() => setActiveTab('unscheduled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'unscheduled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⏰ Para Agendar ({filteredGames.length})
          </button>
        </nav>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'scheduled' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
          📅 Jogos Agendados
        </h2>
        
        {/* Filtros para jogos agendados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           <div>
             <label className="block text-sm font-medium text-black mb-1">Categoria:</label>
             <select
               value={scheduledCategory}
               onChange={(e) => setScheduledCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
             >
               <option value="all">Todas</option>
               {categories.map(category => (
                 <option key={category.id} value={category.id}>
                   {category.name}
                 </option>
               ))}
             </select>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-black mb-1">Data:</label>
             <input
               type="date"
               value={scheduledDateFilter}
               onChange={(e) => setScheduledDateFilter(e.target.value)}
               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-black mb-1">Nome:</label>
             <input
               type="text"
               placeholder="Buscar jogador/dupla..."
               value={scheduledNameFilter}
               onChange={(e) => setScheduledNameFilter(e.target.value)}
               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-black mb-1">Tipo:</label>
             <select
               value={scheduledTypeFilter}
               onChange={(e) => setScheduledTypeFilter(e.target.value as 'all' | 'singles' | 'doubles')}
               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
             >
               <option value="all">Todos</option>
               <option value="singles">Simples</option>
               <option value="doubles">Duplas</option>
             </select>
           </div>
         </div>
        
        {/* Lista de jogos agendados */}
        <div className="space-y-2">
          {scheduledGames.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum jogo agendado encontrado.</p>
          ) : (
            scheduledGames.map(game => (
              <div key={game.id} className="bg-white border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  {/* Informações do jogo */}
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-medium text-green-600 min-w-[100px]">
                      {game.category?.name}
                    </span>
                    <span className="text-sm text-gray-700 flex-1">
                      {game.is_doubles 
                        ? `${game.team1?.name || 'Dupla 1'} vs ${game.team2?.name || 'Dupla 2'}`
                        : `${game.player1?.name || 'Jogador 1'} vs ${game.player2?.name || 'Jogador 2'}`
                      }
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {game.is_doubles ? '👥 Duplas' : '👤 Simples'}
                    </span>
                  </div>

                  {/* Data agendada */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700">
                      {formatDisplayDate(game.game_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Resumo dos jogos agendados */}
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">
              Total agendados: <strong>{scheduledGames.length}</strong>
            </span>
            <span className="text-green-800">
              Simples: <strong>{scheduledGames.filter(g => !g.is_doubles).length}</strong>
            </span>
            <span className="text-green-800">
              Duplas: <strong>{scheduledGames.filter(g => g.is_doubles).length}</strong>
            </span>
          </div>
        </div>
        </div>
      )}
      
      {/* Aba de Jogos Não Agendados */}
      {activeTab === 'unscheduled' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
          ⏰ Agendar Jogos
        </h2>
        
        {/* Filtros para jogos não agendados */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           <div>
             <label className="block text-sm font-medium text-black mb-1">Categoria:</label>
             <select
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
             >
               <option value="all">Todas</option>
               {categories.map(category => (
                 <option key={category.id} value={category.id}>
                   {category.name}
                 </option>
               ))}
             </select>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-black mb-1">Data:</label>
             <input
               type="date"
                value={unscheduledDateFilter}
                onChange={(e) => setUnscheduledDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
               placeholder="Filtrar por data..."
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-black mb-1">Nome:</label>
             <input
               type="text"
                placeholder="Buscar jogador/dupla..."
                value={unscheduledNameFilter}
                onChange={(e) => setUnscheduledNameFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-black mb-1">Tipo:</label>
             <select
               value={unscheduledTypeFilter}
                onChange={(e) => setUnscheduledTypeFilter(e.target.value as 'all' | 'singles' | 'doubles')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
             >
               <option value="all">Todos</option>
               <option value="singles">Simples</option>
               <option value="doubles">Duplas</option>
             </select>
           </div>
         </div>

      {/* Lista de jogos */}
      <div className="space-y-2">
        {filteredGames.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum jogo encontrado para esta categoria.</p>
        ) : (
          filteredGames.map(game => (
            <div key={game.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between gap-4">
                {/* Informações do jogo */}
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-medium text-blue-600 min-w-[100px]">
                    {game.category?.name}
                  </span>
                  <span className="text-sm text-gray-700 flex-1">
                    {game.is_doubles 
                      ? `${game.team1?.name || 'Dupla 1'} vs ${game.team2?.name || 'Dupla 2'}`
                      : `${game.player1?.name || 'Jogador 1'} vs ${game.player2?.name || 'Jogador 2'}`
                    }
                  </span>
                </div>

                {/* Data atual */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 min-w-[100px]">
                    {formatDisplayDate(game.game_date)}
                  </span>
                  
                  {/* Campo de data */}
                  <input
                    type="date"
                    value={formatDate(game.game_date)}
                    onChange={(e) => handleDateChange(game.id, e.target.value)}
                    disabled={loading}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

        {/* Resumo da seção de agendamento */}
        <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              Jogos pendentes: <strong>{filteredGames.length}</strong>
            </span>
            <span className="text-blue-800">
              Simples: <strong>{filteredGames.filter(g => !g.is_doubles).length}</strong>
            </span>
            <span className="text-blue-800">
              Duplas: <strong>{filteredGames.filter(g => g.is_doubles).length}</strong>
            </span>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}