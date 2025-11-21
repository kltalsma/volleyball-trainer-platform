'use client'

interface UserDeleteButtonProps {
  userId: string
  userName: string | null
  userEmail: string
  currentUserId: string
}

export default function UserDeleteButton({ 
  userId, 
  userName, 
  userEmail, 
  currentUserId 
}: UserDeleteButtonProps) {
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete user ${userName || userEmail}?`)) {
      // TODO: Implement delete functionality
      alert('Delete functionality will be implemented')
    }
  }

  // Don't show delete button for current user
  if (userId === currentUserId) {
    return null
  }

  return (
    <button
      type="button"
      className="text-red-600 hover:text-red-900 transition-colors"
      onClick={handleDelete}
    >
      Delete
    </button>
  )
}