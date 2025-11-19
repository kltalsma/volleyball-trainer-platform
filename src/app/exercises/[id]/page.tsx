import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import DiagramViewer from "@/components/diagram-viewer"
import AddToTrainingButton from "@/components/add-to-training-button"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect("/login")
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      sport: true,
      category: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!exercise) {
    notFound()
  }

  console.log("Exercise data:", {
    id: exercise.id,
    title: exercise.title,
    description: exercise.description,
    category: exercise.category?.name,
    duration: exercise.duration,
    tags: exercise.tags,
    videoUrl: exercise.videoUrl,
    diagram: exercise.diagram ? "has diagram" : "no diagram"
  })

  // Check if user has access
  if (!exercise.isPublic && exercise.creatorId !== session.user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This exercise is private.</p>
          <Link href="/exercises" className="text-blue-600 hover:text-blue-700">
            ← Back to Exercises
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/exercises" className="text-gray-600 hover:text-gray-900">
                ← Back to Exercises
              </Link>
            </div>
            <div className="flex gap-2">
              <AddToTrainingButton 
                exerciseId={exercise.id}
                exerciseTitle={exercise.title}
                exerciseDuration={exercise.duration}
              />
              {exercise.creatorId === session.user.id && (
                <Link
                  href={`/exercises/${exercise.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8 space-y-6">
          {/* Title and Metadata */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{exercise.title}</h1>
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded ${
                  exercise.difficulty === "EASY" ? "bg-green-100 text-green-800" :
                  exercise.difficulty === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {exercise.difficulty}
                </span>
                {exercise.isPublic ? (
                  <span className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-800">
                    🌐 Public
                  </span>
                ) : (
                  <span className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-800">
                    🔒 Private
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Created by {exercise.creator.name || exercise.creator.email}</span>
              {exercise.category && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {exercise.category.name}
                </span>
              )}
              {exercise.duration && (
                <span>⏱️ {exercise.duration} minutes</span>
              )}
            </div>
          </div>

          {/* Description */}
          {exercise.description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{exercise.description}</p>
            </div>
          )}

          {/* Court Diagram */}
          {exercise.diagram && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Court Diagram</h2>
              <DiagramViewer diagram={exercise.diagram} />
            </div>
          )}

          {/* Video */}
          {exercise.videoUrl && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Video</h2>
              <a 
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                {exercise.videoUrl}
              </a>
            </div>
          )}

          {/* Tags */}
          {exercise.tags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {exercise.tags.map((tag, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
