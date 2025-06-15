import { GradeStats } from './grade'
import { Holiday } from './holidays'
import { Student, Teacher } from './user'

import { Document } from 'mongoose'

// Base document type
export interface MongooseDocument extends Document {
  _id: Types.ObjectId
}

// Student related documents
export interface StudentDocument extends Omit<Student, 'id'>, MongooseDocument {
  _id: Types.ObjectId
}

// Teacher related documents
export interface TeacherDocument extends Omit<Teacher, 'id'>, MongooseDocument {
  _id: Types.ObjectId
}

// Behavior document
export interface BehaviorDocument extends Omit<Behavior, 'id'>, MongooseDocument {
  _id: Types.ObjectId
}

export interface AttendanceDocument extends Omit<Attendance, 'id'>, MongooseDocument {
  _id: Types.ObjectId
}

export interface CourseDocument extends Omit<Course, 'id'>, MongooseDocument {
  _id: Types.ObjectId
  updateStats: () => Promise<void>
  teacher: (Types.ObjectId | {_id: Types.ObjectId} | string)[]
}

export interface GradeDocument extends Omit<Grade, 'id'>, MongooseDocument {
  _id: Types.ObjectId
  stats: GradeStats
}

export interface EntityStatsDocument extends Omit<EntityStats, 'id'>, MongooseDocument {
  _id: Types.ObjectId
}

export interface GlobalStatsDocument extends Omit<EntityStats, 'id'>, MongooseDocument {
  _id: Types.ObjectId
}

// Document interface
export interface ScheduleConfigDocument extends Omit<ScheduleConfig, 'id'>, Document {
  _id: Types.ObjectId
  daySchedules: Map<string, DaySchedule>
}

// Model interface avec les méthodes de query de Mongoose
export interface ScheduleConfigModel extends Model<ScheduleConfigDocument> {
  findOne: Model<ScheduleConfigDocument>['findOne']
  find: Model<ScheduleConfigDocument>['find']
  create: Model<ScheduleConfigDocument>['create']
  findOneAndUpdate: Model<ScheduleConfigDocument>['findOneAndUpdate ']
  // Ajoute d'autres méthodes si tu en as besoin
}

// Document interface
export interface HolidayScheduleDocument extends Document {
  _id: Types.ObjectId
  academicYear: string
  holidays: Holiday[]
  isActive: boolean
  updatedBy: Types.ObjectId
}

// Model interface avec les méthodes de query de Mongoose
export interface HolidayScheduleModel extends Model<HolidayScheduleDocument> {
  findOne: Model<HolidayScheduleDocument>['findOne']
  find: Model<HolidayScheduleDocument>['find']
  create: Model<HolidayScheduleDocument>['create']
  findOneAndUpdate: Model<HolidayScheduleDocument>['findOneAndUpdate']
}
