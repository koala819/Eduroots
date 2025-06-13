'use client'

import {Calendar, Clock, GraduationCap, Mail, User2} from 'lucide-react'
import {UseFormReturn} from 'react-hook-form'
import {BiFemale, BiMale} from 'react-icons/bi'

import {GenderEnum, User} from '@/types/user'

import {FormData} from '../../organisms/client/NewStudentForm'

import {formatDayOfWeek} from '@/utils/helpers'
import {format} from 'date-fns'
import {fr} from 'date-fns/locale'
import {motion} from 'framer-motion'

interface StepThreeProps {
  form: UseFormReturn<FormData>
  teachers: User[]
}

const StepThree = ({form, teachers}: StepThreeProps) => {
  const formValues = form.getValues()

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : ''
  }

  const fadeInUp = {
    initial: {opacity: 0, y: 20},
    animate: {opacity: 1, y: 0},
    transition: {duration: 0.5},
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <motion.div
        className="relative bg-gradient-to-br from-background via-background/95 to-background border border-border rounded-xl shadow-lg overflow-hidden"
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.6}}
      >
        {/* Header avec informations principales */}
        <div className="relative px-6 py-8 bg-gradient-to-r from-primary/5 to-primary/10">
          <motion.div className="space-y-4" {...fadeInUp}>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {formValues.firstname} {formValues.lastname}
            </h2>

            <div className="flex items-center gap-4 text-muted-foreground">
              {formValues.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(formValues.dateOfBirth), 'PPP', {
                      locale: fr,
                    })}
                  </span>
                </div>
              )}

              {formValues.gender && (
                <div className="flex items-center gap-2">
                  {formValues.gender === GenderEnum.Masculin ? (
                    <div className="flex items-center gap-1 text-blue-500">
                      <BiMale className="h-5 w-5" />
                      <span className="text-sm font-medium">Masculin</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-pink-500">
                      <BiFemale className="h-5 w-5" />
                      <span className="text-sm font-medium">Féminin</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Contenu principal */}
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Section Contacts */}
          <motion.div
            className="space-y-6"
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.2}}
          >
            <div className="flex items-center gap-2 text-lg font-medium text-primary">
              <Mail className="w-5 h-5" />
              <h3>Contacts</h3>
            </div>
            <div className="space-y-4">
              <motion.div
                className="group p-4 bg-primary/5 rounded-lg transition-all hover:bg-primary/10"
                whileHover={{scale: 1.02}}
              >
                <div className="flex items-start gap-4">
                  <User2 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">Parent 1</div>
                    <div className="text-sm text-muted-foreground">{formValues.parentEmail1}</div>
                  </div>
                </div>
              </motion.div>

              {formValues.parentEmail2 && (
                <motion.div
                  className="group p-4 bg-primary/5 rounded-lg transition-all hover:bg-primary/10"
                  whileHover={{scale: 1.02}}
                >
                  <div className="flex items-start gap-4">
                    <User2 className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div className="font-medium">Parent 2</div>
                      <div className="text-sm text-muted-foreground">{formValues.parentEmail2}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Section Emploi du temps */}
          <motion.div
            className="space-y-6"
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.3}}
          >
            <div className="flex items-center gap-2 text-lg font-medium text-primary">
              <Calendar className="w-5 h-5" />
              <h3>{formatDayOfWeek(formValues.timeSlot)}</h3>
            </div>
            <div className="space-y-4">
              {formValues.selections?.map((selection, index) => (
                <motion.div
                  key={index}
                  className="relative p-4 bg-primary/5 rounded-lg transition-all hover:bg-primary/10"
                  initial={{opacity: 0, y: 20}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: 0.4 + index * 0.1}}
                  whileHover={{scale: 1.02}}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {selection.startTime} - {selection.endTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selection.subject}</div>
                        {selection.teacherId && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {getTeacherName(selection.teacherId)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="p-6 border-t border-border bg-gradient-to-b from-background to-primary/5"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{delay: 0.5}}
        >
          <div className="text-sm text-muted-foreground text-center">
            Vérifiez les informations ci-dessus avant de valider l&apos;inscription
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default StepThree
