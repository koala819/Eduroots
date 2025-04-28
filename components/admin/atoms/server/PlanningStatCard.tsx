export const StatsCard = ({
  label,
  value,
}: {
  label: string
  value: number | string
}) => (
  <div className="bg-gray-50 p-2 rounded-lg text-center">
    <div className="text-sm text-gray-600">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
)
