import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" strokeLinecap="round" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4.5 20.5h15M6.5 20.5V5.8c0-.7.5-1.3 1.2-1.5l5-1.2c.8-.2 1.6.4 1.6 1.3v16.1M17.5 20.5v-10h-3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.2 8h2.2M9.2 11.5h2.2M9.2 15h2.2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

export default function OpportunityCard({
  opportunity,
  index = 0,
  isAdmin = false,
  matchPercentage,
  onEdit,
  onDelete,
  deleting = false,
}) {
  const [showDescription, setShowDescription] = useState(isAdmin)
  const isLive = opportunity.status === 'live'
  const isCompleted = opportunity.status === 'completed'
  const applicationLink = opportunity.applicationLink?.trim()
  const jdGoogleDriveLink = opportunity.jdGoogleDriveLink?.trim()
  const showApplyButton = isLive && !isCompleted
  const showJdButton = Boolean(jdGoogleDriveLink)
  const showDescriptionOverlay = !isAdmin && showDescription
  const hasResumeMatch = Number.isFinite(matchPercentage)

  useEffect(() => {
    if (!showDescriptionOverlay) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDescription(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [showDescriptionOverlay])

  const handleApply = () => {
    if (applicationLink) {
      window.open(applicationLink, '_blank', 'noopener,noreferrer')
      return
    }

    window.alert('Application form link is not available yet.')
  }

  const handleOpenJd = () => {
    if (jdGoogleDriveLink) {
      window.open(jdGoogleDriveLink, '_blank', 'noopener,noreferrer')
    }
  }

  const descriptionOverlay =
    showDescriptionOverlay &&
    createPortal(
      <div
        className="description-overlay fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md"
        role="presentation"
        onClick={() => setShowDescription(false)}
      >
        <div
          className="description-dialog relative max-h-[min(720px,calc(100vh-4rem))] w-full max-w-xl overflow-y-auto rounded-[24px] border border-line bg-paper p-6 shadow-[0_32px_100px_-36px_rgba(0,0,0,0.95)] md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`opportunity-title-${opportunity.id}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                Role title
              </p>
              <h3
                id={`opportunity-title-${opportunity.id}`}
                className="mt-2 font-display text-[2rem] leading-[1.05] text-ink md:text-[2.35rem]"
              >
                {opportunity.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDescription(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-cream-deep/80 text-ink-soft transition hover:border-ink hover:bg-ink hover:text-cream"
              aria-label="Close description overlay"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            {opportunity.eligibilityCriteria && (
              <div className="mb-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
                  Eligibility criteria
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  {opportunity.eligibilityCriteria}
                </p>
              </div>
            )}
            {(opportunity.batch || (isCompleted && opportunity.select)) && (
              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                {opportunity.batch && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
                      Batch
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                      {opportunity.batch}
                    </p>
                  </div>
                )}
                {isCompleted && opportunity.select && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
                      Select
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                      {opportunity.select}
                    </p>
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
              Description
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              {opportunity.description || 'Description is not available yet.'}
            </p>
            {showJdButton && (
              <button
                type="button"
                onClick={handleOpenJd}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-gold/45 px-5 text-sm font-semibold text-gold-bright transition hover:border-gold hover:bg-gold hover:text-cream"
              >
                View JD
                <ExternalLinkIcon />
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <article
        className="opportunity-card group grid gap-8 rounded-[28px] border border-line bg-paper/90 px-6 py-7 shadow-premium-soft md:grid-cols-[190px_1fr_170px] md:gap-10 md:px-8 md:py-8"
        style={{ animationDelay: `${index * 90}ms` }}
      >
        <div className="flex flex-col justify-between gap-6">
          <div
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${
              isCompleted
                ? 'border-line bg-cream-deep text-mute'
                : 'border-live/20 bg-sage text-sage-deep'
            }`}
          >
            <CalendarIcon />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
              Opportunity date
            </p>
            <p className="mt-2 text-[15px] font-medium leading-snug text-ink-soft">
              {opportunity.dateLabel}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-5 border-y border-line/80 py-5 md:border-x md:border-y-0 md:px-8 md:py-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isLive && (
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
              )}
              <p
                className={`text-[10px] font-medium uppercase tracking-[0.18em] ${
                  isLive ? 'text-live' : 'text-mute-light'
                }`}
              >
                {opportunity.eligibilityCriteria || 'Eligibility not specified'}
              </p>
              <span className="h-1 w-1 rounded-full bg-mute-light" />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
                <BuildingIcon />
                Campus drive
              </span>
            </div>
            <h3 className="mt-3 font-display text-[2rem] leading-[1.05] tracking-tight text-ink md:text-[2.45rem]">
              {opportunity.title}
            </h3>
            <p className="mt-2 text-sm font-medium text-gold-bright">
              {opportunity.company}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {opportunity.batch && (
                <span className="rounded-full border border-line bg-cream-deep/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-mute">
                  Batch {opportunity.batch}
                </span>
              )}
              {isCompleted && opportunity.select && (
                <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-gold-bright">
                  Select {opportunity.select}
                </span>
              )}
            </div>
            {isAdmin && showDescription && opportunity.description && (
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">
                {opportunity.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {opportunity.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-cream-deep/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-mute"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 md:items-end">
          <div className="flex flex-col gap-4 md:items-end md:text-right">
            {hasResumeMatch && (
              <div className="rounded-2xl border border-live/25 bg-live/10 px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-live">
                  Resume match
                </p>
                <p className="mt-1 font-display text-3xl leading-none text-ink">
                  {Math.round(matchPercentage)}%
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
                Expected CTC
              </p>
              <p className="mt-2 font-display text-[1.85rem] leading-none tracking-tight text-gold-bright md:text-[2.1rem]">
                {opportunity.ctc}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => onEdit(opportunity)}
                className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft transition hover:border-ink/50 hover:bg-ink hover:text-cream"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(opportunity.id)}
                disabled={deleting}
                className="rounded-full border border-red-300/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition hover:border-red-200/60 hover:bg-red-500/15"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              {showJdButton && (
                <button
                  type="button"
                  onClick={handleOpenJd}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink-soft transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-bright"
                >
                  View JD
                  <ExternalLinkIcon />
                </button>
              )}
              {showApplyButton && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-cream transition hover:bg-gold-bright"
                >
                  Apply now
                  <ExternalLinkIcon />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDescription(true)}
                className={`card-arrow inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-soft ${
                  showDescriptionOverlay ? 'is-open' : ''
                }`}
                aria-expanded={showDescriptionOverlay}
                aria-label={`Show ${opportunity.title} description`}
              >
                <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      </article>

      {descriptionOverlay}
    </>
  )
}
