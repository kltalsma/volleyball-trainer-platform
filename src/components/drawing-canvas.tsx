"use client"

import { useRef, useState, useEffect, useCallback } from "react"

interface DrawingCanvasProps {
  onChange: (diagram: string) => void
  initialDiagram?: string
}

type ToolType =
  | "select"
  | "player"
  | "opponent"
  | "cone"
  | "ball"
  | "net"
  | "zone"
  | "text"
  | "arrow"
  | "curved-arrow"
  | "dashed-line"
  | "line"

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 450

function serializeDiagram(frames: object[], currentFrame: number): string {
  return JSON.stringify({ frames, currentFrame })
}

export default function DrawingCanvas({ onChange, initialDiagram }: DrawingCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  const isLoadingRef = useRef(false)

  const [tool, setTool] = useState<ToolType>("select")
  const [color, setColor] = useState("#3B82F6")
  const [frames, setFrames] = useState<object[]>([{}])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [history, setHistory] = useState<object[][]>([[{}]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // Keep onChange ref current
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Initialize Fabric canvas once
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fc: any = null

    async function init() {
      const fabric = await import("fabric")
      if (!canvasElRef.current || cancelled) return

      fc = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        selection: true,
        selectionColor: "rgba(59,130,246,0.15)",
        selectionBorderColor: "#3B82F6",
        selectionLineWidth: 1,
      })
      fabricRef.current = fc

      // Court background
      fabric.FabricImage.fromURL("/volleyball-court.jpg").then((img: any) => {
        if (!fc || cancelled) return
        img.set({
          left: 0,
          top: 0,
          scaleX: CANVAS_WIDTH / (img.width || CANVAS_WIDTH),
          scaleY: CANVAS_HEIGHT / (img.height || CANVAS_HEIGHT),
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })
        fc.backgroundImage = img
        fc.renderAll()
      })

      // Load initial diagram
      if (initialDiagram) {
        try {
          const parsed = JSON.parse(initialDiagram)
          if (parsed?.frames?.length) {
            const frameIdx = parsed.currentFrame ?? 0
            const frameData = parsed.frames[frameIdx] ?? parsed.frames[0]
            isLoadingRef.current = true
            await fc.loadFromJSON(frameData)
            fc.renderAll()
            isLoadingRef.current = false
            setFrames(parsed.frames)
            setCurrentFrame(frameIdx)
            setHistory([parsed.frames])
            setHistoryIndex(0)
          }
        } catch {
          // Old format or invalid — start fresh
        }
      }

      setIsReady(true)
    }

    init()
    return () => {
      cancelled = true
      if (fc) {
        try { fc.dispose() } catch { /* ignore */ }
      }
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync tool mode
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc || !isReady) return
    fc.isDrawingMode = false
    fc.selection = tool === "select"
    fc.getObjects().forEach((obj: any) => {
      obj.selectable = tool === "select"
      obj.evented = tool === "select"
    })
    fc.defaultCursor = tool === "select" ? "default" : "crosshair"
    fc.renderAll()
  }, [tool, isReady])

  const snapshotCanvas = useCallback((): object => {
    const fc = fabricRef.current
    if (!fc) return {}
    return fc.toJSON(["excludeFromExport", "data"])
  }, [])

  const notifyParent = useCallback((newFrames: object[], frame: number) => {
    onChangeRef.current(serializeDiagram(newFrames, frame))
  }, [])

  const pushHistory = useCallback(
    (newFrames: object[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1)
        return [...trimmed, newFrames]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex]
  )

  const commitFrame = useCallback(() => {
    if (isLoadingRef.current) return
    const fc = fabricRef.current
    if (!fc) return
    const snapshot = snapshotCanvas()
    setFrames((prev) => {
      const updated = [...prev]
      updated[currentFrame] = snapshot
      pushHistory(updated)
      notifyParent(updated, currentFrame)
      return updated
    })
  }, [currentFrame, snapshotCanvas, pushHistory, notifyParent])

  // Attach fabric event listeners
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc || !isReady) return
    const onModified = () => commitFrame()
    fc.on("object:added", onModified)
    fc.on("object:modified", onModified)
    fc.on("object:removed", onModified)
    return () => {
      fc.off("object:added", onModified)
      fc.off("object:modified", onModified)
      fc.off("object:removed", onModified)
    }
  }, [isReady, commitFrame])

  // Place objects on click
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool === "select") return
      const fc = fabricRef.current
      if (!fc) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const fabric = await import("fabric")

      if (tool === "player") {
        const playerCount = fc.getObjects().filter((o: any) => o.data?.type === "player").length
        const circle = new fabric.Circle({
          radius: 18,
          fill: color,
          stroke: "#fff",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        })
        const label = new fabric.FabricText(String(playerCount + 1), {
          fontSize: 14,
          fontWeight: "bold",
          fill: "#fff",
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        })
        const group = new fabric.Group([circle, label], {
          left: x - 18,
          top: y - 18,
          data: { type: "player" },
        } as any)
        fc.add(group)
      } else if (tool === "opponent") {
        const circle = new fabric.Circle({
          radius: 18,
          fill: "transparent",
          stroke: color,
          strokeWidth: 3,
          originX: "center",
          originY: "center",
        })
        const cross1 = new fabric.Line([-12, -12, 12, 12] as [number,number,number,number], {
          stroke: color,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        })
        const cross2 = new fabric.Line([-12, 12, 12, -12] as [number,number,number,number], {
          stroke: color,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        })
        const group = new fabric.Group([circle, cross1, cross2], {
          left: x - 18,
          top: y - 18,
          data: { type: "opponent" },
        } as any)
        fc.add(group)
      } else if (tool === "cone") {
        const cone = new fabric.Path("M 0 -20 L 14 14 L -14 14 Z", {
          fill: color,
          stroke: "#000",
          strokeWidth: 1,
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          data: { type: "cone" },
        } as any)
        fc.add(cone)
      } else if (tool === "ball") {
        const ball = new fabric.Circle({
          left: x - 12,
          top: y - 12,
          radius: 12,
          fill: "#f5e642",
          stroke: "#555",
          strokeWidth: 2,
          data: { type: "ball" },
        } as any)
        fc.add(ball)
      } else if (tool === "net") {
        const netLine = new fabric.Line([x - 60, y, x + 60, y] as [number,number,number,number], {
          stroke: color,
          strokeWidth: 5,
          strokeDashArray: [8, 4],
          data: { type: "net" },
        } as any)
        fc.add(netLine)
      } else if (tool === "zone") {
        const zone = new fabric.Rect({
          left: x - 50,
          top: y - 30,
          width: 100,
          height: 60,
          fill: color + "33",
          stroke: color,
          strokeWidth: 2,
          data: { type: "zone" },
        } as any)
        fc.add(zone)
      } else if (tool === "text") {
        const text = new fabric.FabricText("Label", {
          left: x,
          top: y,
          fontSize: 16,
          fontWeight: "bold",
          fill: color,
          data: { type: "text" },
        } as any)
        fc.add(text)
        fc.setActiveObject(text)
      } else if (tool === "line") {
        const line = new fabric.Line([x - 40, y, x + 40, y] as [number,number,number,number], {
          stroke: color,
          strokeWidth: 3,
          strokeLineCap: "round",
          data: { type: "line" },
        } as any)
        fc.add(line)
      } else if (tool === "dashed-line") {
        const dashed = new fabric.Line([x - 40, y, x + 40, y] as [number,number,number,number], {
          stroke: color,
          strokeWidth: 2,
          strokeDashArray: [10, 6],
          data: { type: "dashed-line" },
        } as any)
        fc.add(dashed)
      } else if (tool === "arrow") {
        const shaft = new fabric.Line([0, 0, 80, 0] as [number,number,number,number], {
          stroke: color,
          strokeWidth: 3,
          strokeLineCap: "round",
          originX: "left",
          originY: "center",
        })
        const head = new fabric.Path("M 0 -8 L 18 0 L 0 8 Z", {
          fill: color,
          left: 80,
          top: 0,
          originX: "left",
          originY: "center",
        })
        const group = new fabric.Group([shaft, head], {
          left: x - 40,
          top: y,
          data: { type: "arrow" },
        } as any)
        fc.add(group)
      } else if (tool === "curved-arrow") {
        const curve = new fabric.Path("M -60 20 Q 0 -40 60 20", {
          fill: "transparent",
          stroke: color,
          strokeWidth: 3,
          strokeLineCap: "round",
          originX: "center",
          originY: "center",
        })
        const head = new fabric.Path("M 0 -8 L 18 0 L 0 8 Z", {
          fill: color,
          left: 60,
          top: 20,
          angle: 35,
          originX: "center",
          originY: "center",
        })
        const group = new fabric.Group([curve, head], {
          left: x,
          top: y,
          data: { type: "curved-arrow" },
        } as any)
        fc.add(group)
      }

      fc.renderAll()
    },
    [tool, color]
  )

  const handleUndo = useCallback(async () => {
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    const prevFrames = history[newIndex]
    const fc = fabricRef.current
    if (!fc) return
    isLoadingRef.current = true
    await fc.loadFromJSON(prevFrames[currentFrame] ?? {})
    fc.renderAll()
    isLoadingRef.current = false
    setFrames(prevFrames)
    setHistoryIndex(newIndex)
    notifyParent(prevFrames, currentFrame)
  }, [historyIndex, history, currentFrame, notifyParent])

  const handleRedo = useCallback(async () => {
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    const nextFrames = history[newIndex]
    const fc = fabricRef.current
    if (!fc) return
    isLoadingRef.current = true
    await fc.loadFromJSON(nextFrames[currentFrame] ?? {})
    fc.renderAll()
    isLoadingRef.current = false
    setFrames(nextFrames)
    setHistoryIndex(newIndex)
    notifyParent(nextFrames, currentFrame)
  }, [historyIndex, history, currentFrame, notifyParent])

  const handleClear = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    fc.getObjects()
      .filter((obj: any) => !obj.excludeFromExport)
      .forEach((obj: any) => fc.remove(obj))
    fc.renderAll()
  }, [])

  const handleDeleteSelected = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    fc.getActiveObjects().forEach((obj: any) => fc.remove(obj))
    fc.discardActiveObject()
    fc.renderAll()
  }, [])

  const handleExportPNG = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    const dataURL = fc.toDataURL({ format: "png", multiplier: 2 })
    const a = document.createElement("a")
    a.href = dataURL
    a.download = "diagram.png"
    a.click()
  }, [])

  const handleAddFrame = useCallback(() => {
    const snapshot = snapshotCanvas()
    const newFrames = [...frames]
    newFrames[currentFrame] = snapshot
    const newIdx = currentFrame + 1
    newFrames.splice(newIdx, 0, {})
    pushHistory(newFrames)
    setFrames(newFrames)
    setCurrentFrame(newIdx)
    const fc = fabricRef.current
    if (!fc) return
    fc.getObjects()
      .filter((obj: any) => !obj.excludeFromExport)
      .forEach((obj: any) => fc.remove(obj))
    fc.renderAll()
    notifyParent(newFrames, newIdx)
  }, [frames, currentFrame, snapshotCanvas, pushHistory, notifyParent])

  const handleSwitchFrame = useCallback(
    async (idx: number) => {
      if (idx === currentFrame) return
      const fc = fabricRef.current
      if (!fc) return
      const snapshot = snapshotCanvas()
      const newFrames = [...frames]
      newFrames[currentFrame] = snapshot
      isLoadingRef.current = true
      await fc.loadFromJSON(newFrames[idx] ?? {})
      fc.renderAll()
      isLoadingRef.current = false
      setFrames(newFrames)
      setCurrentFrame(idx)
      notifyParent(newFrames, idx)
    },
    [currentFrame, frames, snapshotCanvas, notifyParent]
  )

  const handleDeleteFrame = useCallback(async () => {
    if (frames.length <= 1) return
    const newFrames = frames.filter((_, i) => i !== currentFrame)
    const newIdx = Math.min(currentFrame, newFrames.length - 1)
    const fc = fabricRef.current
    if (!fc) return
    isLoadingRef.current = true
    await fc.loadFromJSON(newFrames[newIdx] ?? {})
    fc.renderAll()
    isLoadingRef.current = false
    pushHistory(newFrames)
    setFrames(newFrames)
    setCurrentFrame(newIdx)
    notifyParent(newFrames, newIdx)
  }, [frames, currentFrame, pushHistory, notifyParent])

  const toolGroups = [
    {
      label: "Players",
      tools: [
        { id: "player" as ToolType, label: "Player" },
        { id: "opponent" as ToolType, label: "Opponent" },
      ],
    },
    {
      label: "Objects",
      tools: [
        { id: "ball" as ToolType, label: "Ball" },
        { id: "cone" as ToolType, label: "Cone" },
        { id: "net" as ToolType, label: "Net" },
        { id: "zone" as ToolType, label: "Zone" },
        { id: "text" as ToolType, label: "Text" },
      ],
    },
    {
      label: "Lines",
      tools: [
        { id: "arrow" as ToolType, label: "Arrow" },
        { id: "curved-arrow" as ToolType, label: "Curved" },
        { id: "line" as ToolType, label: "Line" },
        { id: "dashed-line" as ToolType, label: "Dashed" },
      ],
    },
  ]

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border text-sm">
        <button
          type="button"
          onClick={() => setTool("select")}
          className={`px-3 py-1.5 rounded border font-medium ${
            tool === "select"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Select
        </button>

        <div className="w-px h-6 bg-gray-300" />

        {toolGroups.map((group) => (
          <div key={group.label} className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">{group.label}:</span>
            {group.tools.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                className={`px-2.5 py-1.5 rounded border ${
                  tool === t.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ))}

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        <div className="flex gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleExportPNG}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
          >
            Export PNG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="border-2 border-gray-300 rounded-lg overflow-hidden"
        style={{ width: CANVAS_WIDTH, maxWidth: "100%" }}
      >
        <canvas ref={canvasElRef} onClick={handleCanvasClick} />
      </div>

      {/* Frame controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 text-xs">Frames:</span>
        {frames.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSwitchFrame(idx)}
            className={`w-8 h-8 rounded border text-xs font-medium ${
              idx === currentFrame
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={handleAddFrame}
          className="px-2 py-1 bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 text-xs"
        >
          + Frame
        </button>
        {frames.length > 1 && (
          <button
            type="button"
            onClick={handleDeleteFrame}
            className="px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 text-xs"
          >
            Delete Frame
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Click to place objects. Switch to &quot;Select&quot; mode to drag, resize, or delete.
        {tool !== "select" && (
          <span className="ml-1 font-medium text-blue-600">Active: {tool}</span>
        )}
      </p>
    </div>
  )
}
