import { SubjectNameEnum } from '@/types/course'

import PlanningGridClient from '@/components/admin/organisms/client/PlanningGrid'

export default function PlanningGrid() {
  return (
    <div className="px-4 sm:px-6 py-4 space-y-4">
      {/* Legend */}
      <div className="flex gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-600" />
          <span className="text-sm font-medium">{SubjectNameEnum.Arabe}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600" />
          <span className="text-sm font-medium">
            {SubjectNameEnum.EducationCulturelle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-amber-400" />
          <span className="text-sm font-medium">Pause</span>
        </div>
      </div>

      <PlanningGridClient />
    </div>
  )
}
