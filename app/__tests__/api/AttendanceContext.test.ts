import {fetchWithAuth} from '../../../lib/fetchWithAuth'

jest.mock('../../../lib/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}))

describe('Attendance API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // it('countStudentAbsences() - should correctly count absences for a student', () => {
  //   const mockAttendanceRecords = [
  //     { id: '1', student: { id: '123' }, isPresent: false },
  //     { id: '2', student: { id: '123' }, isPresent: true },
  //     { id: '3', student: { id: '123' }, isPresent: false },
  //     { id: '4', student: { id: '456' }, isPresent: false }, // autre étudiant
  //   ]

  //   const studentId = '123'
  //   const absenceCount = mockAttendanceRecords.filter(
  //     (record) =>
  //       (typeof record.student === 'string'
  //         ? record.student
  //         : record.student.id) === studentId && !record.isPresent,
  //   ).length

  //   expect(absenceCount).toBe(2)
  // })

  it('createAttendanceRecord() : [POST] /api/attendance - should create new attendance record', async () => {
    const mockData = {id: '1', isPresent: true}
    const newAttendance = {
      studentId: '123',
      sessionId: '456',
      date: new Date('2024-10-24'),
      isPresent: true,
    }

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockData,
    })

    const response = await fetchWithAuth('/api/attendance', {
      method: 'POST',
      body: newAttendance,
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/attendance', {
      method: 'POST',
      body: newAttendance,
    })
  })

  it('deleteAttendanceRecord() : [DELETE] /api/attendance/:id - should delete attendance record', async () => {
    const recordId = '123'

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {success: true},
    })

    const response = await fetchWithAuth(`/api/attendance/${recordId}`, {
      method: 'DELETE',
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith(`/api/attendance/${recordId}`, {
      method: 'DELETE',
    })
  })

  it('fetchAttendanceCheck() : [GET] /api/attendance/check - should check attendance for session', async () => {
    const teacherId = '123'
    const sessionId = '456'
    const mockCheckData = {
      checkedAttendances: [],
      foundWorkingSession: {
        id: sessionId,
        date: new Date(),
        title: 'Test Session',
      },
    }

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockCheckData,
    })

    const response = await fetchWithAuth(
      `/api/attendance/check?teacherId=${teacherId}&sessionId=${sessionId}`,
      {method: 'GET'},
    )

    expect(response.status).toBe(200)
    expect(response.data).toEqual(mockCheckData)
    expect(fetchWithAuth).toHaveBeenCalledWith(
      `/api/attendance/check?teacherId=${teacherId}&sessionId=${sessionId}`,
      {method: 'GET'},
    )
  })

  it('getStudentAttendanceHistory() : [GET] /api/attendance/student/:id - should fetch student attendance history', async () => {
    const studentId = '123'
    const mockHistory = [
      {id: '1', date: '2024-01-01', isPresent: true},
      {id: '2', date: '2024-01-02', isPresent: false},
    ]

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockHistory,
    })

    const response = await fetchWithAuth(`/api/attendance/student/${studentId}`, {
      method: 'GET',
    })

    expect(response.status).toBe(200)
    expect(response.data).toEqual(mockHistory)
    expect(fetchWithAuth).toHaveBeenCalledWith(`/api/attendance/student/${studentId}`, {
      method: 'GET',
    })
  })

  it('refreshAttendanceData() : [GET] /api/attendance - should fetch all attendance records', async () => {
    const mockData = [{id: '1', isPresent: true}]
    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockData,
    })

    const response = await fetchWithAuth('/api/attendance', {method: 'GET'})
    expect(response.status).toBe(200)
    expect(response.data).toEqual(mockData)
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/attendance', {
      method: 'GET',
    })
  })

  it('refreshAttendanceData() : [GET] /api/attendance/duplicates - should fetch duplicate records', async () => {
    const mockDuplicates = [
      {
        date: '2024-01-01',
        studentId: '123',
        count: 2,
        records: ['id1', 'id2'],
      },
    ]

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockDuplicates,
    })

    const response = await fetchWithAuth('/api/attendance/duplicates', {
      method: 'GET',
    })

    expect(response.status).toBe(200)
    expect(response.data).toEqual(mockDuplicates)
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/attendance/duplicates', {
      method: 'GET',
    })
  })

  it('restoreAttendance() : [PUT] /api/attendance/:id/restore - should restore soft deleted attendance', async () => {
    const recordId = '123'

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {id: recordId, isActive: true},
    })

    const response = await fetchWithAuth(`/api/attendance/${recordId}/restore`, {
      method: 'PUT',
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith(`/api/attendance/${recordId}/restore`, {
      method: 'PUT',
    })
  })

  it('softDeleteAttendance() : [PUT] /api/attendance/:id/soft-delete - should soft delete attendance', async () => {
    const recordId = '123'

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {id: recordId, isActive: false},
    })

    const response = await fetchWithAuth(`/api/attendance/${recordId}/soft-delete`, {
      method: 'PUT',
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith(`/api/attendance/${recordId}/soft-delete`, {
      method: 'PUT',
    })
  })

  it('updateAttendanceRecord() : [PUT] /api/attendance/:id - should update attendance record', async () => {
    const recordId = '123'
    const updateData = {isPresent: false}

    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {id: recordId, ...updateData},
    })

    const response = await fetchWithAuth(`/api/attendance/${recordId}`, {
      method: 'PUT',
      body: updateData,
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith(`/api/attendance/${recordId}`, {
      method: 'PUT',
      body: updateData,
    })
  })

  // it('[GET] /api/attendance/stats - should fetch attendance statistics', async () => {
  //   const mockStats = {
  //     totalStudents: 50,
  //     averageAttendance: 85,
  //   }

  //   ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
  //     status: 200,
  //     data: mockStats,
  //   })

  //   const response = await fetchWithAuth('/api/attendance/stats', {
  //     method: 'GET',
  //   })

  //   expect(response.status).toBe(200)
  //   expect(response.data).toEqual(mockStats)
  //   expect(fetchWithAuth).toHaveBeenCalledWith('/api/attendance/stats', {
  //     method: 'GET',
  //   })
  // })

  it('should handle errors for any attendance operation', async () => {
    const error = new Error('Network error')
    ;(fetchWithAuth as jest.Mock).mockRejectedValueOnce(error)

    try {
      await fetchWithAuth('/api/attendance', {method: 'GET'})
    } catch (e) {
      expect(e).toEqual(error)
    }

    expect(fetchWithAuth).toHaveBeenCalledWith('/api/attendance', {
      method: 'GET',
    })
  })
})
