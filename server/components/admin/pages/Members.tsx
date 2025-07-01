'use client'

import {
  BookOpen,
  Edit,
  Eye,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Search,
  UserPlus,
  Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo,useState } from 'react'

import { StudentProfileDialog } from '@/client/components/admin/organisms/StudentProfileDialog'
import { TeacherProfileDialog } from '@/client/components/admin/organisms/TeacherProfileDialog'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent } from '@/client/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from '@/client/components/ui/dropdown-menu'
import { Input } from '@/client/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from '@/client/components/ui/tooltip'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

interface MembersViewProps {
  students: StudentResponse[]
  teachers: TeacherResponse[]
}

type Person = (StudentResponse | TeacherResponse) & {
  type: 'student' | 'teacher'
  displayName: string
  role: string
  status: 'active' | 'inactive'
}



export function MembersView({
  students,
  teachers,
}: Readonly<MembersViewProps>) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Combiner et normaliser les données
  const allPeople: Person[] = useMemo(() => {
    const studentPeople: Person[] = students.map((student) => ({
      ...student,
      type: 'student' as const,
      displayName: `${student.firstname} ${student.lastname}`,
      role: 'Élève',
      status: student.is_active ? 'active' : 'inactive',
    }))

    const teacherPeople: Person[] = teachers.map((teacher) => ({
      ...teacher,
      type: 'teacher' as const,
      displayName: `${teacher.firstname} ${teacher.lastname}`,
      role: 'Professeur',
      status: teacher.is_active ? 'active' : 'inactive',
    }))

    return [...studentPeople, ...teacherPeople]
  }, [students, teachers])

  // Filtrer les données
  const filteredPeople = useMemo(() => {
    return allPeople.filter((person) => {
      const matchesSearch = person.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           person.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || person.type === roleFilter
      const matchesStatus = statusFilter === 'all' || person.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [allPeople, searchQuery, roleFilter, statusFilter])

  const stats = useMemo(() => ({
    total: allPeople.length,
    students: students.length,
    teachers: teachers.length,
    active: allPeople.filter((p) => p.status === 'active').length,
    inactive: allPeople.filter((p) => p.status === 'inactive').length,
  }), [allPeople, students, teachers])

  const statsTotal = {
    total: stats.total,
    students: stats.students,
    teachers: stats.teachers,
    active: stats.active,
    inactive: stats.inactive,
  }

  return (
    <div className="bg-background p-3 md:p-4 lg:p-6 pb-8 sm:pb-0">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">

        {/* Ajouter un membre */}
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                    Ajouter un membre
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white/80 backdrop-blur-sm">
              <DropdownMenuItem onClick={() => router.push('/admin/members/student/create')}>
                <Users className="h-4 w-4 mr-2" />
                    Nouvel élève
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/members/teacher/create')}>
                <GraduationCap className="h-4 w-4 mr-2" />
                    Nouveau professeur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          { Object.entries(statsTotal).map(([key, value]) => (
            <Card key={key} className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl
            border border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground">{key}</p>
              </CardContent>
            </Card>
          )) }
        </div>

        {/* Filtres et recherche */}
        <Card className=" rounded-2xl border border-border/50 shadow-sm">
          <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-4
          justify-between">
            <aside className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2
                h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </aside>

            <aside className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {roleFilter === 'all' ? 'Tous les rôles' :
                      roleFilter === 'student' ? 'Élèves' : 'Professeurs'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/80 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                      Tous les rôles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('student')}>
                      Élèves
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('teacher')}>
                      Professeurs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {statusFilter === 'all' ? 'Tous les statuts' :
                      statusFilter === 'active' ? 'Actifs' : 'Inactifs'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/80 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      Tous les statuts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                      Actifs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                      Inactifs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </aside>
          </CardContent>
        </Card>

        {/* Liste des personnes */}
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border
        border-border/50 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              {filteredPeople.map((person) => (
                <div key={person.id}
                  className="flex items-center justify-between p-4 rounded-xl border
                  border-border/50 hover:border-primary/30 hover:shadow-md
                  transition-all duration-300">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground truncate">
                          {person.displayName}
                        </h3>
                        <div
                          className={`px-2 py-1 rounded-md text-xs
                          ${person.type === 'student'
                  ? 'bg-purple/10 text-purple border-purple/20'
                  : 'bg-secondary/10 text-secondary border-secondary/20'}`}
                        >
                          {person.role}
                        </div>

                      </div>
                      <div className="flex items-center gap-4 text-sm
                      text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{person.email}</span>
                        </span>
                        {person.type === 'student' &&
                          (person as StudentResponse).phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {(person as StudentResponse).phone}
                            </span>
                          </span>
                        )}
                        {person.type === 'teacher' && (person as TeacherResponse).subjects && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 flex-shrink-0" />
                            <span>
                              {(person as TeacherResponse).subjects?.length || 0} matière(s)
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Bouton Voir pour les étudiants */}
                    {person.type === 'student' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <StudentProfileDialog
                              student={{
                                ...person as StudentResponse,
                                stats: {
                                  userId: person.id,
                                  absencesRate: 0,
                                  absencesCount: 0,
                                  behaviorAverage: 0,
                                  absences: [],
                                  grades: { overallAverage: 0 },
                                  lastActivity: null,
                                  lastUpdate: new Date(),
                                },
                              } as any}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-info/10 hover:text-info"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Voir</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Bouton Voir pour les professeurs */}
                    {person.type === 'teacher' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TeacherProfileDialog
                              teacher={person as TeacherResponse}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-info/10 hover:text-info"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Voir le profil</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const typePath = person.type === 'student' ? 'student' : 'teacher'
                              const path = `/admin/members/${typePath}/edit/${person.id}`
                              router.push(path)
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Modifier</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}

              {filteredPeople.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Aucun résultat</h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez de modifier vos filtres ou votre recherche
                  </p>
                  <Button onClick={() => {
                    setSearchQuery('')
                    setRoleFilter('all')
                    setStatusFilter('all')
                  }}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
