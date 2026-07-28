import { useState, useEffect } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description, action }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, title, description, action }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  return { toasts, toast }
}
