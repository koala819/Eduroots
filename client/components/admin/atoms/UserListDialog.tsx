import { ChevronRight, CircleArrowLeft, Pencil, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/client/utils/supabase'

import { useRouter } from 'next/navigation'

import { EntityType } from '@/zUnused/types/stats'
import { Student, Teacher } from '@/zUnused/types/user'

import { UserDetails } from '@/server/components/admin/organisms/UserDetails'
import { Button } from '@/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import { Input } from '@/client/components/ui/input'
import { ScrollArea } from '@/client/components/ui/scroll-area'

import { motion } from 'framer-motion'

type UserListDialogProps = {
  type: EntityType
  people: (Student | Teacher)[]
  selectedEntity: Student | Teacher | null
  onSelectEntity: (entity: Student | Teacher | null) => void
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
      setUserRole(user?.user_metadata?.role || null)
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
            {type === 'students' ? 'Liste des élèves' : 'Liste des professeurs'}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {selectedEntity ? (
            <>
              <div className="flex justify-between">
                <Button variant="destructive" className="mb-4" onClick={() => onSelectEntity(null)}>
                  <CircleArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
                </Button>
                {userRole === 'admin' && (
                  <Button
                    className="mb-4"
                    onClick={() =>
                      router.push(
                        `${process.env.NEXT_PUBLIC_CLIENT_URL}/
                        admin/${selectedEntity.role}/edit/${selectedEntity.id}`,
                      )
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                  </Button>
                )}
              </div>
              <div className="space-y-4 px-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedEntity.firstname} {selectedEntity.lastname}
                    </h3>
                    <p className="text-gray-500">{selectedEntity.email}</p>
                  </div>
                </div>
                <UserDetails entity={selectedEntity} />
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {people.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-4 p-3 rounded-lg
                        hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onSelectEntity(user)}
                    >
                      <div className="flex-grow">
                        <p className="font-medium">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
