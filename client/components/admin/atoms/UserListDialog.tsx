import { motion } from 'framer-motion'
import { ChevronRight, CircleArrowLeft, Pencil, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent } from '@/client/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import { Input } from '@/client/components/ui/input'
import { ScrollArea } from '@/client/components/ui/scroll-area'
import { createClient } from '@/client/utils/supabase'
import { UserDetails } from '@/server/components/admin/organisms/UserDetails'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'
import { UserRoleEnum } from '@/types/user'

type UserListDialogProps = {
  type: UserRoleEnum
  people: (StudentResponse | TeacherResponse)[]
  selectedEntity: StudentResponse | TeacherResponse | null
  onSelectEntity: (entity: StudentResponse | TeacherResponse | null) => void
  searchQuery: string
  onSearch: (query: string) => void
  onClose: () => void
}

export const UserListDialog = ({
  type,
  people,
  selectedEntity,
  onSelectEntity,
  searchQuery,
  onSearch,
  onClose,
}: UserListDialogProps) => {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const getUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserRole(user?.user_metadata?.role ?? null)
    }
    getUserRole()
  }, [])

  return (
    <Dialog
      open={!!type}
      onOpenChange={() => {
        onSelectEntity(null)
        onClose()
      }}
    >
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === UserRoleEnum.Student ? 'Liste des élèves' : 'Liste des professeurs'}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedEntity && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onSelectEntity(null)}
                className="shrink-0"
              >
                <CircleArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            {selectedEntity ? (
              <UserDetails
                entity={selectedEntity}
                onBack={() => onSelectEntity(null)}
                onEdit={() => {
                  router.push(
                    `/${type === UserRoleEnum.Student ? 'students' : 'teachers'}/${
                      selectedEntity.id
                    }/edit`,
                  )
                }}
              />
            ) : (
              <div className="space-y-2">
                {people.map((person) => (
                  <motion.div
                    key={person.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      className="cursor-pointer group"
                      onClick={() => onSelectEntity(person)}
                    >
                      <CardContent className="flex items-center p-4">
                        <div className="flex-1">
                          <p className="font-medium">
                            {person.firstname} {person.lastname}
                          </p>
                          <p className="text-sm text-muted-foreground">{person.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {userRole === UserRoleEnum.Admin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(
                                  `/${type === UserRoleEnum.Student ? 'students' : 'teachers'}/${
                                    person.id
                                  }/edit`,
                                )
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5
                          text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
