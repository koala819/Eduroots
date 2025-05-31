import { Student } from '@/types/user'
import { BaseChatSideBarProps } from '@/components/molecules/client/MessagesSideBar'
import clsx from 'clsx'
import Image from 'next/image'
import avatarFamily from '@/public/avatar-family.webp'
import groupStudents from '@/public/avatar-teacher-group-students.webp'
import avatarBureau from '@/public/avatar-bureau.webp'
import { formatDayOfWeek } from '@/lib/utils'
import { TimeSlotEnum } from '@/types/course'

interface MessagesSideBarTeacherProps extends BaseChatSideBarProps {
  students: Student[]
  coursesTeachersWithChildren: {
    name: string
    students: Student[]
  }[]
}

export const MessagesSideBarTeacher = ({
  selected,
  onSelect,
  setLoading,
  students,
  coursesTeachersWithChildren,
}: MessagesSideBarTeacherProps) => {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      {/* Section des groupes de cours */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-2">GROUPES</h2>
        {coursesTeachersWithChildren.map((group) => {
          return (
            <button
              key={group.name}
              onClick={() => {
                setLoading(true)
                onSelect(group.name)
              }}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                selected === group.name
                  ? 'bg-blue-100 font-bold'
                  : 'hover:bg-gray-200 text-gray-700',
              )}
            >
              <Image
                src={groupStudents}
                alt="groupStudents"
                className="w-20 h-20 md:w-16 md:h-16 rounded-full"
              />
              <span className="ml-2 text-base text-left">
                {formatDayOfWeek(group.name as TimeSlotEnum)}
              </span>
            </button>
          )})}
      </section>
      {/* Section des étudiants individuels */}
      <section className="mb-4">
        <h2 className="text-lg font-bold text-gray-700 mb-2">ELEVES</h2>
        {students.map((student) => (
          <button
            key={student._id}
            onClick={() => {
              setLoading(true)
              onSelect(student._id)
            }}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full',
              selected === student._id
                ? 'bg-blue-100 font-bold'
                : 'hover:bg-gray-200 text-gray-700',
            )}
          >
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
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
      </section>
      {/* Section Bureau */}
      <section className="mb-4">
        <h2 className="text-lg font-bold text-gray-700 mb-2">BUREAU</h2>

        <button

          onClick={() => {
            setLoading(true)
            onSelect('bureau')
          }}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full',
            selected === 'bureau'
              ? 'bg-blue-100 font-bold'
              : 'hover:bg-gray-200 text-gray-700',
          )}
        >
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
            <Image
              src={avatarBureau}
              alt="bureau"
              className="w-20 h-20 md:w-16 md:h-16 rounded-full"
            />
          </div>
          <span className="ml-2 text-base text-left">
              Bureau
          </span>
        </button>

      </section>
    </div>
  )
}
