import MessageForm from './MessageForm'

export default function TempSocketioPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-4">Test envoi message (NestJS + JWT)</h1>
      <MessageForm />
    </div>
  )
}
