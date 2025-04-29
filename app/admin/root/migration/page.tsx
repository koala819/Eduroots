'use client'

import {useState} from 'react'

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null)
  const [migrationSecret, setMigrationSecret] = useState<string>('')
  const [migrationType, setMigrationType] = useState<string>('')

  const explainMigration: {[key: string]: string} = {
    checkGradesDuplicates: 'Verifie si il y a des doublons dans la collection GRADE',
    checkRemainingFullSessions:
      "Simple outil de vérification pour COURSES qui permet de voir s'il reste des sessions longues (ex 9h-12h30) à diviser (ex 9h-10h45 et 10h45-12h30) dans votre collection",
    statsGradesClean:
      'Script pour verifier si id course de chaque enregistrement Grade existe bien dans la collection Course si NON alors on supprime le grade',
    statsGradesUpdate: 'Script pour mettre à jour le champ stats de chaque enregistrement Grade',
    statsStudentCheck:
      'Script pourpréparer la mise à jour du champ stats de chaque Student avec ces data :: { absencesRate: number;  absencesCount: number;behaviorAverage: number; absencesCount: number; absences: { date: Date; course: string; reason?: string;}[] grades: { [SubjectNameEnum.Arabe]: { average: number; }; [SubjectNameEnum.EducationCulturelle]: { average: number; }; overallAverage: number; }; lastActivity: Date; } Le résulatat est affiché dans un fichier Students_GRADES_stats.json dans le dossier Reports',
    statsStudentUpdate:
      'Script pour mettre à jour le champ stats de chaque Student avec ces data :: { absencesRate: number;  absencesCount: number; behaviorAverage: number; absencesCount: number; absences: { date: Date; course: string; reason?: string;}[]  grades: { [SubjectNameEnum.Arabe]: { average: number; }; [SubjectNameEnum.EducationCulturelle]: { average: number; }; overallAverage: number; }; lastActivity: Date; }',
    statsTeacherCheck:
      "Vérifie les stats des professeurs : affiche ID / Nom + Prénom / nombre de cours du ou des prof(s) qui ont cours et donne des stats :: \n nb d'élèves + répartition par genre + âge min + âge max + âge moyen",
    statsTeacherUpdate:
      'Script pour mettre à jour le champ stats de chaque Teacher avec ces data :: { totalStudents: number; genderDistribution: { counts: { masculin: number, feminin: number, undefined: number }; percentages: { masculin: string, feminin: string, undefined: string };}; minAge: number; maxAge: number; averageAge: number; }',
    checkAttendances:
      "Vérifie que les data dans la collection ATTEDANCE ont un bon sessionID de la collection COURSE. Si ce n'est pas le cas, script va essayer de trouver des correspondances et créer un fichier dans le dossier scripts. Dedans on va voir pour chaque correspondance le % d'égalité. Si tout est OK collé ce fichier dans /lib/migration et lancer le script ainsi node formatAttendanceCorrection.js attendance_corrections_xxx.js output.js Cela va créer le fichier output.js qui ne restera plus qu'à coller dans Open MongoDB shell",
    attendances:
      "Backup de l'ancienne et de la nouvelle collection ATTENDANCE. Vérifie que les formats sont corrects avant de lancer la migration et Mise à jour des statistiques globales",
    verifyAttendances:
      "Vérifie que les données de l'ancienne collection ATTENDANCE sont correctement présentes dans la nouvelle collection ATTENDANCE après migration",
    checkBehaviors:
      "Vérifie que les data de l'ancienne collection BEHAVIOR sont correctes avant de lancer la migration",
    behaviors:
      "Backup de l'ancienne et de la nouvelle collection BEHAVIOR. Vérifie que les formats sont corrects avant de lancer la migration et Mise à jour des statistiques globales",
    verifyBehaviors:
      "Vérifie que les données de l'ancienne collection BEHAVIOR sont correctement présentes dans la nouvelle collection BEHAVIOR après migration",
    checkGrades:
      "Vérifie que les data de l'ancienne collection GRADE sont correctes avant de lancer la migration",
    grades:
      "Backup de l'ancienne et de la nouvelle collection GRADE. S'appuie sur la Vérification de checkGrades pour lancer la migration.",
    verifyGrades:
      "Vérifie que les données de l'ancienne collection GRADE sont correctement présentes dans la nouvelle collection GRADE après migration",

    checkStats: 'BLA BLA BLA inutle ... juste pour tester',
  }

  const runMigration = async () => {
    setMigrationStatus('Travail en cours ...')

    try {
      console.log('migrationType', migrationType)
      const response = await fetch('/api/migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Migration-Secret': migrationSecret,
        },
        body: JSON.stringify({type: migrationType}),
      })

      const data = await response.json()
      if (response.ok) {
        setMigrationStatus(data.message)
      } else {
        setMigrationStatus(`Erreur: ${data.error}`)
      }
    } catch (error) {
      setMigrationStatus(`Erreur inattendue: ${error}`)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Migrate data from old collection to new collection
      </h1>
      <section
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <p className="text-center text-2xl font-bold mb-2">ATTENTION</p>
        <p className="mb-2">
          Avez-vous bien vérifié que le nom de la base de données est défini avec NEW dans les
          modèles avant de lancer la migration ?
        </p>

        <p className="text-red-500 font-bold mb-2">Incorrect :</p>
        <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto">
          <code className="text-sm block mb-4">
            {`export const AttendanceNEW =
  models?.Attendance || model('Attendance', attendanceNEWSchema)`}
          </code>
        </pre>

        <p className="text-green-500 font-bold my-2">Correct :</p>
        <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto">
          <code className="text-sm block">
            {`export const AttendanceNEW =
  models?.AttendanceNEW || model('AttendanceNEW', attendanceNEWSchema)`}
          </code>
        </pre>
      </section>
      {migrationType !== '' && (
        <section
          className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <p className="text-center text-2xl font-bold mb-2">INFO</p>
          <p className="mb-2">{explainMigration[migrationType]}</p>
        </section>
      )}
      <input
        type="password"
        value={migrationSecret}
        onChange={(e) => setMigrationSecret(e.target.value)}
        placeholder="Entrez le secret de migration"
        className="border p-2 mb-4"
      />
      <select
        value={migrationType}
        onChange={(e) => setMigrationType(e.target.value)}
        className="border p-2 mb-4 w-full"
      >
        <optgroup label="CHECK">
          <option value="checkRemainingFullSessions">Remaining-Full-Sessions</option>
          <option value="checkGradesDuplicates">GRADES--01.check-duplicates</option>
        </optgroup>
        <optgroup label="STATS">
          <option value="statsGradesClean">GRADES--01.clean</option>
          <option value="statsGradesUpdate">GRADES--02.update</option>
          <option value="statsStudentCheck">STUDENTS--01.check</option>
          <option value="statsStudentUpdate">STUDENTS--02.update</option>
          <option value="statsTeacherCheck">TEACHERS--01.check</option>
          <option value="statsTeacherUpdate">TEACHERS--02.update</option>
        </optgroup>
        <optgroup label="MIGRATION">
          <option value="checkAttendances">ATTENDANCES--01.check</option>
          <option value="attendances">ATTENDANCES--02.migrate</option>
          <option value="verifyAttendances">ATTENDANCES--03.verify</option>
          <option value="checkBehaviors">BEHAVIORS--01.check</option>
          <option value="behaviors">BEHAVIORS--02.migrate</option>
          <option value="verifyBehaviors">BEHAVIORS--03.verify</option>
          <option value="checkGrades" disabled>
            GRADES-01.check
          </option>
          <option value="grades" disabled>
            GRADES--02.migrate
          </option>
          <option value="verifyGrades" disabled>
            GRADES--03.verify
          </option>
          <option value="checkStats">STATS--01.check</option>
        </optgroup>
        <optgroup label="OLD">
          <option value="checkCourses" disabled>
            Courses--CHECK
          </option>
          <option value="courses" disabled>
            Courses
          </option>
          <option value="users" disabled>
            Users
          </option>
        </optgroup>
      </select>
      <button
        onClick={runMigration}
        className="bg-green-500 hover:bg-green-700 text-white font-bolder py-2 px-4 rounded"
      >
        Run
      </button>
      {migrationStatus && <p className="mt-4 p-2 border rounded">Statut: {migrationStatus}</p>}
    </div>
  )
}
