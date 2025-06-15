'use client'
// import { Metadata } from 'next'
import { Users, Target, UserCheck, Lock, Clock, AlertTriangle,
  MessageSquare, Calendar, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
// export const metadata: Metadata = {
//   title: 'Conditions d\'utilisation - École Al Ihsane',
//   description: 'Conditions d\'utilisation et politique de confidentialité',
// }

export default function TermsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 relative"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#375073]/10
          rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#375073]/10
          rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-96 h-96 bg-gradient-to-r from-[#375073]/5 to-transparent
          rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Container */}
      <main className="w-full max-w-4xl mx-auto relative z-10">
        <div className="backdrop-blur-xl bg-white/80 border border-white/30 rounded-3xl
          shadow-2xl p-6 lg:p-10 space-y-8">


          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-full h-32 mx-auto bg-gradient-to-br from-[#375073] to-[#4a6b95]
    rounded-xl flex items-center justify-center shadow-xl">
              <Image
                src="/Logo.jpg"
                alt="Logo École Al Ihsane"
                width={128}
                height={128}
                className="object-contain p-2"
                priority
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#375073]
      to-[#4a6b95] bg-clip-text text-transparent">
      École Al Ihsane
              </h1>
              <p className="text-gray-600">
      Conditions d'utilisation et Politique de confidentialité
              </p>
              <p className="text-gray-600">Dernière mise à jour : Juin 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  1. Identification du responsable de traitement
                </h2>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>École Al Ihsane</p>
                <p>7 Chemin de la Plaine</p>
                <p>31770 Colomiers</p>
                <p>France</p>
                <p className="mt-4 font-semibold">Contact pour les données personnelles :</p>
                <p>Pour toute question relative à vos données personnelles, vous pouvez :</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Nous contacter via la messagerie de l'application</li>
                  <li>Nous rencontrer directement à l'école</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  2. Données personnelles collectées
                </h2>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">
                  2.1. Données des élèves
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Informations d'identité : nom, prénom, date de naissance, genre</li>
                  <li>Coordonnées : adresse postale</li>
                  <li>Contacts familiaux : emails principal et secondaire des parents</li>
                  <li>Données scolaires : notes, évaluations comportementales</li>
                  <li>Statistiques générées : moyennes, données de suivi pédagogique</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-600">
                    <strong>Protection des mineurs :</strong> Pour les élèves de moins de 16 ans,
                    le consentement est recueilli auprès des titulaires de l'autorité parentale.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  3. Finalités du traitement
                </h2>
              </div>
              <p className="text-gray-600">
                Nous traitons vos données personnelles pour les finalités suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Gestion pédagogique : suivi des apprentissages, évaluation</li>
                <li>Suivi comportemental : évaluation du comportement et de l'assiduité</li>
                <li>Communication : échanges entre l'école, les familles et enseignants</li>
                <li>Administration scolaire : gestion des inscriptions, des absences</li>
                <li>Statistiques : analyses anonymisées pour l'amélioration pédagogique</li>
                <li>Obligations légales : respect de la réglementation sur l'instruction</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  4. Destinataires des données
                </h2>
              </div>
              <p className="text-gray-600">
                L'accès aux données est strictement limité selon les profils :
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">4.1. Familles</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Consultation des données de leurs enfants uniquement</li>
                    <li>Accès aux notes, comportements, absences</li>
                    <li>Messagerie avec l'équipe pédagogique</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">4.2. Enseignants</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Saisie et consultation des données de leurs élèves</li>
                    <li>Accès aux statistiques de classe</li>
                    <li>Messagerie interne</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">4.3. Administration</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Accès complet pour la gestion administrative</li>
                    <li>Suivi des absences répétées</li>
                    <li>Gestion des comptes utilisateurs</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  5. Sécurité et hébergement
                </h2>
              </div>
              <p className="text-gray-600">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Hébergement : Vercel (infrastructure sécurisée)</li>
                <li>Base de données : Supabase avec chiffrement</li>
                <li>Code source : GitHub sous licence AGPL</li>
                <li>Accès : authentification sécurisée et contrôle des accès</li>
                <li>Sauvegardes : régulières et sécurisées</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-600">
                  <strong>Sous-traitants :</strong> Nos prestataires (Vercel, Supabase) sont
                  conformes RGPD et situés dans l'Union Européenne ou disposent de garanties
                  appropriées.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  6. Durée de conservation
                </h2>
              </div>
              <p className="text-gray-600">
                Nous conservons vos données personnelles pendant :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Données des élèves actifs : pendant toute la scolarité</li>
                <li>Données des anciens élèves : 2 ans après la fin de scolarité</li>
                <li>Données de messagerie : 1 an après l'envoi</li>
                <li>Statistiques : données anonymisées conservées sans limitation</li>
              </ul>
              <p className="text-gray-600">
                À l'issue de ces délais, les données sont automatiquement supprimées de nos
                systèmes.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  7. Vos droits RGPD
                </h2>
              </div>
              <p className="text-gray-600">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">7.1. Droit d'accès</h3>
                  <p className="text-gray-600">
                    Vous pouvez demander la communication de toutes vos données personnelles.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">7.2. Droit de rectification</h3>
                  <p className="text-gray-600">
                    Vous pouvez demander la correction de données inexactes via un message à
                    l'administration.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">7.3. Droit à l'effacement</h3>
                  <p className="text-gray-600">
                    Vous pouvez demander la suppression de vos données dans certains cas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">7.4. Droit à la portabilité</h3>
                  <p className="text-gray-600">
                    Vous pouvez récupérer vos données dans un format exploitable.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">7.5. Droit d'opposition</h3>
                  <p className="text-gray-600">
                    Vous pouvez vous opposer au traitement pour motifs légitimes.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-600">
                    <strong>Exercice des droits :</strong> Pour exercer ces droits, contactez
                    l'administration via la messagerie de l'application ou par email. Nous
                    répondrons dans un délai d'un mois maximum.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  8. Fonctionnalités de l'application
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">8.1. Espace Familles</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Consultation du suivi scolaire de vos enfants</li>
                    <li>Accès aux notes et évaluations comportementales</li>
                    <li>Suivi des absences</li>
                    <li>Messagerie sécurisée avec l'équipe éducative</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700">8.2. Espace Enseignants</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Saisie des notes et évaluations</li>
                    <li>Gestion des absences</li>
                    <li>Consultation des statistiques de classe</li>
                    <li>Calendrier pédagogique</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-600">
                    La messagerie évoluera prochainement vers un système de type "chat
                    instantané" pour améliorer la communication. Vous serez informés de ces
                    changements et de leurs implications sur vos données.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  9. Réclamations
                </h2>
              </div>
              <p className="text-gray-600">
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Nous contacter directement pour résoudre le problème</li>
                <li>Saisir la CNIL (Commission Nationale de l'Informatique et des Libertés) :</li>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Site web : www.cnil.fr</li>
                  <li>Adresse : 3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07</li>
                  <li>Téléphone : 01 53 73 22 22</li>
                </ul>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  10. Évolution des conditions
                </h2>
              </div>
              <p className="text-gray-600">
                Ces conditions d'utilisation peuvent être modifiées pour s'adapter à l'évolution
                de l'application ou de la réglementation. Toute modification importante sera
                portée à votre connaissance via :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Notification dans l'application</li>
                <li>Email aux utilisateurs</li>
                <li>Publication de la nouvelle version sur cette page</li>
              </ul>
              <p className="text-gray-600">
                L'utilisation continue de l'application après notification vaut acceptation des
                nouvelles conditions.
              </p>
            </section>

            {/* Section 11 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#375073]" />
                <h2 className="text-xl font-semibold text-[#375073]">
                  11. Acceptation des conditions
                </h2>
              </div>
              <p className="text-gray-600">En utilisant cette application, vous confirmez :</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Avoir pris connaissance de ces conditions d'utilisation</li>
                <li>Les accepter intégralement</li>
                <li>Vous engager à les respecter</li>
                <li>Avoir l'autorité nécessaire pour consentir au traitement des données</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-600">
                  <strong>Pour les mineurs de moins de 16 ans :</strong> L'utilisation de
                  l'application par un mineur nécessite l'accord préalable de ses parents ou
                  tuteurs légaux.
                </p>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-gray-500 pt-8 border-t border-gray-200">
              <p className="font-semibold">
                École Al Ihsane - 7 Chemin de la Plaine, 31770 Colomiers
              </p>
              <p className="mt-2">
                Document généré en conformité avec le Règlement Général sur la Protection des
                Données (RGPD)
              </p>
              <p className="text-sm mt-2">Version 1.0 - Juin 2025</p>
            </footer>
          </div>
        </div>
      </main>
    </motion.div>
  )
}
