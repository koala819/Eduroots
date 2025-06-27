import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar,CheckCircle, Mail, Phone, User, XCircle } from 'lucide-react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { Badge } from '@/client/components/ui/badge'

export const AdminInfoDisplay = ({ data }: {data: any}) => (
  <div className="space-y-6">
    {/* Informations de base */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          Prénom
        </p>
        <p className="font-medium text-base md:text-lg">{data.firstname}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          Nom
        </p>
        <p className="font-medium text-base md:text-lg">{data.lastname}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Principal
        </p>
        <p className="font-medium text-base md:text-lg break-all">{data.email}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Téléphone
        </p>
        <p className="font-medium text-base md:text-lg">{data.phone || '-'}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Secondaire
        </p>
        <p className="font-medium text-base md:text-lg break-all">{data.secondaryEmail || '-'}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date de Naissance
        </p>
        <p className="font-medium text-base md:text-lg">
          {data.dateOfBirth
            ? format(new Date(data.dateOfBirth), 'd MMMM yyyy', { locale: fr })
            : '-'}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <GenderDisplay gender={data.gender} size="h-4 w-4" />
          Genre
        </p>
        <p className="font-medium text-base md:text-lg">{data.gender}</p>
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
)
