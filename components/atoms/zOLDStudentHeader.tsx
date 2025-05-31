import Image from 'next/image'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
            <Image
              src="/icon-512x512-maskable.png"
              alt="Eduroots"
              fill
              priority
            />
          </div>
          <span className="font-bold text-base text-slate-700">
            Suivi scolaire
          </span>
        </div>
      </div>
    </header>
  )
}
