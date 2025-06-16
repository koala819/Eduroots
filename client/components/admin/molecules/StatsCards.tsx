import { ChevronRight, GraduationCap, Users } from 'lucide-react'
import { useState } from 'react'

import { EntityType } from '@/zUnused/mongo/stats'
import { Student, Teacher } from '@/zUnused/mongo/user'

import { UserListDialog } from '@/client//components/admin/atoms/UserListDialog'
import { Card, CardContent } from '@/client/components/ui/card'

import { motion } from 'framer-motion'

type StatItem = {
  title: string
  value: number
  icon: typeof Users | typeof GraduationCap
  color: string
  bgColor: string
  type: EntityType
  data: Student[] | Teacher[]
}

type StatsCardProps = {
  people: StatItem[]
  selectedType: EntityType | null
  onSelectType: (type: EntityType | null) => void
}

export const StatsCards = ({ people, selectedType, onSelectType }: StatsCardProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedEntity, setSelectedEntity] = useState<Student | Teacher | null>(null)

  const filteredData = selectedType
    ? (people.find((s) => s.type === selectedType)?.data || []).filter((item) =>
      `${item.firstname} ${item.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : []

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {people.map((item) => (
          <motion.div
            key={item.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectType(item.type)}
          >
            <Card className="cursor-pointer group">
              <CardContent className="flex items-center p-6">
                <div
                  className={`rounded-full p-3 ${item.color.replace('text', 'bg')} bg-opacity-20`}
                >
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <div className="ml-4 flex-grow">
                  <p className="text-sm font-medium text-gray-500">{item.title}</p>
                  <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
                </div>
                <ChevronRight
                  className={'h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1'}
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {selectedType && (
        <UserListDialog
          type={selectedType}
          people={filteredData}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onClose={() => onSelectType(null)}
        />
      )}
    </>
  )
}
