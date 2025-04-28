import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Licence AGPL-3.0 - EduRootS',
  description: 'Informations sur la licence GNU Affero General Public License v3.0 (AGPL-3.0) utilisée par EduRootS',
}

export default function LicensePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Licence GNU Affero General Public License v3.0 (AGPL-3.0)</h1>

      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold mb-4">À propos de la licence AGPL-3.0</h2>
        <p className="mb-4">
          EduRootS est distribué sous la licence GNU Affero General Public License v3.0 (AGPL-3.0).
          Cette licence garantit que :
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Le code source reste accessible gratuitement</li>
          <li>Toute version modifiée doit être distribuée sous la même licence</li>
          <li>Les modifications doivent être documentées</li>
          <li>Les utilisateurs ont le droit d'accéder au code source des versions modifiées</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Accès au code source</h2>
        <p className="mb-4">
          Le code source complet d'EduRootS est disponible sur GitHub :
        </p>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <a
            href="https://github.com/votre-username/eduroots"
            className="text-blue-600 hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/votre-username/eduroots
          </a>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Conditions d'utilisation</h2>
        <p className="mb-4">
          En utilisant EduRootS, vous acceptez de :
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Respecter les termes de la licence AGPL-3.0</li>
          <li>Rendre accessible le code source de toute version modifiée</li>
          <li>Documenter toutes les modifications apportées</li>
          <li>Inclure les notices de copyright et de licence</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="mb-4">
          Pour toute question concernant la licence ou l'accès au code source :
        </p>
        <ul className="list-disc pl-6">
          <li>Email : [votre-email]</li>
          <li>Site web : [votre-site]</li>
          <li>GitHub : [votre-profil-github]</li>
        </ul>
      </div>
    </div>
  )
}