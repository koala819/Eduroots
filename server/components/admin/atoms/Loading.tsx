export default function Loading({ name }: {name: string}) {
  return (
    <div className="flex items-center justify-center w-full h-24">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-700">Chargement des {name}...</p>
        {/* <p className="text-sm text-gray-700">Chargement des statistiques...</p> */}
      </div>
    </div>
  )
}
