"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "@/components/ui/hot-toast"

type AsyncFn<T extends any[]> = (...args: T) => Promise<any>

export function useAsyncAction<T extends any[] = any[]>(options?: {
  successMessage?: string
  errorMessages?: Record<string, string>
}) {
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const run = useCallback(
    async (fn: AsyncFn<T>, ...args: T) => {
      if (inFlight.current) return
      inFlight.current = true
      setLoading(true)
      try {
        const res = await fn(...args)
        if (options?.successMessage) toast.success(options.successMessage)
        return res
      } catch (err: any) {
        const key = err?.message || "UNKNOWN_ERROR"
        const msg = options?.errorMessages?.[key] ?? (
          key === 'INVALID_CREDENTIALS' ? 'Credenciais inválidas.' : key === 'CONNECTION_ERROR' ? 'Problema de conexão.' : 'Ocorreu um erro.'
        )
        toast.error(msg)
        throw err
      } finally {
        inFlight.current = false
        setLoading(false)
      }
    },
    [options]
  )

  return { loading, run }
}

export default useAsyncAction
