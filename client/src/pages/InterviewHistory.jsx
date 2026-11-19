import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsBriefcase } from 'react-icons/bs'
import { FiArrowLeft, FiArrowRight, FiClock } from 'react-icons/fi'
import axios from 'axios'
import { ServerUrl } from '../config/api'

function InterviewHistory() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const requestInterviews = useCallback(
    () => axios.get(ServerUrl + '/api/interview/get-interviews', { withCredentials: true }),
    []
  )

  const handleLoadError = (requestError) => {
      console.error('Unable to load interview history.', {
        status: requestError?.response?.status || 'network-error',
        code: requestError?.code || 'unknown',
      })
      setError(requestError?.response?.data?.message || 'Your interview history could not be loaded.')
  }

  useEffect(() => {
    let active = true
    requestInterviews()
      .then((result) => {
        if (active) setInterviews(result.data)
      })
      .catch((requestError) => {
        if (active) handleLoadError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [requestInterviews])

  const retryLoading = () => {
    setLoading(true)
    setError('')
    requestInterviews()
      .then((result) => setInterviews(result.data))
      .catch(handleLoadError)
      .finally(() => setLoading(false))
  }

  return (
    <main className="subpage">
      <header className="subpage-header">
        <button type="button" className="icon-button" onClick={() => navigate('/')} aria-label="Back to home">
          <FiArrowLeft aria-hidden="true" />
        </button>
        <div>
          <span className="eyebrow">Your preparation</span>
          <h1>Interview history</h1>
          <p>Pick up where you left off and revisit your interview feedback.</p>
        </div>
      </header>

      {loading ? (
        <div className="loading-state" role="status">Loading your interviews…</div>
      ) : error ? (
        <div className="error-state" role="alert">
          <p>{error}</p>
          <button type="button" className="button button--outline" onClick={retryLoading}>Try again</button>
        </div>
      ) : interviews.length === 0 ? (
        <section className="empty-state">
          <div className="empty-icon"><BsBriefcase aria-hidden="true" /></div>
          <h2>Your practice starts here</h2>
          <p>Completed interview sessions will appear here, along with their scores and feedback.</p>
          <button type="button" className="button" onClick={() => navigate('/interview')}>
            Start an interview <FiArrowRight aria-hidden="true" />
          </button>
        </section>
      ) : (
        <section className="history-list" aria-label="Past interview sessions">
          {interviews.map((item) => {
            const date = item.createdAt ? new Date(item.createdAt) : null
            const dateLabel = date && !Number.isNaN(date.getTime())
              ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
              : 'Date unavailable'
            const completed = item.status?.trim().toLowerCase() === 'completed'
            return (
              <button type="button" className="history-item" key={item._id} onClick={() => navigate(`/report/${item._id}`)}>
                <div className="history-role">
                    <span className="history-icon"><BsBriefcase aria-hidden="true" /></span>
                    <div className="history-copy">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">{item.mode || 'Interview'}</span>
                    <h2>{item.role || 'Interview session'}</h2>
                      <span className="history-date"><span>{item.experience || 'Experience not specified'}</span><span aria-hidden="true">·</span><FiClock aria-hidden="true" /> {dateLabel}</span>
                  </div>
                </div>
                <span className="history-meta">
                  <span className="history-score">{item.finalScore ?? 0}<span>/10 score</span></span>
                  <span className={`status-badge${completed ? ' status-badge--complete' : ''}`}>{item.status || 'In progress'}</span>
                  <FiArrowRight aria-hidden="true" />
                </span>
              </button>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default InterviewHistory
