// Add this to your types folder, e.g., @/types/api.ts

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T | null
  error?: string
}

// Then you can use it in your server actions like:
// export async function getAttendanceById(...): Promise<ApiResponse<AttendanceDocument | AttendanceDocument[]>> {
//   ...
// }
