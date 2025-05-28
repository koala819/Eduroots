'use client'

import { HiUserGroup } from 'react-icons/hi'
import { FaBuilding, FaChalkboardTeacher } from 'react-icons/fa'
import clsx from 'clsx'

const GROUPS = [
  {
    key: 'enseignant',
    label: 'Enseignant',
    icon: <FaChalkboardTeacher className="text-blue-500 text-xl" />,
  },
  {
    key: 'bureau',
    label: 'Bureau',
    icon: <FaBuilding className="text-green-600 text-xl" />,
  },
  {
    key: 'bureau-enseignant',
    label: (
      <div className="flex flex-col leading-tight">
        <span>Bureau +</span>
        <span>Enseignant</span>
      </div>
    ),
    icon: <HiUserGroup className="text-purple-500 text-2xl" />,
  },
]

interface ChatSideBarProps {
  selected: string // clé du groupe sélectionné
  onSelect: (key: string) => void
}

const ChatSideBar = ({ selected, onSelect }: ChatSideBarProps) => (
  <aside className="flex flex-col w-56 bg-white border-r border-gray-200 h-full min-h-0">
    <div className="flex flex-col gap-2 py-4">
      {GROUPS.map((group) => (
        <button
          key={group.key}
          onClick={() => onSelect(group.key)}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-l-2xl transition-colors',
            selected === group.key
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : 'hover:bg-gray-100 text-gray-700'
          )}
        >
          <span className="bg-gray-200 rounded-full p-2 flex items-center justify-center">
            {group.icon}
          </span>
          <span className="ml-2 text-base text-left">{group.label}</span>
        </button>
      ))}
    </div>
  </aside>
)
export default ChatSideBar