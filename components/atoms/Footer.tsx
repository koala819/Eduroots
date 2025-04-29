import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center py-4">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} EduRootS. Tous droits réservés.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/license" className="text-sm text-gray-600 hover:text-gray-900">
              Licence AGPL-3.0
            </Link>
            <a
              href="https://github.com/votre-username/eduroots"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Code source
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
