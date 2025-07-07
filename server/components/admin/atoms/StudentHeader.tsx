import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'

import { CardHeader } from '@/client/components/ui/card'
import { StudentResponse } from '@/types/student-payload'

interface StudentHeaderProps {
  student: StudentResponse
}

export const StudentHeader = ({ student }: Readonly<StudentHeaderProps>) => {
  return (
    <CardHeader className="pt-4 px-4 pb-2 relative">
      <div className="flex justify-between items-start mb-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center space-x-3"
        >
          <div>
            <h2 className="text-lg font-bold tracking-tight mb-1">
              {student.firstname} {student.lastname}
            </h2>
            <div className="flex items-center text-xs text-muted-foreground space-x-2">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[160px]">{student.email}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </CardHeader>
  )
}
