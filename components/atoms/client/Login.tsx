'use client'

import { createClient } from '@/utils/supabase/client'
import { BuildingOfficeIcon, AcademicCapIcon, HomeIcon } from '@heroicons/react/24/outline'
import { UserGroupIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
// import { signInWithGoogle, signInWithApple } from '@/app/actions/auth'

export const LoginClient = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const roles = [
    {
      id: 'bureau',
      name: 'Bureau',
      icon: BuildingOfficeIcon,
      description: 'Administration',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700',
    },
    {
      id: 'enseignant',
      name: 'Enseignant',
      icon: AcademicCapIcon,
      description: 'Professeur',
      gradient: 'from-[#375073] to-[#4a6b95]',
      hoverGradient: 'from-[#4a6b95] to-[#5d7fb7]',
    },
    {
      id: 'famille',
      name: 'Famille',
      icon: HomeIcon,
      description: 'Parent/Tuteur',
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 to-emerald-700',
    },
  ]

  async function signInWithGoogle() {
    const supabase = await createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        // redirectTo: 'https://sopyqttakjinwjxscgmk.supabase.co/auth/v1/callback',
        // redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/auth/callback`,
        queryParams: {
          role: selectedRole!,
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100
      dark:from-gray-950 dark:via-gray-900 dark:to-slate-900
      flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#375073]/10 rounded-full blur-3xl
         animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#375073]/10 rounded-full blur-3xl
         animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96
         bg-gradient-to-r from-[#375073]/5 to-transparent rounded-full  blur-3xl animate-pulse
         delay-1000" />
      </div>

      <div className="w-full max-w-md lg:max-w-lg relative z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80
          border border-white/30 dark:border-gray-700/30
          rounded-3xl shadow-2xl p-6 sm:p-8 space-y-8">

          {/* Logo & Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#375073] to-[#4a6b95]
              rounded-3xl flex items-center justify-center shadow-xl transform rotate-3
              hover:rotate-0 transition-all duration-500 hover:scale-110">
              <UserGroupIcon className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text
               bg-gradient-to-r from-[#375073] to-[#4a6b95] text-transparent">
                Eduroots
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200
             text-center">
              Choisissez votre profil
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roles.map((role) => {
                const IconComponent = role.icon
                const isSelected = selectedRole === role.id

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`group relative overflow-hidden rounded-2xl p-4 sm:p-3
                      border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
                      ${isSelected
                    ? `border-[#375073] bg-gradient-to-br ${role.gradient} text-white shadow-lg`
                    : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50' +
                    'hover:border-[#375073]/30'
                  }`}
                  >
                    <div className="flex flex-col sm:flex-col items-center space-y-2 sm:space-y-1">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-white/20'
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-[#375073]/10'
                      }`}>
                        <IconComponent className={`w-6 h-6 sm:w-5 sm:h-5 transition-colors ${
                          isSelected
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-300 group-hover:text-[#375073]'
                        }`} />
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-semibold transition-colors ${
                          isSelected
                            ? 'text-white'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {role.name}
                        </div>
                        <div className={`text-xs transition-colors ${
                          isSelected
                            ? 'text-white/80'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {role.description}
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/70 dark:bg-gray-900/70 text-gray-500
                dark:text-gray-400">
                  Connectez-vous avec
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <form
                action={signInWithGoogle}
              >
                <input type="hidden" name="role" value={selectedRole || ''} />
                <button
                  type="submit"
                  disabled={!selectedRole}
                  className="w-full flex items-center justify-center gap-3 py-4 px-4
                    bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
                    rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg
                    transition-all duration-200 transform hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-gray-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21
                      3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path
                      fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23
                      1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12
                      23z" />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43
                      8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path
                      fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97
                      1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Google
                  </span>
                </button>
              </form>

              <form
                // action={signInWithApple}
              >
                <input type="hidden" name="role" value={selectedRole || ''} />
                <button
                  type="submit"
                  disabled={!selectedRole}
                  className="w-full flex items-center justify-center gap-3 py-4 px-4
                    bg-black dark:bg-white text-white dark:text-black
                    rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg
                    transition-all duration-200 transform hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-gray-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path
                      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53
                      0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7
                      9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07
                      3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65
                      4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46
                      2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95
                      1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <span className="text-sm font-medium">Apple</span>
                </button>
              </form>
            </div>

            {!selectedRole && (
              <p className="text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50
              dark:bg-amber-900/20 p-2 rounded-lg">
                ⚠️ Veuillez d'abord sélectionner votre profil
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              En vous connectant, vous acceptez nos conditions d'utilisation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
