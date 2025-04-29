'use client'

import {useState} from 'react'

import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'

interface Discrepancy {
  field: string
  jsonValue: any
  dbValue: any
}

interface TeacherInfo {
  id: string
  name: string
}

interface MatchingStudent {
  id: string
  firstname: string
  lastname: string
  email: string
  teacher?: TeacherInfo
  discrepancies: Discrepancy[]
}

interface DatabaseOnlyStudent {
  id: string
  firstname: string
  lastname: string
  email: string
  teacher?: TeacherInfo
}

interface JsonOnlyStudent {
  firstname: string
  lastname: string
  email: string
  teacher?: string
}

interface ComparisonReport {
  dateGenerated: string
  studentsInJson: number
  studentsInDatabase: number
  matchingStudents: MatchingStudent[]
  onlyInDatabase: DatabaseOnlyStudent[]
  onlyInJson: JsonOnlyStudent[]
}

interface ComparisonSummary {
  totalInJson: number
  totalInDatabase: number
  matching: number
  onlyInJson: number
  onlyInDatabase: number
}

export default function CompareStudentsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportPath, setReportPath] = useState<string | null>(null)
  const [summary, setSummary] = useState<ComparisonSummary | null>(null)
  const [report, setReport] = useState<ComparisonReport | null>(null)
  const [activeTab, setActiveTab] = useState('summary')

  const runComparison = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/compare-students', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      setReportPath(data.reportPath)
      setSummary(data.summary)

      // Le rapport est maintenant directement inclus dans la réponse
      if (data.report) {
        setReport(data.report)
      }
    } catch (err) {
      setError(`Erreur lors de la comparaison: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Comparaison des étudiants</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lancer la comparaison</CardTitle>
          <CardDescription>
            Compare les étudiants du fichier JSON avec ceux de la base de données et génère un
            rapport détaillé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runComparison} disabled={loading} size="lg" className="w-full">
            {loading ? 'Comparaison en cours...' : 'Lancer la comparaison'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {report && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="matching">
              Correspondances ({report.matchingStudents.length})
            </TabsTrigger>
            <TabsTrigger value="database-only">
              Uniquement en base ({report.onlyInDatabase.length})
            </TabsTrigger>
            <TabsTrigger value="json-only">
              Uniquement dans JSON ({report.onlyInJson.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la comparaison</CardTitle>
                <CardDescription>
                  Rapport généré le {new Date(report.dateGenerated).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Base de données</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{report.studentsInDatabase}</p>
                      <p className="text-muted-foreground">étudiants</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Fichier JSON</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{report.studentsInJson}</p>
                      <p className="text-muted-foreground">étudiants</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Correspondances</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{report.matchingStudents.length}</p>
                      <p className="text-sm text-muted-foreground">
                        étudiants présents dans les deux sources
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Uniquement en base</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-amber-600">
                        {report.onlyInDatabase.length}
                      </p>
                      <p className="text-sm text-muted-foreground">à supprimer potentiellement</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Uniquement dans JSON</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-emerald-600">
                        {report.onlyInJson.length}
                      </p>
                      <p className="text-sm text-muted-foreground">à ajouter potentiellement</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-muted-foreground text-sm">
                  Le rapport complet est enregistré dans le dossier <code>reports</code> sous le nom{' '}
                  <code>{reportPath?.split('/').pop()}</code>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="matching">
            <Card>
              <CardHeader>
                <CardTitle>Étudiants correspondants ({report.matchingStudents.length})</CardTitle>
                <CardDescription>
                  Étudiants présents à la fois dans la base de données et dans le fichier JSON
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Professeur</TableHead>
                      <TableHead>Divergences</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.matchingStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-xs">{student.id}</TableCell>
                        <TableCell>{student.lastname}</TableCell>
                        <TableCell>{student.firstname}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.teacher?.name || 'Non assigné'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={student.discrepancies.length > 0 ? 'destructive' : 'default'}
                          >
                            {student.discrepancies.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.discrepancies.length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer">Voir les divergences</summary>
                              <ul className="list-disc pl-5 mt-2">
                                {student.discrepancies.map((discrepancy, idx) => (
                                  <li key={idx} className="mb-1">
                                    <span className="font-semibold">{discrepancy.field}:</span>
                                    <span className="text-red-500 line-through ml-1">
                                      {discrepancy.dbValue || '(vide)'}
                                    </span>
                                    <span className="text-green-500 ml-1">
                                      → {discrepancy.jsonValue || '(vide)'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database-only">
            <Card>
              <CardHeader>
                <CardTitle>
                  Étudiants uniquement en base de données ({report.onlyInDatabase.length})
                </CardTitle>
                <CardDescription>
                  Ces étudiants existent en base mais pas dans le fichier JSON (à supprimer
                  potentiellement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Professeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.onlyInDatabase.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-xs">{student.id}</TableCell>
                        <TableCell>{student.lastname}</TableCell>
                        <TableCell>{student.firstname}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.teacher?.name || 'Non assigné'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json-only">
            <Card>
              <CardHeader>
                <CardTitle>
                  Étudiants uniquement dans le fichier JSON ({report.onlyInJson.length})
                </CardTitle>
                <CardDescription>
                  Ces étudiants existent dans le fichier JSON mais pas en base (à ajouter
                  potentiellement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Professeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.onlyInJson.map((student, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{student.lastname}</TableCell>
                        <TableCell>{student.firstname}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.teacher || 'Non spécifié'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
