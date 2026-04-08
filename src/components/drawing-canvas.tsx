"use client"

import { useRef, useState, useEffect, useCallback } from "react"

interface DrawingCanvasProps {
  onChange: (diagram: string) => void
  initialDiagram?: string
}

type ToolType =
  | "select"
  | "player-orange" | "player-red" | "player-blue"
  | "opponent-orange" | "opponent-red" | "opponent-blue"
  | "cone-red" | "cone-blue" | "cone-orange"
  | "ball" | "zone" | "text"
  | "arrow" | "curved-arrow" | "line"
  | "dashed-arrow" | "dashed-curved-arrow" | "dashed-line"

const CANVAS_WIDTH = 534
const CANVAS_HEIGHT = 800

let _uidCounter = 0
function nextUid() { return `obj_${++_uidCounter}` }

function serializeDiagram(frames: object[], currentFrame: number): string {
  return JSON.stringify({ frames, currentFrame })
}

// ── SVG icons for sidebar buttons ────────────────────────────────────────────

function IconPlayerFilled({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="18" r="16" fill={color} />
    </svg>
  )
}

function IconPersonSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="10" r="6" fill={color} />
      <path d="M10 36 Q10 20 18 20 Q26 20 26 36 Z" fill={color} />
    </svg>
  )
}

function IconBall() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="18" r="14" fill="#1a1a2e" stroke="#555" strokeWidth="1" />
      <path d="M4 18 Q18 9 32 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 5 Q14 18 11 31" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M25 5 Q22 18 25 31" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconZone() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <rect x="4" y="4" width="28" height="28" fill="rgba(59,130,246,0.2)" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
    </svg>
  )
}

function IconText() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <text x="18" y="26" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#374151">A</text>
    </svg>
  )
}

function IconCone({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <path d="M18 4 L30 32 L6 32 Z" fill={color} stroke="#333" strokeWidth="1" />
    </svg>
  )
}

function IconLine() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <line x1="4" y1="32" x2="32" y2="4" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <line x1="4" y1="30" x2="28" y2="8" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 8 L20 10 L26 16 Z" fill="#374151" />
    </svg>
  )
}

function IconCurvedArrow() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <path d="M4 30 Q18 4 32 14" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 14 L24 12 L28 20 Z" fill="#374151" />
    </svg>
  )
}

function IconDashedLine() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <line x1="4" y1="32" x2="32" y2="4" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
    </svg>
  )
}

function IconDashedArrow() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <line x1="4" y1="30" x2="26" y2="10" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
      <path d="M28 8 L20 10 L26 16 Z" fill="#374151" />
    </svg>
  )
}

function IconDashedCurvedArrow() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28">
      <path d="M4 30 Q18 4 32 14" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
      <path d="M32 14 L24 12 L28 20 Z" fill="#374151" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DrawingCanvas({ onChange, initialDiagram }: DrawingCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgImageRef = useRef<any>(null)
  const applyBgRef = useRef<(() => Promise<void>) | null>(null)
  const onChangeRef = useRef(onChange)
  const isLoadingRef = useRef(false)

  const [tool, setToolState] = useState<ToolType>("select")
  const toolRef = useRef<ToolType>("select")
  const [color, setColorState] = useState("#F97316")
  const colorRef = useRef("#F97316")
  const [frames, setFrames] = useState<object[]>([{}])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [history, setHistory] = useState<object[][]>([[{}]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const framesRef = useRef<object[]>([{}])
  const currentFrameRef = useRef(0)

  const setTool = useCallback((t: ToolType) => { toolRef.current = t; setToolState(t) }, [])
  const setColor = useCallback((c: string) => { colorRef.current = c; setColorState(c) }, [])

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { framesRef.current = frames }, [frames])
  useEffect(() => { currentFrameRef.current = currentFrame }, [currentFrame])

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

      // Build the applyBackground function and store in ref so undo/redo can call it
      const applyBackground = async () => {
        if (!fc || cancelled) return
        if (!bgImageRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const img = await (fabric.FabricImage as any).fromURL("/volleyball-court.jpg")
          if (cancelled) return
          // Image is 800×534 landscape. Rotate 90° CCW to get portrait 534×800.
          // After rotation, fabric treats the image as 534 wide × 800 tall.
          // Scale so the rotated image fills the canvas exactly.
          const scale = Math.max(CANVAS_WIDTH / img.height, CANVAS_HEIGHT / img.width)
          img.set({
            angle: -90,
            scaleX: scale,
            scaleY: scale,
            originX: "center",
            originY: "center",
            left: CANVAS_WIDTH / 2,
            top: CANVAS_HEIGHT / 2,
            selectable: false,
            evented: false,
            excludeFromExport: true,
          })
          bgImageRef.current = img
        }
        fc.backgroundImage = bgImageRef.current
        fc.requestRenderAll()
      }
      applyBgRef.current = applyBackground

      await applyBackground()

      // Place objects via Fabric mouse:up (avoids React onClick conflicts)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.on("mouse:up", async (opt: any) => {
        const t = toolRef.current
        if (t === "select" || opt.transform) return
        const pointer = fc.getScenePoint(opt.e)
        const x = pointer.x
        const y = pointer.y
        const fabric2 = await import("fabric")
        const c = colorRef.current

        const toolColor =
          t.endsWith("-orange") ? "#F97316" :
          t.endsWith("-red")    ? "#EF4444" :
          t.endsWith("-blue")   ? "#3B82F6" : c

        if (t.startsWith("player-")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const playerCount = fc.getObjects().filter((o: any) => o.data?.type === "player").length
          const circle = new fabric2.Circle({ radius: 18, fill: toolColor, stroke: "#fff", strokeWidth: 2, originX: "center", originY: "center" })
          const label = new fabric2.FabricText(String(playerCount + 1), { fontSize: 13, fontWeight: "bold", fill: "#fff", originX: "center", originY: "center", selectable: false, evented: false })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Group([circle, label], { left: x - 18, top: y - 18, data: { type: "player", id: nextUid() } } as any))

        } else if (t.startsWith("opponent-")) {
          const circle = new fabric2.Circle({ radius: 18, fill: "transparent", stroke: toolColor, strokeWidth: 3, originX: "center", originY: "center" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cross1 = new fabric2.Line([-12, -12, 12, 12] as [number,number,number,number], { stroke: toolColor, strokeWidth: 2, originX: "center", originY: "center" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cross2 = new fabric2.Line([-12, 12, 12, -12] as [number,number,number,number], { stroke: toolColor, strokeWidth: 2, originX: "center", originY: "center" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Group([circle, cross1, cross2], { left: x - 18, top: y - 18, data: { type: "opponent", id: nextUid() } } as any))

        } else if (t.startsWith("cone-")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Path("M 0 -20 L 14 14 L -14 14 Z", { fill: toolColor, stroke: "#000", strokeWidth: 1, left: x, top: y, originX: "center", originY: "center", data: { type: "cone", id: nextUid() } } as any))

        } else if (t === "ball") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Circle({ left: x - 12, top: y - 12, radius: 12, fill: "#f5e642", stroke: "#555", strokeWidth: 2, data: { type: "ball", id: nextUid() } } as any))

        } else if (t === "zone") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Rect({ left: x - 50, top: y - 30, width: 100, height: 60, fill: c + "33", stroke: c, strokeWidth: 2, data: { type: "zone", id: nextUid() } } as any))

        } else if (t === "text") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = new fabric2.IText("Label", { left: x, top: y, fontSize: 16, fontWeight: "bold", fill: c, data: { type: "text", id: nextUid() } } as any)
          fc.add(text)
          fc.setActiveObject(text)
          text.enterEditing()
          text.selectAll()

        } else if (t === "line") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Line([x - 40, y, x + 40, y] as [number,number,number,number], { stroke: c, strokeWidth: 3, strokeLineCap: "round", data: { type: "line", id: nextUid() } } as any))

        } else if (t === "dashed-line") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Line([x - 40, y, x + 40, y] as [number,number,number,number], { stroke: c, strokeWidth: 2, strokeDashArray: [10, 6], data: { type: "dashed-line", id: nextUid() } } as any))

        } else if (t === "arrow" || t === "dashed-arrow") {
          const dashed = t === "dashed-arrow"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const shaft = new fabric2.Line([0, 0, 80, 0] as [number,number,number,number], { stroke: c, strokeWidth: 3, strokeLineCap: "round", originX: "left", originY: "center", strokeDashArray: dashed ? [10,6] : undefined })
          const head = new fabric2.Path("M 0 -8 L 18 0 L 0 8 Z", { fill: c, left: 80, top: 0, originX: "left", originY: "center" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Group([shaft, head], { left: x - 40, top: y, data: { type: t, id: nextUid() } } as any))

        } else if (t === "curved-arrow" || t === "dashed-curved-arrow") {
          const dashed = t === "dashed-curved-arrow"
          const curve = new fabric2.Path("M -60 20 Q 0 -40 60 20", { fill: "transparent", stroke: c, strokeWidth: 3, strokeLineCap: "round", originX: "center", originY: "center", strokeDashArray: dashed ? [10,6] : undefined })
          const head = new fabric2.Path("M 0 -8 L 18 0 L 0 8 Z", { fill: c, left: 60, top: 20, angle: 35, originX: "center", originY: "center" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.add(new fabric2.Group([curve, head], { left: x, top: y, data: { type: t, id: nextUid() } } as any))
        }

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
            await applyBackground()
            isLoadingRef.current = false
            setFrames(parsed.frames)
            setCurrentFrame(frameIdx)
            setHistory([parsed.frames])
            setHistoryIndex(0)
          }
        } catch { /* start fresh */ }
      }

      setIsReady(true)
    }

    init()
    return () => {
      cancelled = true
      if (fc) { try { fc.dispose() } catch { /* ignore */ } }
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync tool cursor
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc || !isReady) return
    fc.defaultCursor = tool === "select" ? "default" : "crosshair"
    fc.hoverCursor = tool === "select" ? "move" : "crosshair"
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

  const pushHistory = useCallback((newFrames: object[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1)
      return [...trimmed, newFrames]
    })
    setHistoryIndex((prev) => prev + 1)
  }, [historyIndex])

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

  // Place objects on canvas click
  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select") return
    const fc = fabricRef.current
    if (!fc) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const fabric = await import("fabric")

    // Resolve color from tool name
    const toolColor =
      tool.endsWith("-orange") ? "#F97316" :
      tool.endsWith("-red")    ? "#EF4444" :
      tool.endsWith("-blue")   ? "#3B82F6" :
      color

    if (tool.startsWith("player-")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const playerCount = fc.getObjects().filter((o: any) => o.data?.type === "player").length
      const circle = new fabric.Circle({ radius: 18, fill: toolColor, stroke: "#fff", strokeWidth: 2, originX: "center", originY: "center" })
      const label = new fabric.FabricText(String(playerCount + 1), { fontSize: 13, fontWeight: "bold", fill: "#fff", originX: "center", originY: "center", selectable: false, evented: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Group([circle, label], { left: x - 18, top: y - 18, data: { type: "player", id: nextUid() } } as any))

    } else if (tool.startsWith("opponent-")) {
      const circle = new fabric.Circle({ radius: 18, fill: "transparent", stroke: toolColor, strokeWidth: 3, originX: "center", originY: "center" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cross1 = new fabric.Line([-12, -12, 12, 12] as [number,number,number,number], { stroke: toolColor, strokeWidth: 2, originX: "center", originY: "center" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cross2 = new fabric.Line([-12, 12, 12, -12] as [number,number,number,number], { stroke: toolColor, strokeWidth: 2, originX: "center", originY: "center" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Group([circle, cross1, cross2], { left: x - 18, top: y - 18, data: { type: "opponent", id: nextUid() } } as any))

    } else if (tool.startsWith("cone-")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Path("M 0 -20 L 14 14 L -14 14 Z", { fill: toolColor, stroke: "#000", strokeWidth: 1, left: x, top: y, originX: "center", originY: "center", data: { type: "cone", id: nextUid() } } as any))

    } else if (tool === "ball") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Circle({ left: x - 12, top: y - 12, radius: 12, fill: "#f5e642", stroke: "#555", strokeWidth: 2, data: { type: "ball", id: nextUid() } } as any))

    } else if (tool === "zone") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Rect({ left: x - 50, top: y - 30, width: 100, height: 60, fill: color + "33", stroke: color, strokeWidth: 2, data: { type: "zone", id: nextUid() } } as any))

    } else if (tool === "text") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = new fabric.FabricText("Label", { left: x, top: y, fontSize: 16, fontWeight: "bold", fill: color, data: { type: "text", id: nextUid() } } as any)
      fc.add(text)
      fc.setActiveObject(text)

    } else if (tool === "line") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Line([x - 40, y, x + 40, y] as [number,number,number,number], { stroke: color, strokeWidth: 3, strokeLineCap: "round", data: { type: "line", id: nextUid() } } as any))

    } else if (tool === "dashed-line") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Line([x - 40, y, x + 40, y] as [number,number,number,number], { stroke: color, strokeWidth: 2, strokeDashArray: [10, 6], data: { type: "dashed-line", id: nextUid() } } as any))

    } else if (tool === "arrow" || tool === "dashed-arrow") {
      const dashed = tool === "dashed-arrow"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shaft = new fabric.Line([0, 0, 80, 0] as [number,number,number,number], { stroke: color, strokeWidth: 3, strokeLineCap: "round", originX: "left", originY: "center", strokeDashArray: dashed ? [10,6] : undefined })
      const head = new fabric.Path("M 0 -8 L 18 0 L 0 8 Z", { fill: color, left: 80, top: 0, originX: "left", originY: "center" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Group([shaft, head], { left: x - 40, top: y, data: { type: tool, id: nextUid() } } as any))

    } else if (tool === "curved-arrow" || tool === "dashed-curved-arrow") {
      const dashed = tool === "dashed-curved-arrow"
      const curve = new fabric.Path("M -60 20 Q 0 -40 60 20", { fill: "transparent", stroke: color, strokeWidth: 3, strokeLineCap: "round", originX: "center", originY: "center", strokeDashArray: dashed ? [10,6] : undefined })
      const head = new fabric.Path("M 0 -8 L 18 0 L 0 8 Z", { fill: color, left: 60, top: 20, angle: 35, originX: "center", originY: "center" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.add(new fabric.Group([curve, head], { left: x, top: y, data: { type: tool, id: nextUid() } } as any))
    }
  }, [tool, color])

  const handleUndo = useCallback(async () => {
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    const prevFrames = history[newIndex]
    const fc = fabricRef.current
    if (!fc) return
    isLoadingRef.current = true
    await fc.loadFromJSON(prevFrames[currentFrame] ?? {})
    if (applyBgRef.current) await applyBgRef.current()
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
    if (applyBgRef.current) await applyBgRef.current()
    isLoadingRef.current = false
    setFrames(nextFrames)
    setHistoryIndex(newIndex)
    notifyParent(nextFrames, currentFrame)
  }, [historyIndex, history, currentFrame, notifyParent])

  const handleClear = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fc.getObjects().filter((o: any) => !o.excludeFromExport).forEach((o: any) => fc.remove(o))
    fc.renderAll()
  }, [])

  const handleDeleteSelected = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fc.getActiveObjects().forEach((o: any) => fc.remove(o))
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

  const handleAddFrame = useCallback(async () => {
    const snapshot = snapshotCanvas()
    const newFrames = [...frames]
    newFrames[currentFrame] = snapshot
    const newIdx = currentFrame + 1
    // New frame starts as a copy of the current frame
    newFrames.splice(newIdx, 0, snapshot)
    pushHistory(newFrames)
    setFrames(newFrames)
    setCurrentFrame(newIdx)
    const fc = fabricRef.current
    if (!fc) return
    isLoadingRef.current = true
    await fc.loadFromJSON(snapshot)
    if (applyBgRef.current) await applyBgRef.current()
    isLoadingRef.current = false
    notifyParent(newFrames, newIdx)
  }, [frames, currentFrame, snapshotCanvas, pushHistory, notifyParent])

  const handleSwitchFrame = useCallback(async (idx: number) => {
    if (idx === currentFrame) return
    const fc = fabricRef.current
    if (!fc) return
    const snapshot = snapshotCanvas()
    const newFrames = [...frames]
    newFrames[currentFrame] = snapshot
    isLoadingRef.current = true
    await fc.loadFromJSON(newFrames[idx] ?? {})
    if (applyBgRef.current) await applyBgRef.current()
    isLoadingRef.current = false
    setFrames(newFrames)
    setCurrentFrame(idx)
    notifyParent(newFrames, idx)
  }, [currentFrame, frames, snapshotCanvas, notifyParent])

  const handleDeleteFrame = useCallback(async () => {
    if (frames.length <= 1) return
    const newFrames = frames.filter((_, i) => i !== currentFrame)
    const newIdx = Math.min(currentFrame, newFrames.length - 1)
    const fc = fabricRef.current
    if (!fc) return
    isLoadingRef.current = true
    await fc.loadFromJSON(newFrames[newIdx] ?? {})
    if (applyBgRef.current) await applyBgRef.current()
    isLoadingRef.current = false
    pushHistory(newFrames)
    setFrames(newFrames)
    setCurrentFrame(newIdx)
    notifyParent(newFrames, newIdx)
  }, [frames, currentFrame, pushHistory, notifyParent])

  // Extract object centers keyed by data.id from a serialised frame
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCenters = useCallback((frame: any): Record<string, { x: number; y: number }> => {
    const result: Record<string, { x: number; y: number }> = {}
    if (!frame?.objects) return result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const obj of frame.objects) {
      const id = obj.data?.id
      if (!id) continue
      const cx = (obj.left ?? 0) + (obj.width ?? 0) / 2
      const cy = (obj.top ?? 0) + (obj.height ?? 0) / 2
      result[id] = { x: cx, y: cy }
    }
    return result
  }, [])

  // Draw ghost arrows on the live canvas showing movement from `from` to `to` centers
  const drawMovementArrows = useCallback(async (
    fromCenters: Record<string, { x: number; y: number }>,
    toCenters: Record<string, { x: number; y: number }>
  ) => {
    const fc = fabricRef.current
    if (!fc) return
    const fabric = await import("fabric")
    for (const id of Object.keys(fromCenters)) {
      const from = fromCenters[id]
      const to = toCenters[id]
      if (!to) continue
      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 8) continue  // ignore negligible movement

      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shaft = new fabric.Line([0, 0, dist - 14, 0] as [number,number,number,number], {
        stroke: "rgba(255,255,255,0.85)", strokeWidth: 2.5, strokeDashArray: [8, 5],
        originX: "left", originY: "center",
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const head = new fabric.Path("M 0 -6 L 14 0 L 0 6 Z", {
        fill: "rgba(255,255,255,0.85)", left: dist - 14, top: 0,
        originX: "left", originY: "center",
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arrow = new fabric.Group([shaft, head], {
        left: from.x, top: from.y,
        angle,
        originX: "left", originY: "center",
        selectable: false, evented: false,
        excludeFromExport: true,
        data: { isMovementArrow: true },
      } as any)
      fc.add(arrow)
    }
    fc.requestRenderAll()
  }, [])

  // Clear all ghost movement arrows from canvas
  const clearMovementArrows = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arrows = fc.getObjects().filter((o: any) => o.data?.isMovementArrow)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arrows.forEach((o: any) => fc.remove(o))
  }, [])

  const handleStop = useCallback(() => {
    if (playIntervalRef.current) { clearInterval(playIntervalRef.current); playIntervalRef.current = null }
    clearMovementArrows()
    setIsPlaying(false)
  }, [clearMovementArrows])

  const handlePlay = useCallback(() => {
    if (framesRef.current.length <= 1) return
    setIsPlaying(true)
    let idx = 0
    const playFrame = async (frameIdx: number) => {
      const fc = fabricRef.current
      if (!fc) return
      const frames = framesRef.current
      // Capture next-frame centers BEFORE loading (so we can compare positions)
      const nextIdx = (frameIdx + 1) % frames.length
      const nextCenters = getCenters(frames[nextIdx])

      isLoadingRef.current = true
      clearMovementArrows()
      await fc.loadFromJSON(frames[frameIdx] ?? {})
      if (applyBgRef.current) await applyBgRef.current()
      isLoadingRef.current = false
      setCurrentFrame(frameIdx)
      currentFrameRef.current = frameIdx

      // Draw movement arrows showing where objects go in the next frame
      if (frameIdx < frames.length - 1) {
        const currentCenters = getCenters(frames[frameIdx])
        await drawMovementArrows(currentCenters, nextCenters)
      }
    }
    playFrame(0)
    playIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % framesRef.current.length
      playFrame(idx)
      if (idx === framesRef.current.length - 1) {
        setTimeout(() => {
          if (playIntervalRef.current) clearInterval(playIntervalRef.current)
          playIntervalRef.current = null
          clearMovementArrows()
          setIsPlaying(false)
        }, 800)
      }
    }, 800)
  }, [getCenters, drawMovementArrows, clearMovementArrows])
  const ToolBtn = ({ id, children, title }: { id: ToolType; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      title={title}
      onClick={() => setTool(id)}
      className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
        tool === id
          ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300"
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  )

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1 mt-3 first:mt-0">{label}</p>
  )

  return (
    <div className="flex gap-3 items-start">

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <div className="w-36 flex-shrink-0 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Tools</p>

        <SectionLabel label="Spelers" />
        <div className="flex flex-wrap gap-1.5 mb-1">
          <ToolBtn id="player-orange" title="Speler oranje"><IconPlayerFilled color="#F97316" /></ToolBtn>
          <ToolBtn id="player-red"    title="Speler rood">  <IconPlayerFilled color="#EF4444" /></ToolBtn>
          <ToolBtn id="player-blue"   title="Speler blauw"> <IconPlayerFilled color="#3B82F6" /></ToolBtn>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ToolBtn id="opponent-orange" title="Tegenstander oranje"><IconPersonSilhouette color="#F97316" /></ToolBtn>
          <ToolBtn id="opponent-red"    title="Tegenstander rood">  <IconPersonSilhouette color="#EF4444" /></ToolBtn>
          <ToolBtn id="opponent-blue"   title="Tegenstander blauw"> <IconPersonSilhouette color="#3B82F6" /></ToolBtn>
        </div>

        <SectionLabel label="Objecten" />
        <div className="flex flex-wrap gap-1.5">
          <ToolBtn id="ball"  title="Bal">  <IconBall /></ToolBtn>
          <ToolBtn id="zone"  title="Zone"> <IconZone /></ToolBtn>
          <ToolBtn id="text"  title="Tekst"><IconText /></ToolBtn>
        </div>

        <SectionLabel label="Pionnen" />
        <div className="flex flex-wrap gap-1.5">
          <ToolBtn id="cone-red"    title="Pion rood">   <IconCone color="#EF4444" /></ToolBtn>
          <ToolBtn id="cone-blue"   title="Pion blauw">  <IconCone color="#3B82F6" /></ToolBtn>
          <ToolBtn id="cone-orange" title="Pion oranje">  <IconCone color="#F97316" /></ToolBtn>
        </div>

        <SectionLabel label="Lijnen" />
        <div className="flex flex-wrap gap-1.5">
          <ToolBtn id="line"          title="Lijn">          <IconLine /></ToolBtn>
          <ToolBtn id="arrow"         title="Pijl">          <IconArrow /></ToolBtn>
          <ToolBtn id="curved-arrow"  title="Gebogen pijl">  <IconCurvedArrow /></ToolBtn>
        </div>

        <SectionLabel label="Gestippeld" />
        <div className="flex flex-wrap gap-1.5">
          <ToolBtn id="dashed-line"          title="Gestippelde lijn">        <IconDashedLine /></ToolBtn>
          <ToolBtn id="dashed-arrow"         title="Gestippelde pijl">        <IconDashedArrow /></ToolBtn>
          <ToolBtn id="dashed-curved-arrow"  title="Gestippelde gebogen pijl"><IconDashedCurvedArrow /></ToolBtn>
        </div>

        {/* Color picker for zone/text/line colors */}
        <SectionLabel label="Kleur" />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-full rounded border border-gray-300 cursor-pointer"
          title="Kleur kiezen"
        />
      </div>

      {/* ── Right: top bar + canvas + frames ─────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* Top bar */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setTool("select")}
            className={`px-3 py-1.5 rounded border text-sm font-medium ${tool === "select" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
            Selecteer
          </button>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <button type="button" onClick={handleUndo} disabled={historyIndex <= 0}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-sm">
            ↩ Ongedaan
          </button>
          <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-sm">
            ↪ Opnieuw
          </button>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <button type="button" onClick={handleDeleteSelected}
            className="px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 text-sm">
            Verwijder
          </button>
          <button type="button" onClick={handleClear}
            className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 text-sm">
            Wis alles
          </button>
          <button type="button" onClick={handleExportPNG}
            className="ml-auto px-2.5 py-1.5 bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 text-sm">
            PNG
          </button>
        </div>

        {/* Canvas */}
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ width: CANVAS_WIDTH, maxWidth: "100%" }}>
          <canvas ref={canvasElRef} onClick={handleCanvasClick} />
        </div>

        {/* Frame strip */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 text-xs">Frames:</span>
          {frames.map((_, idx) => (
            <button key={idx} type="button" onClick={() => handleSwitchFrame(idx)}
              className={`w-8 h-8 rounded border text-xs font-medium ${idx === currentFrame ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>
              {idx + 1}
            </button>
          ))}
          <button type="button" onClick={handleAddFrame}
            className="px-2 py-1 bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 text-xs">
            + Frame
          </button>
          {frames.length > 1 && (
            <button type="button" onClick={handleDeleteFrame}
              className="px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 text-xs">
              Frame verwijderen
            </button>
          )}
          {frames.length > 1 && (
            !isPlaying ? (
              <button type="button" onClick={handlePlay}
                className="ml-auto px-3 py-1 bg-green-600 text-white rounded border border-green-700 hover:bg-green-700 text-xs font-medium">
                ▶ Afspelen
              </button>
            ) : (
              <button type="button" onClick={handleStop}
                className="ml-auto px-3 py-1 bg-gray-600 text-white rounded border border-gray-700 hover:bg-gray-700 text-xs font-medium">
                ⏹ Stop
              </button>
            )
          )}
        </div>

        {tool !== "select" && (
          <p className="text-xs text-blue-600 font-medium">Actief: {tool}</p>
        )}
      </div>
    </div>
  )
}
