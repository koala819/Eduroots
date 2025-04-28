import { Readable } from 'stream'

export function bufferToStream(buffer: Buffer) {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}
