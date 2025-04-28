import React from 'react'

import { Metadata } from 'next'

import { CourseDisplay } from '@/components/molecules/client/CourseDisplay'

export const metadata: Metadata = {
  title: 'Gestion des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/teacher/classroom`,
  },
}

const ClassroomPage = () => {
  return <CourseDisplay />
}

export default ClassroomPage
