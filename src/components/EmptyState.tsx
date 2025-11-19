interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = "📋",
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {actionLabel}
            </a>
          ) : (
            <button
              onClick={onAction}
              className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}
