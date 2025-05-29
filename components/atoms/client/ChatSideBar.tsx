'use client'

import { HiUserGroup } from 'react-icons/hi'
import { FaBuilding, FaChalkboardTeacher } from 'react-icons/fa'
import clsx from 'clsx'

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
    icon: <FaChalkboardTeacher className="text-blue-500 text-xl" />,
  },
  {
    key: 'parent-bureau',
    label: 'Bureau',
    icon: <FaBuilding className="text-green-600 text-xl" />,
  },
  {
    key: 'parent-prof-bureau',
    label: (
      <div className="flex flex-col leading-tight">
        <span>Bureau +</span>
        <span>Enseignant</span>
      </div>
    ),
    icon: <HiUserGroup className="text-purple-500 text-2xl" />,
  },
]

export const ChatSideBar = ({ selected, onSelect, result, setLoading }: ChatSideBarProps) => {

    return (
        <aside className="flex flex-col w-56 bg-[#f4f2ee] border-r border-gray-200 h-full min-h-0 rounded-l-2xl">
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
                        <span className="bg-gray-300 rounded-full p-4 flex items-center justify-center">
                            {group.icon}
                        </span>
                        <span className="ml-2 text-base text-left">{group.label}</span>
                        </button>
                    )
                }
                return null
            })}
            </div>
        </aside>
)}