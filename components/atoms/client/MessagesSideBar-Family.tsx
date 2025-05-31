import { BaseChatSideBarProps } from '@/components/molecules/client/MessagesSideBar'
import avatarTeacher from '@/public/avatar-teacher.webp'
import avatarFamily from '@/public/avatar-family.webp'
import avatarBureau from '@/public/avatar-bureau.webp'
import clsx from 'clsx'
import Image from 'next/image'

interface MessagesSideBarFamilyProps extends BaseChatSideBarProps {
  childrenRooms: {
    name: string
    _id: string
  }[]
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

export const MessagesSideBarFamily = ({
  selected,
  onSelect,
  setLoading,
  childrenRooms,
}: MessagesSideBarFamilyProps) => {
  return (
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
                'flex items-center gap-1 lg:px-2 py-3 rounded-xl transition-colors',
                selected === childrenRooms[index]._id
                  ? 'bg-blue-100 font-bold'
                  : 'hover:bg-gray-200 text-gray-700',
              )}
            >
              <Image
                src={group.picture.src}
                alt={group.picture.alt}
                className="w-8 h-8 md:w-16 md:h-16 rounded-full"
              />
              <span className="ml-2 text-sm md:text-base text-left">{group.label}</span>
            </button>
          )
        }
        return null
      })}
    </div>
  )
}
