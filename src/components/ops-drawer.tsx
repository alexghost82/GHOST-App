import { MAX_COLLAGE_FRAMES } from '../data/constants'
import type { Channel, TimelineSamplerState } from '../types'
import { SurfaceDialog } from './surface-dialog'
import { TimelineControls } from './timeline-controls'

interface NextScanInfo {
  deadline: number
  operationName: string
  totalCycleMs: number
}

interface OpsDrawerProps {
  selectedChannel: Channel
  activeOpsCount: number
  nextScanInfo: NextScanInfo | null
  timelineSamplerState: TimelineSamplerState
  onClose: () => void
  onStartTimelineSampling: (intervalSeconds: 2 | 4 | 8) => void
  onStopTimelineSampling: () => void
}

function formatCountdown(deadline: number): string {
  const remaining = Math.max(0, deadline - Date.now())
  const totalSeconds = Math.floor((remaining + 999) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return `00:${String(seconds).padStart(2, '0')}`
}

export function OpsDrawer({
  selectedChannel,
  activeOpsCount,
  nextScanInfo,
  timelineSamplerState,
  onClose,
  onStartTimelineSampling,
  onStopTimelineSampling,
}: OpsDrawerProps) {
  const enabledOperations = selectedChannel.operations.filter((operation) => operation.enabled)

  return (
    <SurfaceDialog
      eyebrow="Live controls"
      title={`בקרות חיות · ${selectedChannel.name}`}
      description="דגימת ציר-זמן, מצב מבצעים פעילים, וכניסה מהירה להגדרות הערוץ מבלי להעמיס על ראש חלון הצ'אט."
      onClose={onClose}
      width="wide"
    >
      <div className="ops-drawer-grid">
        <section className="ops-drawer-card">
          <div className="ops-drawer-card-header">
            <strong>סטטוס חי</strong>
            <span>{activeOpsCount} מבצעים פעילים</span>
          </div>
          <div className="ops-drawer-pill-row">
            <span className="ops-drawer-pill">דגימה: {timelineSamplerState.isActive ? 'פעילה' : 'ממתינה'}</span>
            <span className="ops-drawer-pill">
              פריימים: {timelineSamplerState.sampledFrames.length}/{MAX_COLLAGE_FRAMES}
            </span>
            <span className="ops-drawer-pill">
              היסטוריה: {timelineSamplerState.analysisHistory.length}
            </span>
          </div>
          {nextScanInfo ? (
            <div className="ops-drawer-next-run">
              <strong>{nextScanInfo.operationName}</strong>
              <span>סריקה הבאה בעוד {formatCountdown(nextScanInfo.deadline)}</span>
            </div>
          ) : (
            <p className="ops-drawer-empty">אין כרגע תור סריקה מתוזמן לערוץ הזה.</p>
          )}
        </section>

        <section className="ops-drawer-card">
          <div className="ops-drawer-card-header">
            <strong>דגימת ציר-זמן</strong>
            <span>מהצ'אט אל שכבת בקרה נפרדת</span>
          </div>
          <TimelineControls
            samplerState={timelineSamplerState}
            onStartSampling={onStartTimelineSampling}
            onStopSampling={onStopTimelineSampling}
          />
        </section>

        <section className="ops-drawer-card ops-drawer-card-wide">
          <div className="ops-drawer-card-header">
            <strong>מבצעים מוגדרים</strong>
            <span>{enabledOperations.length}/{selectedChannel.operations.length}</span>
          </div>
          {selectedChannel.operations.length === 0 ? (
            <p className="ops-drawer-empty">לא הוגדרו מבצעים לערוץ הזה.</p>
          ) : (
            <div className="ops-drawer-operations">
              {selectedChannel.operations.map((operation) => (
                <article className={`ops-drawer-operation ${operation.enabled ? 'is-enabled' : 'is-disabled'}`} key={operation.id}>
                  <div className="ops-drawer-operation-top">
                    <strong>{operation.name}</strong>
                    <span>{operation.enabled ? 'פעיל' : 'מושהה'}</span>
                  </div>
                  <p>{operation.trigger || 'ללא טריגר מפורט'}</p>
                  <div className="ops-drawer-operation-meta">
                    <span>{operation.schedule || 'ללא תזמון'}</span>
                    <span>{operation.mode}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </SurfaceDialog>
  )
}
