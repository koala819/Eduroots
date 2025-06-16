export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T | null
  error?: string
}
