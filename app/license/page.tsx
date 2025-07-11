import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AGPL-3.0 License - Eduroots',
  description:
    'Information about the GNU Affero General Public License v3.0 (AGPL-3.0) used by Eduroots',
}

export default function LicensePage() {
  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        GNU Affero General Public License v3.0 (AGPL-3.0)
      </h1>

      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          About the AGPL-3.0 License
        </h2>
        <p className="text-muted-foreground">
          Eduroots is distributed under the GNU Affero General Public License
          v3.0 (AGPL-3.0). This license ensures that:
        </p>
        <ul className="list-disc pl-6 mb-6 text-muted-foreground">
          <li>The source code remains freely accessible</li>
          <li>
            Any modified version must be distributed under the same license
          </li>
          <li>Users have the right to modify and distribute the software</li>
          <li>
            Changes must be documented and made available to the community
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          Access to Source Code
        </h2>
        <p className="text-muted-foreground">
          The complete source code of Eduroots is available on our{' '}
          <a
            href="https://github.com/koala819/Eduroots"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark transition-colors duration-200"
          >
            GitHub repository
          </a>
          .
        </p>

        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          Terms of Use
        </h2>
        <p className="text-muted-foreground">When using Eduroots, you agree to:</p>
        <ul className="list-disc pl-6 mb-6 text-muted-foreground">
          <li>Respect the terms of the AGPL-3.0 license</li>
          <li>
            Provide access to the source code if you distribute a modified
            version
          </li>
          <li>Include copyright and license notices</li>
          <li>Document any changes made to the software</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          Contact
        </h2>
        <p className="text-muted-foreground">
          For any questions regarding the license or access to the source code:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>Email: [Your email]</li>
          <li>Website: [Your website]</li>
          <li>GitHub: [Your GitHub profile]</li>
        </ul>
      </div>
    </div>
  )
}
