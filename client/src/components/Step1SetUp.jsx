import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { BsBriefcase, BsFileEarmarkPdf, BsMic, BsStars } from 'react-icons/bs'
import { FiArrowLeft, FiArrowRight, FiCheck, FiUploadCloud } from 'react-icons/fi'
import axios from 'axios'
import { ServerUrl } from '../config/api'
import { setUserData } from '../redux/userSlice'

function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('')
  const [mode, setMode] = useState('Technical')
  const [resumeFile, setResumeFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [resumeText, setResumeText] = useState('')
  const [analysisDone, setAnalysisDone] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [resumeWarning, setResumeWarning] = useState('')
  const [resumeError, setResumeError] = useState('')
  const [startError, setStartError] = useState('')

  const selectResume = (file) => {
    if (!file) return
    setResumeFile(file)
    setResumeError('')
    setResumeWarning('')
    setAnalysisDone(false)
  }

  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return
    setAnalyzing(true)
    setResumeWarning('')
    setResumeError('')
    const formdata = new FormData()
    formdata.append('resume', resumeFile)
    try {
      const result = await axios.post(ServerUrl + '/api/interview/resume', formdata, { withCredentials: true })
      setRole(result.data.role || '')
      setExperience(result.data.experience || '')
      setProjects(result.data.projects || [])
      setSkills(result.data.skills || [])
      setResumeText(result.data.resumeText || '')
      setResumeWarning(result.data.warning || '')
      setAnalysisDone(!result.data.warning)
    } catch (error) {
      console.error('Resume analysis failed.', {
        status: error?.response?.status || 'network-error',
        code: error?.code || 'unknown',
      })
      setResumeError(error?.response?.data?.message || 'Failed to analyze resume. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStart = async (event) => {
    event.preventDefault()
    setStartError('')
    setLoading(true)
    try {
      const result = await axios.post(
        ServerUrl + '/api/interview/generate-questions',
        { role: role.trim(), experience: experience.trim(), mode, resumeText, projects, skills },
        { withCredentials: true }
      )
      if (userData) dispatch(setUserData({ ...userData, credits: result.data.creditsLeft }))
      onStart(result.data)
    } catch (error) {
      setStartError(error?.response?.data?.message || 'Could not start the interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="workspace-page">
      <header className="workspace-top">
        <div className="workspace-heading">
          <span className="eyebrow">Interview preparation</span>
          <h1>Set up your practice</h1>
          <p>Make it relevant to the role you want.</p>
        </div>
        <button type="button" className="icon-button" onClick={() => navigate('/')} aria-label="Back to home">
          <FiArrowLeft aria-hidden="true" />
        </button>
      </header>

      <section className="setup-layout" aria-label="Interview setup">
        <aside className="setup-aside">
          <span className="eyebrow eyebrow--light"><BsStars aria-hidden="true" /> Your next step</span>
          <h2>Practice for the conversation ahead.</h2>
          <p>Set your focus, then work through a guided interview that adapts to your role and experience.</p>
          <div className="setup-benefits">
            <div className="setup-benefit"><span className="setup-benefit-icon"><BsBriefcase /></span>Role-specific questions</div>
            <div className="setup-benefit"><span className="setup-benefit-icon"><BsMic /></span>Voice or text answers</div>
            <div className="setup-benefit"><span className="setup-benefit-icon"><BsStars /></span>Feedback after each answer</div>
          </div>
        </aside>

        <div className="setup-main">
          <h2>Tell us what you’re preparing for</h2>
          <p className="setup-intro">Your details help tailor the questions. You can also add a resume for extra context.</p>
          <form onSubmit={handleStart}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="role">Target role</label>
                <input id="role" type="text" placeholder="e.g. Product designer" value={role} onChange={(event) => setRole(event.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="experience">Experience</label>
                <input id="experience" type="text" placeholder="e.g. 2 years" value={experience} onChange={(event) => setExperience(event.target.value)} required />
              </div>
              <div className="field field--full">
                <label htmlFor="interview-mode">Interview focus</label>
                <select id="interview-mode" value={mode} onChange={(event) => setMode(event.target.value)}>
                  <option value="Technical">Technical interview</option>
                  <option value="HR">HR interview</option>
                </select>
              </div>

              {!analysisDone && (
                <div className="field field--full">
                  <label htmlFor="resumeUpload">Resume context <span className="text-muted">(optional)</span></label>
                  <label
                    className="upload-zone"
                    htmlFor="resumeUpload"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      selectResume(event.dataTransfer.files?.[0])
                    }}
                  >
                    <span className="upload-icon"><FiUploadCloud aria-hidden="true" /></span>
                    <span className="upload-copy">
                      <strong>{resumeFile?.name || 'Choose a PDF resume or drop it here'}</strong>
                      <span>{resumeFile ? 'Selected and ready to analyze' : 'Your resume helps personalize your interview context'}</span>
                    </span>
                    {resumeFile && analysisDone && <FiCheck aria-label="Resume analyzed" />}
                    <input
                      id="resumeUpload"
                      className="upload-input"
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(event) => selectResume(event.target.files?.[0])}
                    />
                  </label>
                  {resumeFile && (
                    <button type="button" className="button button--outline" onClick={handleUploadResume} disabled={analyzing}>
                      <BsFileEarmarkPdf aria-hidden="true" />
                      {analyzing ? 'Analyzing resume…' : 'Analyze resume'}
                    </button>
                  )}
                  {resumeError && <p className="inline-error" role="alert">{resumeError}</p>}
                </div>
              )}

              {analysisDone && (
                <div className="field field--full">
                  <div className="resume-result">
                    <h3>Resume context added</h3>
                    {projects.length > 0 && (
                      <div>
                        <p className="resume-result-label">Projects</p>
                        <ul className="m-0 list-inside list-disc text-sm text-gray-600">
                          {projects.map((project, index) => <li key={`${project}-${index}`}>{project}</li>)}
                        </ul>
                      </div>
                    )}
                    {skills.length > 0 && (
                      <div>
                        <p className="resume-result-label">Skills</p>
                        <div className="skill-tags">{skills.map((skill, index) => <span className="skill-tag" key={`${skill}-${index}`}>{skill}</span>)}</div>
                      </div>
                    )}
                    {resumeFile && <p className="m-0 text-xs text-gray-500">{resumeFile.name}</p>}
                  </div>
                </div>
              )}
              {resumeWarning && <p className="field--full inline-warning" role="status">{resumeWarning}</p>}
              {resumeWarning && resumeText && (
                <details className="field--full text-sm text-gray-600">
                  <summary className="cursor-pointer">View extracted resume text</summary>
                  <p className="mt-2 whitespace-pre-wrap break-words">{resumeText.slice(0, 2000)}{resumeText.length > 2000 ? '…' : ''}</p>
                </details>
              )}
              {startError && <p className="field--full inline-error" role="alert">{startError}</p>}
            </div>
            <button type="submit" className="button setup-submit" disabled={!role.trim() || !experience.trim() || loading} aria-busy={loading}>
              {loading ? 'Preparing your interview…' : 'Start interview'}
              {!loading && <FiArrowRight aria-hidden="true" />}
            </button>
            <p className="setup-note">Your session details are used to generate this interview.</p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Step1SetUp
