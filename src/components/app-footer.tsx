import { useEffect, useState } from 'react'

function useLiveClock() {
  const [time, setTime] = useState(() => formatTime(new Date()))
  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime(new Date())), 1_000)
    return () => clearInterval(timer)
  }, [])
  return time
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function AppFooter() {
  const clock = useLiveClock()

  return (
    <footer className="app-footer desktop-only">
      <div className="footer-cluster" />

      <div className="footer-cluster footer-cluster-status">
        <span className="footer-pill">
          <span className="footer-live-dot" aria-hidden />
          <span className="footer-pill-label">מערכת</span>
          <strong className="footer-pill-value">תקין</strong>
        </span>
        <span className="footer-pill">
          <span className="footer-pill-label">שעה</span>
          <strong className="footer-pill-value footer-clock">{clock}</strong>
        </span>
        <span className="footer-live-tag">חי</span>
      </div>
    </footer>
  )
}
