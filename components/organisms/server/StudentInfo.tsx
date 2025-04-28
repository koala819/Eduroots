import { Student } from '@/types/user'

import StudentContact from '@/components/atoms/server/StudentContact'
import StudentChild from '@/components/molecules/server/StudentChild'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

interface FamilyInfoCardProps {
  data: Student[]
}

const StudentInfo = ({ data }: FamilyInfoCardProps) => {
  return (
    <Card className="max-w-xl w-full mx-auto">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <div>
          <h1 className="text-lg font-semibold">Famille {data[0].lastname}</h1>
          <p className="text-sm text-slate-500">
            Année scolaire {data[0].schoolYear}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informations de contact */}
        <div>
          <h2 className="text-sm font-semibold mb-3">
            Informations de contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StudentContact label="Email principal" value={data[0].email} />
            {data[0].secondaryEmail && (
              <StudentContact
                label="Email secondaire"
                value={data[0].secondaryEmail}
              />
            )}
            <StudentContact label="Téléphone" value={data[0].phone || ''} />
          </div>
        </div>

        {/* Enfants */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Enfants</h2>

          <div className="space-y-3">
            {data.map((child) => (
              <StudentChild key={child.id} child={child} />
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 flex justify-center">
        <span className="text-sm text-slate-500 text-center">
          Si les informations sont incorrectes, veuillez contacter le Bureau .
        </span>
      </CardFooter>
    </Card>
  )
}

export default StudentInfo
