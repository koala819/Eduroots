import { ChevronRight, Info, X } from 'lucide-react'

import { Button } from '@/client/components/ui/button'
import { CardFooter } from '@/client/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/client/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/client/components/ui/tabs'
import { StudentStats } from '@/types/stats'
import { StudentResponse } from '@/types/student-payload'

import { AbsenceChart } from './AbsenceChart'
import { AbsenceList } from './AbsenceList'

interface StudentDetailsDialogProps {
  student: StudentResponse
  stats: StudentStats
}

export const StudentDetailsDialog = ({ student, stats }: Readonly<StudentDetailsDialogProps>) => {
  return (
    <CardFooter className="px-4 pb-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" className="w-full gap-2 rounded-lg text-sm">
            <span>Voir les détails</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-6 pt-6 pb-4 bg-primary/5">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl tracking-tight">
                  {student.firstname} {student.lastname}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Analyse complète des absences et comportement
                </DialogDescription>
              </div>
              <DialogClose className="rounded-full w-8 h-8 flex
              items-center justify-center hover:bg-gray-200">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>

          <Tabs defaultValue="absences" className="px-6 py-4">
            <TabsList className="mb-4 grid grid-cols-2 bg-gray-100 rounded-lg p-1">
              <TabsTrigger value="absences">Absences</TabsTrigger>
              <TabsTrigger value="statistics">Statistiques</TabsTrigger>
            </TabsList>

            <AbsenceList stats={stats} />
            <AbsenceChart stats={stats} />
          </Tabs>

          <DialogFooter className="px-6 py-4 bg-gray-50">
            <div className="w-full flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Info className="h-4 w-4 mr-2" />
                <span>Dernière mise à jour: aujourd&apos;hui</span>
              </div>
              <DialogClose asChild>
                <Button variant="destructive">Fermer</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardFooter>
  )
}
