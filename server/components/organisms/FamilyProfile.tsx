import { Calendar, Info, Mail, Phone, Users } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader } from '@/client/components/ui/card'
import { Contact } from '@/server/components/atoms/FamilyContact'
import { Child } from '@/server/components/molecules/FamilyChild'
import { User } from '@/types/db'
import { UserRoleEnum } from '@/types/user'

interface FamilyProfileProps {
  data: Array<User & { role: UserRoleEnum.Student }>
}

export const FamilyProfile = ({ data }: FamilyProfileProps) => {
  return (
    <div className="p-4">
      <div className="mx-auto max-w-4xl w-full space-y-6">
        {/* Header simple */}
        <section className="text-center w-full">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Famille {data[0].lastname}
          </h1>
          <p className={[
            'text-muted-foreground text-sm sm:text-base',
            'flex items-center justify-center gap-2 mt-1',
          ].join(' ')}>
            <Calendar className="w-4 h-4" />
            Année scolaire {data[0].school_year}
          </p>
        </section>

        {/* Grille responsive simple */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Informations de contact */}
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Informations de contact</h2>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Contact
                  label="Email principal"
                  value={data[0].email}
                  icon={<Mail className="w-4 h-4" />}
                />
                {data[0].secondary_email && (
                  <Contact
                    label="Email secondaire"
                    value={data[0].secondary_email}
                    icon={<Mail className="w-4 h-4" />}
                  />
                )}
                <Contact
                  label="Téléphone"
                  value={data[0].phone ?? ''}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Enfants */}
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Enfants</h2>
                <span className="ml-auto bg-secondary text-secondary-foreground px-3 py-1
                rounded-full text-sm font-medium">
                  {data.length}
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {data.map((child: User & { role: UserRoleEnum.Student }) => (
                  <div key={child.id}>
                    <Child child={child} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer simple */}
        <Card className="border border-border">
          <CardFooter className="flex items-center justify-center gap-3 py-6">
            <div className="w-8 h-8 rounded-lg bg-info flex items-center justify-center">
              <Info className="w-4 h-4 text-info-foreground" />
            </div>
            <span className="text-sm text-muted-foreground text-center font-medium">
              Si les informations sont incorrectes, veuillez contacter le Bureau.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
