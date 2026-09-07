const API_URL = import.meta.env.VITE_API_URL
const AUTH_EXPIRED_EVENT = 'auth:expired'

function clearStoredAuthSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('authUser')
}

function redirectToSignIn(message) {
  clearStoredAuthSession()
  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: { message },
    }),
  )
}

async function request(path, options = {}) {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.message ?? `Request failed (${response.status})`
    if (response.status === 401) {
      redirectToSignIn(message)
    }
    throw new Error(message)
  }

  return data
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function normalizePost(post) {
  const status = post.section ?? post.status ?? 'live'

  return {
    id: post._id ?? post.id,
    status,
    title: post.roleTitle ?? post.title ?? '',
    company: post.company ?? '',
    description: post.description ?? '',
    dateLabel: formatDate(post.driveDate ?? post.dateLabel),
    eligibilityCriteria:
      post.eligibilityCriteria ??
      post.eligibility ??
      post.criteria ??
      post.statusLabel ??
      '',
    batch: post.batch ?? post.batchYear ?? '',
    select: post.select ?? post.selected ?? post.selectedCandidates ?? '',
    ctc: post.expectedCTC ?? post.ctc ?? '',
    applicationLink:
      post.applicationLink ??
      post.applyLink ??
      post.applyUrl ??
      post.applicationUrl ??
      post.formLink ??
      post.formUrl ??
      post.companyFormLink ??
      post.companyLink ??
      '',
    jdGoogleDriveLink:
      post.jdGoogleDriveLink ??
      post.jdDriveLink ??
      post.jdLink ??
      post.jobDescriptionLink ??
      post.jobDescriptionUrl ??
      '',
    tags: Array.isArray(post.tags) ? post.tags : [],
    accent: status === 'completed' ? 'stone' : 'sage',
  }
}

function serializePost(post) {
  return {
    roleTitle: post.title,
    company: post.company,
    section: post.status,
    eligibilityCriteria: post.eligibilityCriteria,
    statusLabel: post.eligibilityCriteria,
    batch: post.batch,
    select: post.select,
    driveDate: post.dateLabel,
    expectedCTC: post.ctc,
    applicationLink: post.applicationLink,
    jdGoogleDriveLink: post.jdGoogleDriveLink,
    tags: post.tags,
    description: post.description,
  }
}

function getSavedPost(data, fallbackPost) {
  const savedPost = data?.post ?? data?.data ?? data

  if (savedPost && typeof savedPost === 'object' && !Array.isArray(savedPost)) {
    return normalizePost(savedPost)
  }

  return fallbackPost
}

export async function fetchPosts() {
  const data = await request('/fetchPost/retrivePost')
  return (data.posts ?? []).map(normalizePost)
}

export async function createPost(post) {
  const data = await request('/adminCreatePost/createPost', {
    method: 'PUT',
    body: JSON.stringify(serializePost(post)),
  })
  return getSavedPost(data, post)
}

export async function editPost(id, post) {
  const data = await request(`/adminEditPost/editPost/${id}`, {
    method: 'PUT',
    body: JSON.stringify(serializePost(post)),
  })
  return getSavedPost(data, { ...post, id })
}

export async function deletePost(id) {
  return request(`/adminDeletePost/deletePost/${id}`, {
    method: 'DELETE',
  })
}

export async function matchResumeToOpportunities(resumeText, opportunities) {
  const data = await request('/application/resumeMatch', {
    method: 'POST',
    body: JSON.stringify({
      resumeText,
      opportunities,
    }),
  })

  return data.matches ?? []
}

function normalizePlacementStudent(student) {
  return {
    name: student.name ?? '',
    email: student.email ?? '',
    status: student.status ?? 'unplaced',
  }
}

export async function fetchPlacementReport() {
  const data = await request('/report/placementReport')
  return (data.data ?? []).map(normalizePlacementStudent)
}

export async function updatePlacementStatus(email, status) {
  const data = await request(`/setStatus/${status}`, {
    method: 'PUT',
    body: JSON.stringify({ email }),
  })

  return normalizePlacementStudent(data.data ?? { email, status })
}

function normalizeAdmin(admin) {
  return {
    name: admin.name ?? '',
    email: admin.email ?? '',
  }
}

export async function fetchAdmins() {
  const data = await request('/admin/adminData')
  return (data.data ?? []).map(normalizeAdmin)
}
