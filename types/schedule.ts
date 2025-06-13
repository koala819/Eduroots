// Interface de base
export interface ScheduleConfig {
  academicYear: string
  // daySchedules: Map<string, DaySchedule> // Changed from Record to Map
  isActive: boolean
  // updatedBy: Types.ObjectId
  createdAt?: Date // Ajouté car tu as timestamps: true
  updatedAt?: Date // Ajouté car tu as timestamps: true
}

// Interface pour le document Mongoose
// export interface ScheduleConfigDocument extends Document, ScheduleConfig {}
