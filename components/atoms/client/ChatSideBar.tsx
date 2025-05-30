'use client'

import clsx from 'clsx'
import avatarBureau from '@/public/avatar-bureau.webp'
import avatarTeacher from '@/public/avatar-teacher.webp'
import avatarFamily from '@/public/avatar-family.webp'
import Image from 'next/image'

interface ChatSideBarProps {
  selected: string
  onSelect: (key: string) => void
  result: {
    name: string
    _id: string
  }[]
  setLoading: (loading: boolean) => void
}

const GROUPS = [
  {
    key: 'parent-prof',
    label: 'Enseignant',
    picture: {src: avatarTeacher, alt: 'Prof'},
  },
  {
    key: 'parent-bureau',
    label: 'Bureau',
    picture: {src: avatarBureau, alt: 'Bureau'},
  },
  {
    key: 'parent-prof-bureau',
    label: (
      <div className="flex flex-col leading-tight">
        <span>Bureau +</span>
        <span>Enseignant</span>
      </div>
    ),
    picture: {src: avatarFamily, alt: 'All'},
  },
]

export const ChatSideBar = ({ selected, onSelect, result, setLoading }: ChatSideBarProps) => {

    return (
        <aside className="flex flex-col w-full md:w-72 bg-[#f4f2ee] border-r border-gray-200 h-full rounded-l-2xl">
            <div className="flex flex-col gap-2 py-4 px-4">
            {GROUPS.map((group, index) => {
                if (result[index].name === group.key) {
                    return (
                        <button
                        key={group.key}
                        onClick={() => {
                          setLoading(true)
                          onSelect(result[index]._id)
                        }}
                        className={clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                            selected === result[index]._id
                            ? 'bg-blue-100 font-bold'
                            : 'hover:bg-gray-200 text-gray-700'
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
        </aside>
)}