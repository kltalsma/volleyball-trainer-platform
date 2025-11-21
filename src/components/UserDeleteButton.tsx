'use client'

interface UserDeleteButtonProps {
  userName: string
  deleteAction: () => Promise<void>
}

export function UserDeleteButton({ 
  userName,
  deleteAction
}: UserDeleteButtonProps) {
  const handleClick = (e: React.FormEvent) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      e.preventDefault()
    }
  }

  return (
    <form action={deleteAction} onSubmit={handleClick}>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete User
      </button>
    </form>
  )
}