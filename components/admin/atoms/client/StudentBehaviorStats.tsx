'use client'

import {SubjectNameEnum} from '@/types/course'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

import {BehaviorStats} from '@/app/actions/admin/student-stats-behavior'
import {Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

interface StudentBehaviorStatsClientProps {
  stats: BehaviorStats
}

export function StudentBehaviorStatsClient({stats}: StudentBehaviorStatsClientProps) {
  const subjectColors: Record<SubjectNameEnum, string> = {
    [SubjectNameEnum.Arabe]: '#2563eb',
    [SubjectNameEnum.EducationCulturelle]: '#16a34a',
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Statistiques globales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-100 rounded-lg">
            <div className="text-sm text-slate-600">Note moyenne</div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.averageRating.toFixed(1)}/5
            </div>
          </div>
          <div className="text-center p-4 bg-slate-100 rounded-lg">
            <div className="text-sm text-slate-600">Sessions totales</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSessions}</div>
          </div>
          <div className="text-center p-4 bg-green-100 rounded-lg">
            <div className="text-sm text-green-600">Meilleure note</div>
            <div className="text-2xl font-bold text-green-700">{stats.bestRating}/5</div>
          </div>
          <div className="text-center p-4 bg-red-100 rounded-lg">
            <div className="text-sm text-red-600">Note la plus basse</div>
            <div className="text-2xl font-bold text-red-700">{stats.worstRating}/5</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution du comportement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{fontSize: 12}} />
                <Tooltip
                  content={({active, payload, label}) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-sm">
                            {dataPoint.subject} (Niveau {dataPoint.level})
                          </p>
                          <p className="text-sm font-bold">Note: {payload[0].value}/5</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                {stats.subjects.map((subject) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    name={subject}
                    stroke={subjectColors[subject] || '#666666'}
                    strokeWidth={2}
                    dot={{
                      fill: subjectColors[subject] || '#666666',
                      r: 4,
                    }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
