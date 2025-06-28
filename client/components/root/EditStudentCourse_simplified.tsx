function handleTimeSlotChange(value: TimeSlotEnum) {
  setSelectedTimeSlot(value)
  form.setValue('timeSlot', value)

  const timeSlotConfig = initialData.timeSlotConfigs.find((config) => config.id === value)
  if (timeSlotConfig) {
    const initialSelections = timeSlotConfig.sessions.map((_session) => ({
      dayOfWeek: value,
      subject: '' as SubjectNameEnum,
      teacherId: '',
      startTime: _session.startTime,
      endTime: _session.endTime,
    }))

    form.setValue('selections', initialSelections)
  }
}

// Fonction simplifiée : reset seulement le teacherId quand on change de matière
function handleSubjectChange(index: number) {
  form.setValue(`selections.${index}.teacherId`, '')
}

// Fonction simplifiée : react-hook-form gère déjà tout le reste
function handleTeacherChange(index: number) {
  // Pas besoin de logique supplémentaire
  // react-hook-form gère automatiquement la mise à jour
}
