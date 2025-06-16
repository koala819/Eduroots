const StudentAvatar = ({ initials }: {initials: string}) => {
  return (
    <div className="flex items-center justify-center w-full
    h-full bg-indigo-50 text-indigo-600 font-bold rounded-full">
      {initials}
    </div>
  )
}

export default StudentAvatar
