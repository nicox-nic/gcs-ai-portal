import { useEffect, useState } from 'react'

/** Brief delay so dashboard chart areas can show a skeleton on first paint/hydration. */
export function useHydrationReady(delayMs = 400): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return ready
}
