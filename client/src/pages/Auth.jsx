import { useState } from 'react'
import { BsRobot } from 'react-icons/bs'
import { IoSparkles } from 'react-icons/io5'
import { FcGoogle } from 'react-icons/fc'
import { auth, provider } from '../utils/firebase'
import { signInWithPopup } from 'firebase/auth'
import axios from 'axios'
import { ServerUrl } from '../config/api'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function Auth({ isModel = false }) {
  const dispatch = useDispatch()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleGoogleAuth = async () => {
    if (isSigningIn) return
    setIsSigningIn(true)
    setAuthError('')
    try {
      const response = await signInWithPopup(auth, provider)
      const idToken = await response.user.getIdToken()
      const result = await axios.post(
        ServerUrl + '/api/auth/google',
        { idToken },
        { withCredentials: true }
      )
      dispatch(setUserData(result.data))
    } catch (error) {
      console.error('Google sign-in failed.', {
        code: error?.code || 'unknown',
        status: error?.response?.status,
      })
      dispatch(setUserData(null))
      setAuthError(
        error?.response?.data?.message ||
        'Google sign-in could not be completed. Please try again.'
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className={isModel ? '' : 'auth-page'}>
      {!isModel && (
        <aside className="auth-aside">
          <a className="brand" href="/">
            <span className="brand-mark"><BsRobot size={18} /></span>
            <span className="brand-name">InterviewIQ<span>.AI</span></span>
          </a>
          <div className="auth-aside-copy">
            <span className="eyebrow eyebrow--light"><IoSparkles /> A better kind of practice</span>
            <h1>Make your next interview your best one.</h1>
            <p>Practice with role-specific AI interviews, then turn each answer into a more confident one.</p>
          </div>
          <div className="auth-aside-foot">Thoughtful practice. Measurable progress.</div>
        </aside>
      )}
      <main className="auth-panel">
        <section className="auth-card" aria-labelledby="auth-title">
          <a className="brand" href="/">
            <span className="brand-mark"><BsRobot size={18} /></span>
            <span className="brand-name">InterviewIQ<span>.AI</span></span>
          </a>
          <h2 id="auth-title">Welcome to a sharper you.</h2>
          <p>Sign in securely to practice interviews, review your feedback, and pick up where you left off.</p>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSigningIn}
            className="google-button"
            aria-busy={isSigningIn}
          >
            <FcGoogle size={19} aria-hidden="true" />
            {isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
          </button>
          <div className="auth-legal">By continuing, you agree to use InterviewIQ.AI responsibly. Your account is secured through Google authentication.</div>
        </section>
      </main>
    </div>
  )
}

export default Auth
