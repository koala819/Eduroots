export default function LinkAccountPage({
  searchParams,
}: {
  searchParams: { provider_email: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50
     to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Lier votre compte
          </h1>
          <p className="text-gray-600">
            Vous êtes connecté avec {searchParams.provider_email}
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email professionnel
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-[#375073] focus:border-transparent"
              placeholder="tata@machin.fr"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#375073] text-white font-medium rounded-lg
              hover:bg-[#4a6b95] transition-colors"
          >
            Lier les comptes
          </button>
        </form>
      </div>
    </div>
  )
}
