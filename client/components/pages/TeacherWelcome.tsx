'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

import DashboardCard from '@/client/components/atoms/TeacherDashBoardCard'
import { Card } from '@/client/components/ui/card'

interface TeacherWelcomeProps {
  user: {
    firstname: string
    lastname: string
  }
}

export function TeacherWelcome({ user }: Readonly<TeacherWelcomeProps>) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-background to-background/80"
    >
      <div className="max-w-7xl mx-auto">
        {/* Hero Image Section */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border border-border/30 shadow-lg mb-12
            hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/90
                z-10 backdrop-blur-sm" />
              <Image
                src="https://images.unsplash.com/photo-1629273229664-11fabc0becc0?q=80&w=2062"
                alt="Teaching"
                fill
                priority
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center p-6
              text-center z-20">
                <div className="max-w-2xl">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4"
                  >
                  Bienvenue {user.firstname} {user.lastname} dans votre espace enseignant
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-primary-foreground/90 text-lg md:text-xl"
                  >
                  Retrouvez tous vos outils pédagogiques en un seul endroit
                  </motion.p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Cards Grid avec Suspense */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants}>
            <DashboardCard
              icon="BookOpen"
              title="Mes cours"
              description="Consultez vos cours et gérez votre planning d'enseignement"
              href="/teacher/classroom"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardCard
              icon="Users"
              title="Mes élèves"
              description="Suivez la progression des élèves et gérez vos classes"
              href="/teacher/profiles/classroom"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardCard
              icon="UserCog"
              title="Mon profil"
              description="Personnalisez votre profil et accédez à vos paramètres"
              href="/teacher/profiles"
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
