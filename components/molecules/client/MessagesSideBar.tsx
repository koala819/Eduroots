'use client'

import { MessagesSideBarTeacher } from '@/components/atoms/client/MessagesSideBar-Teacher'
import { MessagesSideBarBureau } from '@/components/atoms/client/MessagesSideBar-Bureau'
import { Student } from '@/types/user'
import clsx from 'clsx'
import { MessagesSideBarFamily } from '@/components/atoms/client/MessagesSideBar-Family'

// Types pour les composants enfants
export interface BaseChatSideBarProps {
  selected: string
  onSelect: (key: string) => void
  setLoading: (loading: boolean) => void
}

interface MessagesSideBarProps {
  selected: string
  onSelect: (key: string) => void
  childrenRooms?: {
    name: string
    _id: string
  }[]
  setLoading: (loading: boolean) => void
  students?: Student[]
  coursesTeachersWithChildren?: {
    name: string
    students: Student[]
  }[]
  userType: 'family' | 'teacher' | 'bureau'
  fromFamily: boolean
}

export const MessagesSideBar = ({
  selected,
  onSelect,
  childrenRooms,
  setLoading,
  students,
  coursesTeachersWithChildren,
  userType,
  fromFamily,
}: MessagesSideBarProps) => {


  let content
  switch (userType) {
  case 'family':
    content = (
      <MessagesSideBarFamily
        selected={selected}
        onSelect={onSelect}
        setLoading={setLoading}
        childrenRooms={childrenRooms || []}
      />
    )
    break
  case 'teacher':
    content = (
      <MessagesSideBarTeacher
        selected={selected}
        onSelect={onSelect}
        setLoading={setLoading}
        students={students || []}
        coursesTeachersWithChildren={coursesTeachersWithChildren || []}
      />
    )
    break
  case 'bureau':
    content = (
      <MessagesSideBarBureau
        selected={selected}
        onSelect={onSelect}
        setLoading={setLoading}
        childrenRooms={childrenRooms || []}
      />
    )
    break
  default:
    console.error(`Invalid userType: ${userType}`)
    return null
  }

  // Wrapper commun
  return (
    <aside
      className={clsx(
        'flex flex-col w-full md:w-72 bg-[#f4f2ee] border-r border-gray-200',
        'rounded-l-2xl overflow-y-auto',
        fromFamily ? 'h-[calc(100vh-7rem)]' : 'h-[calc(100vh)]',
      )}
    >
      {content}
    </aside>
  )
}

