import {getToken} from 'next-auth/jwt'
import {NextResponse} from 'next/server'

import {GET} from '@/app/api/stats/cloudinary/route'
import cloudinary from '@/lib/cloudinary'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn().mockResolvedValue({
    user: {_id: 'mockUserId', role: 'mockRole'},
  }),
}))
jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  default: {
    api: {
      usage: jest.fn(),
    },
  },
}))

describe('GET /api/stats/cloudinary', () => {
  let mockRequest: {url: string}

  beforeEach(() => {
    jest.resetAllMocks()

    mockRequest = {
      url: 'http://example.com/api/stats/cloudinary',
    }
  })

  it('should return cloudinary stats successfully if authenticated', async () => {
    const mockStats = {
      usage: {
        storage: {
          used: 12345,
          limit: 100000,
        },
      },
    }
    ;(getToken as jest.Mock).mockResolvedValue({
      user: {_id: 'mockUserId', role: 'mockRole'},
    })
    ;(cloudinary.api.usage as jest.Mock).mockResolvedValue(mockStats)

    await GET(mockRequest as any)

    expect(NextResponse.json).toHaveBeenCalledWith(mockStats, {status: 200})
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(getToken as jest.Mock).mockResolvedValue(null)

    await GET(mockRequest as any)

    expect(NextResponse.json).toHaveBeenCalledWith({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  })

  it('should return 500 if there is an error', async () => {
    const errorMessage = 'Some error'
    ;(getToken as jest.Mock).mockResolvedValue({
      user: {_id: 'mockUserId', role: 'mockRole'},
    })
    ;(cloudinary.api.usage as jest.Mock).mockRejectedValue(new Error(errorMessage))

    await GET(mockRequest as any)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {success: false, message: errorMessage},
      {status: 500},
    )
  })
})
