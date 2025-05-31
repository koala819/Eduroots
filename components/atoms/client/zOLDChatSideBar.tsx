'use client'

import clsx from 'clsx'
import avatarBureau from '@/public/avatar-bureau.webp'
import avatarTeacher from '@/public/avatar-teacher.webp'
import avatarFamily from '@/public/avatar-family.webp'
import Image from 'next/image'
import { Student } from '@/types/user'

interface ChatSideBarProps {
  selected: string
  onSelect: (key: string) => void
  childrenRooms?: {
    name: string
    _id: string
  }[]
  setLoading: (loading: boolean) => void
  students?: Student[]
  coursesTeachersWithChildren?: {name: string, students: Student[]}[]
}

const GROUPS = [
  {
    key: 'parent-prof',
    label: 'Enseignant',
    picture: { src: avatarTeacher, alt: 'Prof' },
  },
  {
    key: 'parent-bureau',
    label: 'Bureau',
    picture: { src: avatarBureau, alt: 'Bureau' },
  },
  {
    key: 'parent-prof-bureau',
    label: (
      <div className="flex flex-col leading-tight">
        <span>Bureau +</span>
        <span>Enseignant</span>
      </div>
    ),
    picture: { src: avatarFamily, alt: 'All' },
  },
]

export const ChatSideBar = ({
  selected,
  onSelect,
  childrenRooms,
  setLoading,
  students,
}: ChatSideBarProps) => {
  return (
    <aside
      className="flex flex-col w-full md:w-72 bg-[#f4f2ee] border-r border-gray-200
      h-full rounded-l-2xl max"
    >
      {students ? (
        <div className="flex flex-col gap-2 py-4 px-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Mes élèves</h2>
          {students.map((student) => (
            <button
              key={student._id}
              onClick={() => {
                setLoading(true)
                onSelect(student._id)
              }}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                selected === student._id
                  ? 'bg-blue-100 font-bold'
                  : 'hover:bg-gray-200 text-gray-700',
              )}
            >
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                {/* <span className="text-xl font-semibold text-gray-600">
                        {student.firstname[0]}{student.lastname[0]}
                      </span> */}
                <Image
                  src={avatarFamily}
                  alt={student.firstname[0] + student.lastname[0]}
                  className="w-20 h-20 md:w-16 md:h-16 rounded-full"
                />
              </div>
              <span className="ml-2 text-base text-left">
                {student.firstname} {student.lastname}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-4 px-4">
          {GROUPS.map((group, index) => {
            if (childrenRooms && childrenRooms[index].name === group.key) {
              return (
                <button
                  key={group.key}
                  onClick={() => {
                    setLoading(true)
                    onSelect(childrenRooms[index]._id)
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    selected === childrenRooms[index]._id
                      ? 'bg-blue-100 font-bold'
                      : 'hover:bg-gray-200 text-gray-700',
                  )}
                >
                  <Image
                    src={group.picture.src}
                    alt={group.picture.alt}
                    className="w-20 h-20 md:w-16 md:h-16 rounded-full"
                  />
                  <span className="ml-2 text-base text-left">{group.label}</span>
                </button>
              )
            }
            return null
          })}
        </div>
      )}
    </aside>
  )
}
