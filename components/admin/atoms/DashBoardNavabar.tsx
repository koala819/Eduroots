'use client'

import {Menu, Search, X} from 'lucide-react'
import {useState} from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'

export const DashBoardNavbar = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    {name: 'Tableau de bord', view: 'dashboard'},
    {name: 'Élèves', view: 'students'},
    {name: 'Classes', view: 'classes'},
    {name: 'Enseignants', view: 'teachers'},
  ]
  return (
    <div>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-gray-900">École Dashboard</span>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => setCurrentView(item.view)}
                    className={`${
                      currentView === item.view
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="w-full max-w-lg lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Rechercher
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Rechercher"
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Ouvrir le menu principal</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view)
                  setIsMobileMenuOpen(false)
                }}
                className={`${
                  currentView === item.view
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
