'use client'

import { GraduationCap, Laptop, Rocket, ShieldCheck, Smartphone, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/client/components/ui/accordion'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface IUser {
  Id: string
  email: string
  firstname: string
  lastname: string
  role: string
}

interface ConnectionLogEntry {
  _id: string
  user: IUser
  isSuccessful: boolean
  timestamp: string
  userAgent: string
}

export const ConnectionLog: React.FC = () => {
  const [logs, setLogs] = useState<ConnectionLogEntry[]>([])

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/log/connection')
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const getDeviceInfo = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return {
        type: 'smartphone',
        os: ua.includes('android') ? 'android' : 'ios',
      }
    }
    if (ua.includes('win')) return { type: 'computer', os: 'windows' }
    if (ua.includes('mac')) return { type: 'computer', os: 'macos' }
    if (ua.includes('linux')) return { type: 'computer', os: 'linux' }
    return { type: 'computer', os: 'unknown' }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
    case 'admin':
      return <Rocket className="w-5 h-5 text-purple-500" />
    case 'bureau':
      return <ShieldCheck className="w-5 h-5 text-green-500" />
    case 'teacher':
      return <Users className="w-5 h-5 text-blue-500" />
    case 'student':
      return <GraduationCap className="w-5 h-5 text-yellow-500" />
    default:
      return null
    }
  }

  const getDeviceIcon = (deviceInfo: {type: string; os: string}) => {
    return deviceInfo.type === 'smartphone' ? (
      <Smartphone className="w-5 h-5 text-gray-600" />
    ) : (
      <Laptop className="w-5 h-5 text-gray-600" />
    )
  }

  const getOSIcon = (deviceInfo: {type: string; os: string}) => {
    switch (deviceInfo.os) {
    case 'windows':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50 50"
          className="w-5 h-5 text-blue-500"
        >
          <path
            d="M5 4C4.448 4 4 4.447 4 5L4 24 24 24 24 4 5 4zM26 4L26 24 46 24 46 5C46 4.447 45.552
            4 45 4L26 4zM4 26L4 45C4 45.553 4.448 46 5 46L24 46 24 26 4 26zM26 26L26 46 45
            46C45.552 46 46 45.553 46 45L46 26 26 26z"
            fill="currentColor"
          />
        </svg>
      )
    case 'macos':
    case 'ios':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50 50"
          className="w-5 h-5 text-gray-800"
        >
          <path
            d="M44.527344 34.75C43.449219 37.144531 42.929688 38.214844 41.542969 40.328125C39.
            601563 43.28125 36.863281 46.96875 33.480469 46.992188C30.46875 47.019531 29.691406
            45.027344 25.601563 45.0625C21.515625 45.082031 20.664063 47.03125 17.648438 47C14.
            261719 46.96875 11.671875 43.648438 9.730469 40.699219C4.300781 32.429688 3.726563
            22.734375 7.082031 17.578125C9.457031 13.921875 13.210938 11.773438 16.738281 11.
            773438C20.332031 11.773438 22.589844 13.746094 25.558594 13.746094C28.441406 13.
            746094 30.195313 11.769531 34.351563 11.769531C37.492188 11.769531 40.8125 13.480469
            43.1875 16.433594C35.421875 20.691406 36.683594 31.78125 44.527344 34.75ZM31.195313
            8.46875C32.707031 6.527344 33.855469 3.789063 33.4375 1C30.972656 1.167969 28.089844
            2.742188 26.40625 4.78125C24.878906 6.640625 23.613281 9.398438 24.105469 12.066406C26.
            796875 12.152344 29.582031 10.546875 31.195313 8.46875Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'linux':
      return <span className="text-xl">🐧</span>
    case 'android':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50 50"
          className="w-5 h-5 text-green-500"
        >
          <path
            d="M8.33 31.25C6.6 31.25 5.2 29.85 5.2 28.13V17.71C5.2 15.98 6.6 14.58 8.33 14.58C10.
            06 14.58 11.46 15.98 11.46 17.71V28.13C11.46 29.85 10.06 31.25 8.33 31.25ZM41.67 31.
            25C39.94 31.25 38.54 29.85 38.54 28.13V17.71C38.54 15.98 39.94 14.58 41.67 14.58C43.
            4 14.58 44.8 15.98 44.8 17.71V28.13C44.8 29.85 43.4 31.25 41.67 31.25ZM37.5 11.46L40.
            63 6.25C40.83 5.94 40.73 5.52 40.42 5.31C40.1 5.1 39.69 5.21 39.48 5.52L36.25 10.
            83C33.85 9.69 31.15 9.06 28.33 9.06C25.52 9.06 22.81 9.69 20.42 10.83L17.19 5.52C16.
            98 5.21 16.56 5.1 16.25 5.31C15.94 5.52 15.83 5.94 16.04 6.25L19.17 11.46C14.48 14.
            17 11.46 19.06 11.46 24.69H45.21C45.21 19.06 42.19 14.17 37.5 11.46ZM20.83 19.27C19.
            9 19.27 19.17 18.54 19.17 17.61C19.17 16.67 19.9 15.94 20.83 15.94C21.77 15.94 22.5
            16.67 22.5 17.61C22.5 18.54 21.77 19.27 20.83 19.27ZM35.83 19.27C34.9 19.27 34.17 18.
            54 34.17 17.61C34.17 16.67 34.9 15.94 35.83 15.94C36.77 15.94 37.5 16.67 37.5 17.
            61C37.5 18.54 36.77 19.27 35.83 19.27ZM11.46 26.35C11.46 33.85 17.5 39.9 25 39.9C32.
            5 39.9 38.54 33.85 38.54 26.35H11.46Z"
            fill="currentColor"
          />
        </svg>
      )
    default:
      return null
    }
  }

  //   const toggleRowExpansion = (id: string) => {
  //     setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  //   }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 to-purple-50
    min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Journaux de connexion</h1>
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Légende</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2 bg-purple-100 p-2 rounded-md">
            <Rocket className="w-5 h-5 text-purple-500" />{' '}
            <span className="text-purple-700">Admin</span>
          </div>
          <div className="flex items-center space-x-2 bg-green-100 p-2 rounded-md">
            <ShieldCheck className="w-5 h-5 text-green-500" />{' '}
            <span className="text-green-700">Bureau</span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-100 p-2 rounded-md">
            <Users className="w-5 h-5 text-blue-500" />{' '}
            <span className="text-blue-700">Enseignant</span>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-100 p-2 rounded-md">
            <GraduationCap className="w-5 h-5 text-yellow-500" />{' '}
            <span className="text-yellow-700">Étudiant</span>
          </div>
        </div>
      </div>
      {logs.length === 0 ? (
        <div className="text-center text-gray-600">
          Aucune donnée de log à afficher pour le moment
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const formattedDate = format(new Date(log.timestamp), 'dd/MM/yy', {
              locale: fr,
            })
            const formattedTime = format(new Date(log.timestamp), 'HH\'h\'mm', {
              locale: fr,
            })
            const deviceInfo = getDeviceInfo(log.userAgent)
            return (
              <Accordion type="single" collapsible key={log._id}>
                <AccordionItem value={log._id}>
                  <AccordionTrigger
                    className={`${log.isSuccessful ? 'bg-white hover:bg-gray-50'
                      : 'bg-red-100 hover:bg-red-200'}
                      p-4 rounded-lg transition-colors duration-150 ease-in-out`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
                        <span className="text-sm text-gray-500">{formattedTime}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">
                          {log.user.firstname && log.user.lastname
                            ? `${log.user.firstname.charAt(0).toUpperCase()
                            + log.user.firstname.slice(1).toLowerCase()}
                            ${log.user.lastname.toUpperCase()}`
                            : log.user.email}
                        </span>
                        {getRoleIcon(log.user.role)}
                        <div className="flex items-center space-x-2">
                          {getDeviceIcon(deviceInfo)}
                          {getOSIcon(deviceInfo)}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-gray-50 rounded-b-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-1">Utilisateur</h3>
                          <p className="text-sm text-gray-600">{log.user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-1">Rôle</h3>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(log.user.role)}
                            <span className="text-sm text-gray-600">{log.user.role}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-1">Appareil</h3>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(deviceInfo)}
                            <span className="text-sm text-gray-600">{deviceInfo.type}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-1">
                            Système d&apos;exploitation
                          </h3>
                          <div className="flex items-center space-x-2">
                            {getOSIcon(deviceInfo)}
                            <span className="text-sm text-gray-600">{deviceInfo.os}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )
          })}
        </div>
      )}
    </div>
  )
}
