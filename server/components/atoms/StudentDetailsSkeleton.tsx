export default function StudentDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}
