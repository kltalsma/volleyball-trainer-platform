"use client"

import { useRef, useEffect } from "react"

interface Point {
  x: number
  y: number
}

interface DrawingElement {
  type: "line" | "arrow" | "circle" | "player"
  points: Point[]
  color: string
  label?: string
}

interface DiagramViewerProps {
  diagram: string
}

export default function DiagramViewer({ diagram }: DiagramViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !diagram) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Load court image
    const img = new Image()
    img.src = "/volleyball-court.jpg"
    img.onload = () => {
      // Draw court
      ctx.drawImage(img, 0, 0, 800, 400)

      // Draw diagram elements
      try {
        const elements: DrawingElement[] = JSON.parse(diagram)
        elements.forEach(element => {
          ctx.strokeStyle = element.color
          ctx.fillStyle = element.color
          ctx.lineWidth = 3

          if (element.type === "line" && element.points.length >= 2) {
            ctx.beginPath()
            ctx.moveTo(element.points[0].x, element.points[0].y)
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y)
            }
            ctx.stroke()
          } else if (element.type === "arrow" && element.points.length >= 2) {
            const start = element.points[0]
            const end = element.points[element.points.length - 1]
            
            ctx.beginPath()
            ctx.moveTo(start.x, start.y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()
            
            const angle = Math.atan2(end.y - start.y, end.x - start.x)
            const headLength = 15
            
            ctx.beginPath()
            ctx.moveTo(end.x, end.y)
            ctx.lineTo(
              end.x - headLength * Math.cos(angle - Math.PI / 6),
              end.y - headLength * Math.sin(angle - Math.PI / 6)
            )
            ctx.moveTo(end.x, end.y)
            ctx.lineTo(
              end.x - headLength * Math.cos(angle + Math.PI / 6),
              end.y - headLength * Math.sin(angle + Math.PI / 6)
            )
            ctx.stroke()
          } else if (element.type === "circle" && element.points.length >= 2) {
            const center = element.points[0]
            const edge = element.points[element.points.length - 1]
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            )
            
            ctx.beginPath()
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
            ctx.stroke()
          } else if (element.type === "player" && element.points.length >= 1) {
            const point = element.points[0]
            
            ctx.beginPath()
            ctx.arc(point.x, point.y, 15, 0, 2 * Math.PI)
            ctx.fill()
            
            if (element.label) {
              ctx.fillStyle = "#FFFFFF"
              ctx.font = "bold 12px sans-serif"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(element.label, point.x, point.y)
            }
          }
        })
      } catch (err) {
        console.error("Failed to render diagram:", err)
      }
    }
  }, [diagram])

  if (!diagram) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
        No diagram available
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      className="border border-gray-300 rounded-lg"
    />
  )
}
