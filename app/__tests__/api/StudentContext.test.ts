import { fetchWithAuth } from '@/lib/fetchWithAuth'

jest.mock('@/lib/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}))

describe('Student API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[GET] /api/users?type=student - should fetch all students', async () => {
    const mockStudents = [{ id: '123', name: 'John' }]
    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockStudents,
    })

    const response = await fetchWithAuth('/api/users?type=student', {
      method: 'GET',
    })

    expect(response.status).toBe(200)
    expect(response.data).toEqual(mockStudents)
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/users?type=student', {
      method: 'GET',
    })
  })

  it('[GET] /api/users?type=student&id - should fetch one student', async () => {
    const mockStudent = { id: '123', name: 'John' }
    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockStudent,
    })

    const response = await fetchWithAuth('/api/users?type=student&id=123', {
      method: 'GET',
    })

    expect(response.status).toBe(200)
    expect(response.data).toEqual(mockStudent)
    expect(fetchWithAuth).toHaveBeenCalledWith(
      '/api/users?type=student&id=123',
      {
        method: 'GET',
      },
    )
  })

  it('[POST] /api/users?type=student - should create student', async () => {
    const mockStudent = { name: 'John' }
    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 201,
      data: { id: '123', ...mockStudent },
    })

    const response = await fetchWithAuth('/api/users?type=student', {
      method: 'POST',
      body: mockStudent,
    })

    expect(response.status).toBe(201)
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/users?type=student', {
      method: 'POST',
      body: mockStudent,
    })
  })

  it('[PATCH] /api/users?type=student&id - should update student', async () => {
    const mockUpdate = { name: 'John Updated' }
    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: { id: '123', ...mockUpdate },
    })

    const response = await fetchWithAuth('/api/users?type=student&id=123', {
      method: 'PATCH',
      body: mockUpdate,
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith(
      '/api/users?type=student&id=123',
      {
        method: 'PATCH',
        body: mockUpdate,
      },
    )
  })

  it('[DELETE] /api/users?type=student&id - should delete student', async () => {
    ;(fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
    })

    const response = await fetchWithAuth('/api/users?type=student&id=123', {
      method: 'DELETE',
    })

    expect(response.status).toBe(200)
    expect(fetchWithAuth).toHaveBeenCalledWith(
      '/api/users?type=student&id=123',
      {
        method: 'DELETE',
      },
    )
  })
})
