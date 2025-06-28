'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar,CheckCircle, Mail, Phone, User, XCircle } from 'lucide-react'
import { Building, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { StudentResponse } from '@/types/student-payload'

interface PersonalCardInfoProps {
  id: string
  data: StudentResponse
}


export const PersonalCardInfo = ({ id, data }: PersonalCardInfoProps) => {
  const router = useRouter()

  function handleEditAdmin(): void {
    router.push(`/admin/members/student/edit/${id}/personal`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <Building className="h-8 w-8" />
          </div>
          <CardTitle className="text-base text-foreground">
            Informations Personnelles
          </CardTitle>
        </div>
        <Button
          onClick={() => router.push(`/admin/members/student/edit/${id}/personal`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Prénom
              </p>
              <p className="font-medium text-base md:text-lg">
                {data.firstname}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom
              </p>
              <p className="font-medium text-base md:text-lg">
                {data.lastname}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Principal
              </p>
              <p className="font-medium text-base md:text-lg break-all">
                {data.email}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Secondaire
              </p>
              <p className="font-medium text-base md:text-lg break-all">
                {data.secondary_email || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </p>
              <p className="font-medium text-base md:text-lg">
                {data.phone || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <GenderDisplay gender={data.gender} size="h-4 w-4" />
                Genre
              </div>
              <p className="font-medium text-base md:text-lg">
                {data.gender}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de Naissance
              </p>
              <p className="font-medium text-base md:text-lg">
                {data.date_of_birth ?
                  format(new Date(data.date_of_birth), 'd MMMM yyyy', { locale: fr })
                  : '-'}
              </p>
            </div>
          </div>

          {/* Statut actif - seulement le badge */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Statut du compte</p>
              </div>
              <Badge
                variant={data.is_active ? 'default' : 'secondary'}
                className={`flex items-center gap-2 px-3 py-2 ${
                  data.is_active
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-muted/10 text-muted-foreground border border-muted/20'
                }`}
              >
                {data.is_active ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {data.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


