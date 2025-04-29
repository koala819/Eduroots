import {format} from 'date-fns'
import {fr} from 'date-fns/locale'

export const AdminInfoDisplay = ({data}: {data: any}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-6">
    {/* Item wrapper pour un meilleur contrôle du spacing */}
    <div className="space-y-1">
      <p className="text-sm text-gray-500">Prénom</p>
      <p className="font-medium text-base md:text-lg">{data.firstname}</p>
    </div>

    <div className="space-y-1">
      <p className="text-sm text-gray-500">Nom</p>
      <p className="font-medium text-base md:text-lg">{data.lastname}</p>
    </div>

    <div className="space-y-1">
      <p className="text-sm text-gray-500">Email Principal</p>
      <p className="font-medium text-base md:text-lg break-all">{data.email}</p>
    </div>

    <div className="space-y-1">
      <p className="text-sm text-gray-500">Email Secondaire</p>
      <p className="font-medium text-base md:text-lg break-all">{data.secondaryEmail || '-'}</p>
    </div>

    <div className="space-y-1">
      <p className="text-sm text-gray-500">Genre</p>
      <p className="font-medium text-base md:text-lg">{data.gender}</p>
    </div>

    <div className="space-y-1">
      <p className="text-sm text-gray-500">Date de Naissance</p>
      <p className="font-medium text-base md:text-lg">
        {data.dateOfBirth ? format(new Date(data.dateOfBirth), 'd MMMM yyyy', {locale: fr}) : '-'}
      </p>
    </div>
  </div>
)
