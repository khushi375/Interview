import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  BsBarChart, BsBriefcase, BsClock, BsFileEarmarkText, BsMic,
  BsShieldCheck,
} from 'react-icons/bs'
import { HiSparkles } from 'react-icons/hi'
import { FiArrowUpRight } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AuthModel from '../components/AuthModel'
import hrImg from '../assets/HR.png'
import techImg from '../assets/tech.png'
import confidenceImg from '../assets/confi.png'
import creditImg from '../assets/credit.png'
import evalImg from '../assets/ai-ans.png'
import resumeImg from '../assets/resume.png'
import pdfImg from '../assets/pdf.png'
import analyticsImg from '../assets/history.png'

function Home() {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  const goTo = (path) => {
    if (!userData) {
      setShowAuth(true)
      return
    }
    navigate(path)
  }

  const steps = [
    { title: 'Choose your role', desc: 'Set a role, experience level, and interview style to tailor your practice.', icon: <BsBriefcase /> },
    { title: 'Practice out loud', desc: 'Answer AI-generated questions with voice input or by typing your response.', icon: <BsMic /> },
    { title: 'Learn from feedback', desc: 'Review question-by-question feedback and download your report as a PDF.', icon: <BsBarChart /> },
  ]
  const capabilities = [
    { image: evalImg, icon: <BsBarChart />, title: 'Question-level feedback', desc: 'See scores and AI feedback for each answer, alongside your overall performance.' },
    { image: resumeImg, icon: <BsFileEarmarkText />, title: 'Resume-informed practice', desc: 'Upload a PDF resume to extract relevant role, skills, and project context for your session.' },
    { image: pdfImg, icon: <BsFileEarmarkText />, title: 'A report you can keep', desc: 'Review strengths and improvement areas, then export your interview report to PDF.' },
    { image: analyticsImg, icon: <BsClock />, title: 'Session history', desc: 'Return to completed interviews and compare your results over time.' },
  ]
  const modes = [
    { img: hrImg, title: 'HR interview', desc: 'Practice behavioral and communication questions.' },
    { img: techImg, title: 'Technical interview', desc: 'Work through questions tailored to your chosen role.' },
    { img: confidenceImg, title: 'Voice practice', desc: 'Answer aloud with browser speech recognition where supported.' },
    { img: creditImg, title: 'Flexible credits', desc: 'Choose from the available credit plans when you need more practice.' },
  ]

  return (
    <div className="landing">
      <Navbar />
      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="hero-badge"><HiSparkles aria-hidden="true" /> Your next interview starts here</span>
              <h1>Practice with purpose. <span>Show up with confidence.</span></h1>
              <p>Role-based AI interview practice with thoughtful feedback on your answers, communication, and confidence.</p>
              <div className="hero-buttons">
                <button type="button" className="button" onClick={() => goTo('/interview')}>
                  Start practicing <FiArrowUpRight aria-hidden="true" />
                </button>
                <button type="button" className="button button--light-outline" onClick={() => goTo('/history')}>
                  View your history
                </button>
              </div>
              <div className="hero-note"><BsShieldCheck aria-hidden="true" /> Secure Google sign-in · Your practice, on your terms</div>
            </div>
            <div className="product-preview" aria-label="Illustration of the InterviewIQ interview workspace">
              <div className="preview-window">
                <div className="preview-top">
                  <span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" />
                  <span className="preview-label">INTERVIEWIQ.AI / PRACTICE</span>
                </div>
                <div className="preview-content">
                  <div className="preview-side" aria-hidden="true">
                    <div className="preview-side-mark" />
                    <div className="preview-side-line active" />
                    <div className="preview-side-line" />
                    <div className="preview-side-line" />
                    <div className="preview-side-line" />
                  </div>
                  <div className="preview-main">
                    <div className="preview-kicker">Interview workspace</div>
                    <h3>Make every answer count.</h3>
                    <div className="preview-session">
                      <div><span className="preview-session-label">PRACTICE MODE</span><strong>Role-based interview</strong></div>
                      <span className="preview-pill">AI guided</span>
                    </div>
                    <div className="preview-question">
                      <small>YOUR PRACTICE, YOUR PACE</small>
                      <p>Prepare with tailored questions, answer in your own words, and get feedback after each response.</p>
                    </div>
                    <div className="preview-wave" aria-hidden="true">
                      {[10, 17, 12, 24, 15, 21, 11, 25, 16, 10, 19, 13, 23, 12, 17, 9, 20, 13, 25, 11, 18, 12, 22, 10, 16, 12, 23, 15, 19, 9, 14].map((height, index) => (
                        <span key={index} style={{ height }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="content-width">
            <div className="section-heading">
              <span className="eyebrow">A clear path to better answers</span>
              <h2 className="section-title">Practice that feels like progress.</h2>
              <p className="section-copy">A simple, focused flow that takes you from interview setup to feedback you can act on.</p>
            </div>
            <div className="process-grid">
              {steps.map((step, index) => (
                <article className="process-item" key={step.title}>
                  <span className="step-number">STEP 0{index + 1}</span>
                  <div className="process-icon" aria-hidden="true">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--tint" id="capabilities">
          <div className="content-width">
            <div className="section-heading">
              <span className="eyebrow">Built around your preparation</span>
              <h2 className="section-title">Useful insight, without the noise.</h2>
              <p className="section-copy">Every capability is designed to support the interview practice already in InterviewIQ.AI.</p>
            </div>
            <div className="feature-grid">
              {capabilities.map((feature) => (
                <article className="feature-item" key={feature.title}>
                  <div className="feature-art"><img src={feature.image} alt="" loading="lazy" /></div>
                  <div className="feature-copy">
                    <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="content-width">
            <div className="section-heading">
              <span className="eyebrow">Practice your way</span>
              <h2 className="section-title">One workspace. Different ways to prepare.</h2>
              <p className="section-copy">Choose your interview focus and use the tools that fit the way you like to practice.</p>
            </div>
            <div className="mode-strip">
              {modes.map((mode) => (
                <article className="mode-item" key={mode.title}>
                  <img src={mode.img} alt="" loading="lazy" />
                  <h3>{mode.title}</h3>
                  <p>{mode.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--tint">
          <div className="content-width">
            <div className="closing-cta">
              <div>
                <h2>Ready to make your next answer stronger?</h2>
                <p>Start a practice session and get a clearer picture of what you already do well—and what to work on next.</p>
              </div>
              <button type="button" className="button" onClick={() => goTo('/interview')}>
                Start an interview <FiArrowUpRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default Home
