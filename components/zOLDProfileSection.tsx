import {ProfileItem} from '@/components/zOLDProfilItem'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

type ProfileSectionProps = {
  title: string
  items: any[]
}

export const ProfileSection = ({title, items}: ProfileSectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* MOBILE VIEW */}
        <div className="grid grid-cols-2 gap-4 sm:hidden">
          {items.map((item, index) => (
            <ProfileItem
              key={index}
              icon={item.icon}
              title={item.title}
              color={item.color}
              onClick={item.onClick}
              variant="mobile"
            />
          ))}
        </div>
        {/* DESKTOP VIEW */}
        <div className="hidden md:flex flex-col gap-2">
          {items.map((item, index) => (
            <ProfileItem
              key={index}
              icon={item.icon}
              title={item.title}
              color={item.color}
              onClick={item.onClick}
              variant="desktop"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
