import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { FiArrowLeft } from 'react-icons/fi'
import { ServerUrl } from '../config/api'
import Step3Report from '../components/Step3Report'

function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const requestReport = useCallback(
    () => axios.get(ServerUrl + '/api/interview/report/' + id, { withCredentials: true }),
    [id]
  )

  const handleLoadError = (requestError) => {
      console.error('Unable to load interview report.', {
        status: requestError?.response?.status || 'network-error',
        code: requestError?.code || 'unknown',
      })
      setError(requestError?.response?.data?.message || 'This interview report could not be loaded.')
  }

  useEffect(() => {
    let active = true
    requestReport()
      .then((result) => {
        if (active) setReport(result.data)
      })
      .catch((requestError) => {
        if (active) handleLoadError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [requestReport])

  const retryFetchReport = () => {
    setLoading(true)
    setError('')
    requestReport()
      .then((result) => setReport(result.data))
      .catch(handleLoadError)
      .finally(() => setLoading(false))
  }

  if (loading) {
    return <main className="subpage"><div className="loading-state" role="status">Loading your report…</div></main>
  }

  if (error) {
    return (
      <main className="subpage">
        <div className="error-state" role="alert">
          <p>{error}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="button button--outline" onClick={() => navigate('/history')}>
              <FiArrowLeft aria-hidden="true" /> Back to history
            </button>
            <button type="button" className="button" onClick={retryFetchReport}>Try again</button>
          </div>
        </div>
      </main>
    )
  }

  return <Step3Report report={report} />
}

export default InterviewReport
