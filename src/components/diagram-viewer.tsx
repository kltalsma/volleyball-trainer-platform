"use client"

import { useRef, useEffect } from "react"

interface DiagramViewerProps {
  diagram: string
}

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 450

export default function DiagramViewer({ diagram }: DiagramViewerProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null)

  useEffect(() => {
    if (!diagram || !canvasElRef.current) return

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fc: any = null

    async function init() {
      const fabric = await import("fabric")
      if (cancelled || !canvasElRef.current) return

      fc = new fabric.StaticCanvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
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
        })
        fc.backgroundImage = img
        fc.renderAll()
      })

      try {
        const parsed = JSON.parse(diagram)

        if (parsed && Array.isArray(parsed.frames) && parsed.frames.length > 0) {
          // New Fabric.js format
          const frameIdx = parsed.currentFrame ?? 0
          const frameData = parsed.frames[frameIdx] ?? parsed.frames[0]
          await fc.loadFromJSON(frameData)
          fc.renderAll()
        } else {
          // Old raw-canvas format — silently ignore, background still shows
        }
      } catch {
        // Parse error — show empty court
      }
    }

    init()

    return () => {
      cancelled = true
      if (fc) {
        try { fc.dispose() } catch { /* ignore */ }
      }
      fabricRef.current = null
    }
  }, [diagram])

  if (!diagram) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500 text-sm">
        No diagram available
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ width: CANVAS_WIDTH, maxWidth: "100%" }}>
      <canvas ref={canvasElRef} />
    </div>
  )
}
