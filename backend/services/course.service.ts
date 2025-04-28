import type {
  CourseSession,
  CourseSessionModel,
  Course as CourseType,
  PopulatedCourse,
  TimeSlot,
} from '@/types/course'
import type { Student } from '@/types/user'

import { Course } from '@/backend/models/course.model'
import { User } from '@/backend/models/user.model'
import { Types } from 'mongoose'

export async function addStudent(
  courseId: string,
  studentId: string,
): Promise<PopulatedCourse> {
  const course = await Course.findById(courseId)
  if (!course) {
    throw new Error('Course not found')
  }

  course.sessions.forEach((session: CourseSessionModel) => {
    session.students.push(new Types.ObjectId(studentId))
  })

  await course.save()
  return course.populate(['teacher', 'sessions.students'])
}

export async function checkTimeSlotOverlap(
  timeSlot: TimeSlot,
  excludeCourseId?: string,
): Promise<boolean> {
  const query: any = {
    isActive: true,
    'sessions.timeSlot.dayOfWeek': timeSlot.dayOfWeek,
    'sessions.timeSlot.startTime': { $lt: timeSlot.endTime },
    'sessions.timeSlot.endTime': { $gt: timeSlot.startTime },
  }

  if (excludeCourseId) {
    query._id = { $ne: new Types.ObjectId(excludeCourseId) }
  }

  const overlappingCourse = await Course.findOne(query)
  return !!overlappingCourse
}

export async function create(
  courseData: Partial<CourseType>,
): Promise<PopulatedCourse[]> {
  const course = new Course(courseData)
  await course.save()
  return course.populate(['teacher', 'sessions.students'])
}

export async function deleteCourse(id: string) {
  const course = await Course.findByIdAndUpdate(
    id,
    {
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
    { new: true },
  )

  if (!course) {
    throw new Error('Course not found')
  }

  return course
}

export async function findAll(filter: any = { isActive: true }) {
  return Course.find(filter)
    .populate('teacher')
    .populate('sessions.students')
    .exec()
}

export async function findById(id: string) {
  const course = await Course.findById(id)
    .populate('teacher')
    .populate('sessions.students')
    .exec()

  if (!course) {
    throw new Error('Course not found')
  }

  return course
}

export async function findByStudent(studentId: string) {
  return Course.find({
    'sessions.students': studentId,
    isActive: true,
  })
    .populate('teacher')
    .populate('sessions.students')
    .exec()
}

export async function findByTeacher(teacherId: string) {
  return Course.find({
    teacher: teacherId,
    isActive: true,
  })
    .populate('sessions.students')
    .exec()
}

export async function findStudentsWithoutActiveCourse(): Promise<Student[]> {
  const allStudents = await User.find({ role: 'student' })
  const studentsInCourses = await Course.distinct('sessions.students', {
    isActive: true,
    academicYear: new Date().getFullYear().toString(),
  })

  return allStudents.filter(
    (student) =>
      !studentsInCourses.some((id) => id.toString() === student._id.toString()),
  )
}

export async function removeStudent(courseId: string, studentId: string) {
  const course = await Course.findById(courseId)
  if (!course) {
    throw new Error('Course not found')
  }

  course.sessions.forEach((session: CourseSession) => {
    session.students = session.students.filter(
      (student) => student.toString() !== studentId,
    )
  })

  await course.save()
  return course.populate(['teacher', 'sessions.students'])
}

export async function update(id: string, courseData: Partial<CourseType>) {
  const course = await Course.findByIdAndUpdate(
    id,
    { ...courseData, updatedAt: new Date() },
    { new: true },
  )

  if (!course) {
    throw new Error('Course not found')
  }

  return course.populate(['teacher', 'sessions.students'])
}

export async function updateSession(
  courseId: string,
  sessionIndex: number,
  sessionData: Partial<CourseType['sessions'][0]>,
) {
  const course = await Course.findById(courseId)
  if (!course) {
    throw new Error('Course not found')
  }

  if (sessionIndex >= course.sessions.length) {
    throw new Error('Session not found')
  }

  Object.assign(course.sessions[sessionIndex], sessionData)
  await course.save()
  return course.populate(['teacher', 'sessions.students'])
}
