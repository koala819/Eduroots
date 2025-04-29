import {bufferToStream} from './bufferToStream'

import cloudinary from '@/lib/cloudinary'

export async function uploadToCloudinary(file: Blob, fileName: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const buffer = Buffer.from(await file.arrayBuffer())
  const stream = bufferToStream(buffer)

  const fileBaseName = fileName.substring(0, fileName.lastIndexOf('.'))
  const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1)
  const resourceType =
    fileExtension.toLowerCase() === 'pdf' || fileExtension.toLowerCase() === 'doc' ? 'raw' : 'auto'

  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: `${currentYear}`,
          public_id: `${fileBaseName}`,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            if (result) {
              let secureUrl = result.secure_url
              if (fileExtension.toLowerCase() === 'pdf') {
                secureUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto/')
              }
              resolve(secureUrl)
            }
          }
        },
      )
      stream.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Cloudinary upload failed')
  }
}
