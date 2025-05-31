import { BaseChatSideBarProps } from '@/components/molecules/client/MessagesSideBar'

interface MessagesSideBarBureauProps extends BaseChatSideBarProps {
  childrenRooms: {
    name: string
    _id: string
  }[]
}
export const MessagesSideBarBureau = ({
  selected,
  onSelect,
  setLoading,
}: MessagesSideBarBureauProps) => {
  console.log('selected', selected)
  console.log('onSelect', onSelect)
  console.log('setLoading', setLoading)

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">Conversations</h2>
      {/* Implémentation spécifique au bureau */}
    </div>
  )
}
