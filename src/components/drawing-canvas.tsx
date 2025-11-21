"use client"

import { useRef, useState, useEffect, useCallback } from "react"

interface Point {
  x: number
  y: number
}

interface DrawingElement {
  type: "line" | "arrow" | "circle" | "player" | "volleyball" | "pylon" | "net" | "target" | "bench"
  points: Point[]
  color: string
  label?: string
}

interface DrawingCanvasProps {
  onChange: (diagram: string) => void
  initialDiagram?: string
}

export default function DrawingCanvas({ onChange, initialDiagram }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onChangeRef = useRef(onChange)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<"line" | "arrow" | "circle" | "player">("line")
  const [color, setColor] = useState("#3B82F6")
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [courtImage, setCourtImage] = useState<HTMLImageElement | null>(null)
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Canvas dimensions
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400

  // Load court image
  useEffect(() => {
    const img = new Image()
    img.src = "/volleyball-court.jpg"
    img.onload = () => {
      setCourtImage(img)
    }
  }, [])

  // Load initial diagram only once
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (initialDiagram && !isInitialized) {
      try {
        const parsed = JSON.parse(initialDiagram)
        setElements(parsed)
        setIsInitialized(true)
      } catch (err) {
        console.error("Failed to parse initial diagram:", err)
        setIsInitialized(true)
      }
    }
  }, [initialDiagram, isInitialized])

  useEffect(() => {
    drawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, currentPoints, courtImage])

  // Only notify parent when elements actually change (skip initial load)
  useEffect(() => {
    if (isInitialized || elements.length > 0) {
      onChangeRef.current(JSON.stringify(elements))
    }
  }, [elements, isInitialized])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw court image as background
    if (courtImage) {
      ctx.drawImage(courtImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    } else {
      // Fallback: simple court background if image not loaded
      ctx.fillStyle = "#E8F4F8"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Draw all elements
    elements.forEach(element => {
      drawElement(ctx, element)
    })

    // Draw current drawing
    if (currentPoints.length > 0) {
      const tempElement: DrawingElement = {
        type: tool,
        points: currentPoints,
        color: color
      }
      drawElement(ctx, tempElement)
    }
  }

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color
    ctx.fillStyle = element.color
    ctx.lineWidth = 3

    if (element.type === "line") {
      if (element.points.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(element.points[0].x, element.points[0].y)
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y)
        }
        ctx.stroke()
      }
    } else if (element.type === "arrow") {
      if (element.points.length >= 2) {
        const start = element.points[0]
        const end = element.points[element.points.length - 1]
        
        // Draw line
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        
        // Draw arrowhead
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
      }
    } else if (element.type === "circle") {
      if (element.points.length >= 2) {
        const center = element.points[0]
        const edge = element.points[element.points.length - 1]
        const radius = Math.sqrt(
          Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
        )
        
        ctx.beginPath()
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
    } else if (element.type === "player") {
      if (element.points.length >= 1) {
        const point = element.points[0]
        const radius = 15
        
        // Draw circle for player
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw label if exists
        if (element.label) {
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "bold 12px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(element.label, point.x, point.y)
        }
      }
    }
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    setIsDrawing(true)
    setCurrentPoints([pos])
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const pos = getMousePos(e)
    
    if (tool === "line") {
      setCurrentPoints([...currentPoints, pos])
    } else {
      setCurrentPoints([currentPoints[0], pos])
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const pos = getMousePos(e)
    let finalPoints = currentPoints

    if (tool !== "line") {
      finalPoints = [currentPoints[0], pos]
    }

    if (finalPoints.length > 0) {
      const newElement: DrawingElement = {
        type: tool,
        points: finalPoints,
        color: color,
        label: tool === "player" ? String(elements.filter(e => e.type === "player").length + 1) : undefined
      }
      
      setElements([...elements, newElement])
    }

    setIsDrawing(false)
    setCurrentPoints([])
  }

  const handleClear = () => {
    setElements([])
  }

  const handleUndo = () => {
    if (elements.length > 0) {
      setElements(elements.slice(0, -1))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTool("player")}
            className={`px-3 py-2 rounded border ${
              tool === "player" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            👤 Player
          </button>
          <button
            type="button"
            onClick={() => setTool("arrow")}
            className={`px-3 py-2 rounded border ${
              tool === "arrow" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            → Arrow
          </button>
          <button
            type="button"
            onClick={() => setTool("line")}
            className={`px-3 py-2 rounded border ${
              tool === "line" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            ✏️ Line
          </button>
          <button
            type="button"
            onClick={() => setTool("circle")}
            className={`px-3 py-2 rounded border ${
              tool === "circle" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            ⭕ Circle
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-16 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleUndo}
            disabled={elements.length === 0}
            className="px-3 py-2 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={elements.length === 0}
            className="px-3 py-2 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDrawing) {
              setIsDrawing(false)
              setCurrentPoints([])
            }
          }}
          className="cursor-crosshair"
        />
      </div>

      <p className="text-sm text-gray-600">
        Click and drag to draw on the volleyball court. Use the tools to add players, movement arrows, lines, and circles.
      </p>
    </div>
  )
}
