import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { signUp } from '../api/auth'
import {
  createPost,
  deletePost,
  editPost,
  fetchAdmins,
  fetchPlacementReport,
  fetchPosts,
  matchResumeToOpportunities,
  updatePlacementStatus,
} from '../api/posts'
import heroImage from '../assets/hero.png'
import { opportunities } from '../data/opportunities'
import OpportunityCard from './OpportunityCard'

const SECTIONS = [
  {
    id: 'live',
    label: 'Live',
    eyebrow: 'Open applications',
    title: 'Happening now',
    blurb: 'Drives accepting applications right now. Act while the window is open.',
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    eyebrow: 'On the horizon',
    title: 'Coming soon',
    blurb: 'Prepare early for the next campus visits and assessment windows.',
  },
  {
    id: 'completed',
    label: 'Completed',
    eyebrow: 'Archive',
    title: 'Already closed',
    blurb: 'Past drives kept here for reference after results and offers.',
  },
]

const EMPTY_DRIVE_FORM = {
  title: '',
  company: '',
  description: '',
  dateLabel: '',
  status: 'live',
  eligibilityCriteria: '',
  batch: '',
  select: '',
  ctc: '',
  applicationLink: '',
  jdGoogleDriveLink: '',
  tags: '',
}

const EMPTY_ADMIN_FORM = {
  name: '',
  email: '',
  password: '',
}

export default function OpportunityDashboard({ user, onLogout }) {
  const [section, setSection] = useState('live')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState(opportunities)
  const [driveForm, setDriveForm] = useState(EMPTY_DRIVE_FORM)
  const [editingId, setEditingId] = useState(null)
  const [driveMessage, setDriveMessage] = useState('')
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [savingDrive, setSavingDrive] = useState(false)
  const [deletingDriveId, setDeletingDriveId] = useState(null)
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM)
  const [adminMessage, setAdminMessage] = useState('')
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [resumeMatchMessage, setResumeMatchMessage] = useState('')
  const [matchingResume, setMatchingResume] = useState(false)
  const [resumeMatches, setResumeMatches] = useState({})
  const [showStatusOverlay, setShowStatusOverlay] = useState(false)
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentStatusMessage, setStudentStatusMessage] = useState('')
  const [updatingStudentEmail, setUpdatingStudentEmail] = useState('')
  const [showAdminOverlay, setShowAdminOverlay] = useState(false)
  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [adminListMessage, setAdminListMessage] = useState('')

  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const activeMeta = SECTIONS.find((item) => item.id === section)
  const filtered = useMemo(() => {
    const terms = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    return items.filter((item) => {
      if (item.status !== section) return false
      if (terms.length === 0) return true

      const searchable = [
        item.title,
        item.company,
        item.ctc,
        item.description,
        item.eligibilityCriteria,
        item.batch,
        item.select,
        item.dateLabel,
        item.jdGoogleDriveLink,
        ...(item.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()

      return terms.every((term) => searchable.includes(term))
    })
  }, [items, section, searchQuery])

  const liveCount = items.filter((item) => item.status === 'live').length
  const upcomingCount = items.filter((item) => item.status === 'upcoming').length
  const completedCount = items.filter((item) => item.status === 'completed').length

  useEffect(() => {
    let active = true

    async function loadPosts() {
      setLoadingPosts(true)
      try {
        const posts = await fetchPosts()
        if (active) {
          setItems(posts)
          setDriveMessage('')
        }
      } catch (error) {
        if (active) {
          setDriveMessage(
            error instanceof Error
              ? error.message
              : 'Failed to retrieve drive posts.',
          )
        }
      } finally {
        if (active) {
          setLoadingPosts(false)
        }
      }
    }

    loadPosts()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!showStatusOverlay) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setShowStatusOverlay(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [showStatusOverlay])

  const updateDriveField = (field, value) => {
    setDriveForm((current) => ({ ...current, [field]: value }))
  }

  const handleEditDrive = (opportunity) => {
    setEditingId(opportunity.id)
    setDriveMessage('')
    setDriveForm({
      title: opportunity.title,
      company: opportunity.company,
      description: opportunity.description,
      dateLabel: opportunity.dateLabel,
      status: opportunity.status,
      eligibilityCriteria: opportunity.eligibilityCriteria ?? '',
      batch: opportunity.batch == null ? '' : String(opportunity.batch),
      select: opportunity.select == null ? '' : String(opportunity.select),
      ctc: opportunity.ctc,
      applicationLink: opportunity.applicationLink ?? '',
      jdGoogleDriveLink: opportunity.jdGoogleDriveLink ?? '',
      tags: opportunity.tags.join(', '),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetDriveForm = () => {
    setEditingId(null)
    setDriveForm(EMPTY_DRIVE_FORM)
  }

  const handleSaveDrive = async (event) => {
    event.preventDefault()
    if (
      !driveForm.title.trim() ||
      !driveForm.company.trim() ||
      !driveForm.dateLabel.trim() ||
      !driveForm.ctc.trim() ||
      !driveForm.eligibilityCriteria.trim() ||
      !driveForm.description.trim()
    ) {
      setDriveMessage(
        'Please fill title, company, date, CTC, eligibility criteria and description.',
      )
      return
    }

    const nextDrive = {
      status: driveForm.status,
      title: driveForm.title.trim(),
      company: driveForm.company.trim(),
      description: driveForm.description.trim(),
      dateLabel: driveForm.dateLabel.trim(),
      eligibilityCriteria: driveForm.eligibilityCriteria.trim(),
      batch: String(driveForm.batch ?? '').trim(),
      select:
        driveForm.status === 'completed'
          ? String(driveForm.select ?? '').trim()
          : '',
      ctc: driveForm.ctc.trim(),
      applicationLink: driveForm.applicationLink.trim(),
      jdGoogleDriveLink: driveForm.jdGoogleDriveLink.trim(),
      tags: driveForm.tags
        .split(',')
        .map((tag) => tag.trim().toUpperCase())
        .filter(Boolean),
      accent: driveForm.status === 'completed' ? 'stone' : 'sage',
    }

    setSavingDrive(true)
    setDriveMessage('')
    try {
      const savedDrive = editingId
        ? await editPost(editingId, nextDrive)
        : await createPost(nextDrive)

      setItems((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? savedDrive : item))
          : [savedDrive, ...current],
      )
      setSection(savedDrive.status)
      setDriveMessage(
        editingId
          ? 'Drive post updated successfully.'
          : 'Drive post created successfully.',
      )
      resetDriveForm()
    } catch (error) {
      setDriveMessage(
        error instanceof Error ? error.message : 'Failed to save drive post.',
      )
    } finally {
      setSavingDrive(false)
    }
  }

  const handleDeleteDrive = async (id) => {
    setDeletingDriveId(id)
    setDriveMessage('')
    try {
      await deletePost(id)
      setItems((current) => current.filter((item) => item.id !== id))
      if (editingId === id) {
        resetDriveForm()
      }
      setDriveMessage('Drive post deleted.')
    } catch (error) {
      setDriveMessage(
        error instanceof Error ? error.message : 'Failed to delete drive post.',
      )
    } finally {
      setDeletingDriveId(null)
    }
  }

  const handleCreateAdmin = async (event) => {
    event.preventDefault()
    if (
      !adminForm.name.trim() ||
      !adminForm.email.trim() ||
      adminForm.password.trim().length < 8
    ) {
      setAdminMessage(
        'Enter name, email and a password of at least 8 characters.',
      )
      return
    }

    setSavingAdmin(true)
    setAdminMessage('')
    try {
      const data = await signUp(
        adminForm.name.trim(),
        adminForm.email.trim(),
        adminForm.password,
        'admin',
      )
      setAdminForm(EMPTY_ADMIN_FORM)
      setAdminMessage(data.message || 'Admin account created successfully.')
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : 'Failed to create admin account.',
      )
    } finally {
      setSavingAdmin(false)
    }
  }

  const handleOpenStatusOverlay = async () => {
    setShowStatusOverlay(true)
    setLoadingStudents(true)
    setStudentStatusMessage('')

    try {
      const report = await fetchPlacementReport()
      setStudents(report)
      if (report.length === 0) {
        setStudentStatusMessage('No student records found.')
      }
    } catch (error) {
      setStudentStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load placement report.',
      )
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleUpdateStudentStatus = async (email, status) => {
    setUpdatingStudentEmail(email)
    setStudentStatusMessage('')

    try {
      const updatedStudent = await updatePlacementStatus(email, status)
      setStudents((current) =>
        current.map((student) =>
          student.email === email
            ? { ...student, status: updatedStudent.status }
            : student,
        ),
      )
      setStudentStatusMessage('Placement status updated.')
    } catch (error) {
      setStudentStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to update placement status.',
      )
    } finally {
      setUpdatingStudentEmail('')
    }
  }

  const extractPdfText = async (file) => {
    const pdfjsLib = await import('pdfjs-dist')
    const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url')

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default

    const data = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data }).promise
    const pageTexts = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      pageTexts.push(textContent.items.map((item) => item.str).join(' '))
    }

    return pageTexts.join('\n').trim()
  }

  const extractResumeText = async (file) => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return extractPdfText(file)
    }

    if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
      return file.text()
    }

    throw new Error('Please upload a PDF or TXT resume.')
  }

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const matchableOpportunities = items
      .filter((item) => item.status === 'live' || item.status === 'upcoming')
      .map((item) => ({
        opportunityId: item.id,
        skills: item.tags ?? [],
      }))

    if (matchableOpportunities.length === 0) {
      setResumeMatchMessage('No live or upcoming opportunities are available to match.')
      return
    }

    setMatchingResume(true)
    setResumeMatchMessage('Scanning resume and matching opportunities...')

    try {
      const resumeText = await extractResumeText(file)

      if (!resumeText) {
        throw new Error('Could not scan text from this resume.')
      }

      const matches = await matchResumeToOpportunities(
        resumeText,
        matchableOpportunities,
      )
      const nextMatches = matches.reduce((accumulator, match) => {
        accumulator[match.opportunityId] = Number(match.matchPercentage)
        return accumulator
      }, {})

      setResumeMatches(nextMatches)
      setResumeMatchMessage(`Matched ${matches.length} opportunities from ${file.name}.`)
    } catch (error) {
      setResumeMatchMessage(
        error instanceof Error
          ? error.message
          : 'Failed to calculate resume match.',
      )
    } finally {
      setMatchingResume(false)
    }
  }

  const statusOverlay =
    showStatusOverlay &&
    createPortal(
      <div
        className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md"
        role="presentation"
        onClick={() => setShowStatusOverlay(false)}
      >
        <div
          className="relative max-h-[min(760px,calc(100vh-4rem))] w-full max-w-4xl overflow-hidden rounded-[24px] border border-line bg-paper shadow-[0_32px_100px_-36px_rgba(0,0,0,0.95)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="placement-status-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-4 border-b border-line px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                Admin status
              </p>
              <h2
                id="placement-status-title"
                className="mt-2 font-display text-3xl leading-none text-ink"
              >
                Student placement status
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowStatusOverlay(false)}
              className="self-start rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft transition hover:border-ink/50 hover:bg-ink hover:text-cream"
            >
              Close
            </button>
          </div>

          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-5 md:px-6">
            {studentStatusMessage && (
              <p className="mb-4 rounded-2xl border border-line bg-cream-deep/70 px-4 py-3 text-sm text-ink-soft">
                {studentStatusMessage}
              </p>
            )}

            {loadingStudents ? (
              <div className="rounded-[20px] border border-dashed border-line px-6 py-12 text-center text-sm text-mute">
                Loading student placement report...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute-light">
                      <th className="border-b border-line px-3 py-3">Student name</th>
                      <th className="border-b border-line px-3 py-3">Student email ID</th>
                      <th className="border-b border-line px-3 py-3">Status</th>
                      <th className="border-b border-line px-3 py-3 text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const normalizedStatus = student.status?.toLowerCase()
                      const isPlaced = normalizedStatus === 'placed'
                      const isUpdating = updatingStudentEmail === student.email

                      return (
                        <tr key={student.email} className="text-sm text-ink-soft">
                          <td className="border-b border-line/70 px-3 py-4 font-medium text-ink">
                            {student.name || 'Unnamed student'}
                          </td>
                          <td className="border-b border-line/70 px-3 py-4">
                            {student.email}
                          </td>
                          <td className="border-b border-line/70 px-3 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                isPlaced
                                  ? 'bg-live/10 text-live'
                                  : 'bg-cream-deep text-mute'
                              }`}
                            >
                              {student.status || 'unplaced'}
                            </span>
                          </td>
                          <td className="border-b border-line/70 px-3 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStudentStatus(student.email, 'placed')
                                }
                                disabled={isUpdating || isPlaced}
                                className="rounded-full border border-live/35 bg-live/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-live transition hover:bg-live/15 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Placed
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStudentStatus(student.email, 'unplaced')
                                }
                                disabled={isUpdating || normalizedStatus === 'unplaced'}
                                className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-mute transition hover:border-ink/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Unplaced
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <div className="premium-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-8 md:pt-10">
        <header className="animate-fade-up">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-6 py-7 md:px-8 md:py-9">
              <div className="flex flex-col gap-5 border-b border-line/80 pb-7 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="animate-draw-in text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
                    Placement command center
                  </p>
                  <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[0.95] tracking-tight text-ink md:text-7xl">
                    Campus placements
                  </h1>
                  <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mute md:text-base">
                    Welcome back,{' '}
                    <span className="font-medium text-ink-soft">
                      {user?.name}
                    </span>
                    . Track live drives, prepare for upcoming rounds, and keep
                    the placement desk aligned from one polished workspace.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 self-start">
                  <div className="rounded-2xl border border-line bg-cream-deep/80 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-mute-light">
                      Signed in
                    </p>
                    <p className="mt-1 max-w-48 truncate text-sm font-medium text-ink-soft">
                      {user?.email}
                    </p>
                    {user?.role && (
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-live">
                        {user.role}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-2xl border border-line bg-cream-deep px-4 py-3 text-sm font-medium text-ink-soft transition hover:border-ink/40 hover:bg-ink hover:text-cream"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Live drives', liveCount],
                  ['Upcoming', upcomingCount],
                  ['Completed', completedCount],
                  ['Total posts', items.length],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-line/80 bg-cream-deep/60 px-4 py-4"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-mute-light">
                      {label}
                    </p>
                    <p className="mt-2 font-display text-4xl leading-none text-ink">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-72 overflow-hidden border-t border-line/80 lg:border-l lg:border-t-0">
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,20,18,0.92),rgba(21,20,18,0.35)),linear-gradient(0deg,rgba(12,11,10,0.85),transparent_65%)]" />
              <div className="relative flex h-full min-h-72 flex-col justify-end p-6 md:p-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                  This week
                </p>
                <p className="mt-2 max-w-xs font-display text-3xl leading-tight text-ink">
                  {liveCount} active drive{liveCount === 1 ? '' : 's'} need
                  attention.
                </p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft/75">
                  Review application windows, update CTC details, and post new
                  campus opportunities as soon as they are confirmed.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section
          className="animate-fade-up mt-6 grid gap-4 md:grid-cols-3"
          style={{ animationDelay: '60ms' }}
        >
          {SECTIONS.map((item) => {
            const count = items.filter((o) => o.status === item.id).length

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`section-tile rounded-[24px] border px-5 py-5 text-left transition ${
                  section === item.id
                    ? 'border-gold/55 bg-gold/10 shadow-premium-soft'
                    : 'border-line bg-paper/70 hover:border-ink/25 hover:bg-paper'
                }`}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute-light">
                    {item.eyebrow}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs tabular-nums ${
                      section === item.id
                        ? 'bg-gold text-cream'
                        : 'bg-cream-deep text-ink-soft'
                    }`}
                  >
                    {count}
                  </span>
                </span>
                <span className="mt-4 block font-display text-3xl text-ink">
                  {item.label}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-mute">
                  {item.blurb}
                </span>
              </button>
            )
          })}
        </section>

        {isAdmin && (
          <section
            className="animate-fade-up mt-8 grid gap-5 lg:grid-cols-[1.45fr_0.85fr]"
            style={{ animationDelay: '90ms' }}
          >
            <form
              className="admin-panel rounded-[28px] border border-line bg-paper/90 px-6 py-6 shadow-premium-soft md:px-8"
              noValidate
              onSubmit={handleSaveDrive}
            >
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-live">
                    Admin controls
                  </p>
                  <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">
                    {editingId ? 'Edit drive post' : 'Create drive post'}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOpenStatusOverlay}
                    className="self-start rounded-full border border-live/35 bg-live/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-live transition hover:bg-live/15"
                  >
                    View status
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetDriveForm}
                      className="self-start rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-mute transition hover:border-ink/50 hover:text-ink"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-ink-soft">
                  Role title
                  <input
                    type="text"
                    value={driveForm.title}
                    onChange={(event) =>
                      updateDriveField('title', event.target.value)
                    }
                    className="premium-input"
                    placeholder="Frontend Engineer"
                  />
                </label>
                <label className="text-sm text-ink-soft">
                  Company
                  <input
                    type="text"
                    value={driveForm.company}
                    onChange={(event) =>
                      updateDriveField('company', event.target.value)
                    }
                    className="premium-input"
                    placeholder="Company name"
                  />
                </label>
                <label className="text-sm text-ink-soft">
                  Section
                  <select
                    value={driveForm.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value
                      setDriveForm((current) => ({
                        ...current,
                        status: nextStatus,
                        select:
                          nextStatus === 'completed' ? current.select : '',
                      }))
                    }}
                    className="premium-input"
                  >
                    {SECTIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-ink-soft">
                  Eligibility criteria
                  <input
                    type="text"
                    value={driveForm.eligibilityCriteria}
                    onChange={(event) =>
                      updateDriveField('eligibilityCriteria', event.target.value)
                    }
                    className="premium-input"
                    placeholder="CGPA 7+, CSE/ECE/IT, no active backlogs"
                  />
                </label>
                <label className="text-sm text-ink-soft">
                  Batch
                  <input
                    type="number"
                    min="0"
                    value={driveForm.batch}
                    onChange={(event) =>
                      updateDriveField('batch', event.target.value)
                    }
                    className="premium-input"
                    placeholder="2026"
                  />
                </label>
                {driveForm.status === 'completed' && (
                  <label className="text-sm text-ink-soft">
                    Selected students
                    <input
                      type="number"
                      min="0"
                      value={driveForm.select}
                      onChange={(event) =>
                        updateDriveField('select', event.target.value)
                      }
                      className="premium-input"
                      placeholder="42"
                    />
                  </label>
                )}
                <label className="text-sm text-ink-soft">
                  Drive date
                  <input
                    type="text"
                    value={driveForm.dateLabel}
                    onChange={(event) =>
                      updateDriveField('dateLabel', event.target.value)
                    }
                    className="premium-input"
                    placeholder="Friday, 5 September 2026"
                  />
                </label>
                <label className="text-sm text-ink-soft">
                  Expected CTC
                  <input
                    type="text"
                    value={driveForm.ctc}
                    onChange={(event) =>
                      updateDriveField('ctc', event.target.value)
                    }
                    className="premium-input"
                    placeholder="Rs 12-18 LPA"
                  />
                </label>
                <label className="text-sm text-ink-soft md:col-span-2">
                  Company application form link
                  <input
                    type="url"
                    value={driveForm.applicationLink}
                    onChange={(event) =>
                      updateDriveField('applicationLink', event.target.value)
                    }
                    className="premium-input"
                    placeholder="https://company.com/careers/apply"
                  />
                </label>
                <label className="text-sm text-ink-soft md:col-span-2">
                  JD Google Drive link
                  <input
                    type="url"
                    value={driveForm.jdGoogleDriveLink}
                    onChange={(event) =>
                      updateDriveField('jdGoogleDriveLink', event.target.value)
                    }
                    className="premium-input"
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </label>
                <label className="text-sm text-ink-soft md:col-span-2">
                  Tags
                  <input
                    type="text"
                    value={driveForm.tags}
                    onChange={(event) =>
                      updateDriveField('tags', event.target.value)
                    }
                    className="premium-input"
                    placeholder="React, DSA, SQL"
                  />
                </label>
                <label className="text-sm text-ink-soft md:col-span-2">
                  Description
                  <textarea
                    value={driveForm.description}
                    onChange={(event) =>
                      updateDriveField('description', event.target.value)
                    }
                    className="premium-input min-h-24 resize-y"
                    placeholder="Share drive details, eligibility and application notes."
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={savingDrive}
                  className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-cream transition hover:bg-gold-bright"
                >
                  {savingDrive
                    ? 'Saving...'
                    : editingId
                      ? 'Update drive'
                      : 'Create post'}
                </button>
                {driveMessage && (
                  <p className="text-sm text-live">{driveMessage}</p>
                )}
              </div>
            </form>

            <form
              className="admin-panel rounded-[28px] border border-line bg-paper/90 px-6 py-6 shadow-premium-soft md:px-8"
              onSubmit={handleCreateAdmin}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-live">
                Admin access
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">
                Add admin
              </h2>
              <div className="mt-5 space-y-4">
                <label className="block text-sm text-ink-soft">
                  Name
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(event) =>
                      setAdminForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="premium-input"
                    placeholder="Admin name"
                  />
                </label>
                <label className="block text-sm text-ink-soft">
                  Email
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(event) =>
                      setAdminForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="premium-input"
                    placeholder="admin@college.edu"
                  />
                </label>
                <label className="block text-sm text-ink-soft">
                  Password
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(event) =>
                      setAdminForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="premium-input"
                    placeholder="Minimum 8 characters"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={savingAdmin}
                className="mt-5 w-full rounded-full border border-live/35 bg-live/10 px-5 py-3 text-sm font-semibold text-live transition hover:bg-live/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAdmin ? 'Creating admin...' : 'Create admin'}
              </button>
              {adminMessage && (
                <p className="mt-3 text-sm text-live">{adminMessage}</p>
              )}
            </form>
          </section>
        )}

        <section
          key={section}
          className="animate-fade-up mt-10"
          style={{ animationDelay: '40ms' }}
        >
          <div className="mb-8 flex flex-col gap-3 border-b border-line/80 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mute-light">
                {activeMeta.eyebrow}
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-ink md:text-4xl">
                {activeMeta.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-mute">
                {activeMeta.blurb}
              </p>
            </div>
            <p className="text-sm text-mute">
              Showing{' '}
              <span className="font-medium text-ink-soft">{filtered.length}</span>{' '}
              placement post{filtered.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block flex-1 text-[10px] font-medium uppercase tracking-[0.18em] text-mute-light">
                Search opportunities
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="premium-input mt-3 max-w-xl"
                  placeholder="Search company, role, CTC or skill"
                />
              </label>

              {!isAdmin && (
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-cream transition hover:bg-gold-bright">
                    {matchingResume ? 'Matching...' : 'Upload resume'}
                    <input
                      type="file"
                      accept=".pdf,.txt,application/pdf,text/plain"
                      className="sr-only"
                      disabled={matchingResume}
                      onChange={handleResumeUpload}
                    />
                  </label>
                  {resumeMatchMessage && (
                    <p className="max-w-sm text-sm text-mute lg:text-right">
                      {resumeMatchMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-line bg-paper/50 px-8 py-16 text-center">
              <p className="font-display text-2xl text-ink-soft">
                {loadingPosts
                  ? 'Loading posts...'
                  : searchQuery.trim()
                    ? 'No matching opportunities'
                    : 'Nothing here yet'}
              </p>
              <p className="mt-2 text-sm text-mute">
                {loadingPosts
                  ? 'Retrieving the latest placement opportunities.'
                  : searchQuery.trim()
                    ? 'Try a different company, role, CTC or skill.'
                    : 'New opportunities in this section will appear as they open.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filtered.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <OpportunityCard
                    opportunity={item}
                    index={index}
                    isAdmin={isAdmin}
                    matchPercentage={resumeMatches[item.id]}
                    onEdit={handleEditDrive}
                    onDelete={handleDeleteDrive}
                    deleting={deletingDriveId === item.id}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {statusOverlay}
    </div>
  )
}
