const StudentContact = ({label, value}: {label: string; value: string}) => {
  return (
    <div className="bg-slate-50 p-3 rounded-md">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export default StudentContact
