import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { BsCoin, BsRobot } from 'react-icons/bs'
import { FaBars, FaUserAstronaut } from 'react-icons/fa'
import { HiOutlineLogout } from 'react-icons/hi'
import { FiClock, FiCreditCard, FiX } from 'react-icons/fi'
import axios from 'axios'
import { ServerUrl } from '../config/api'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'

function Navbar() {
  const { userData } = useSelector((state) => state.user)
  const [activeMenu, setActiveMenu] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogout = async () => {
    setLogoutError('')
    try {
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true })
      dispatch(setUserData(null))
      setActiveMenu('')
      navigate('/')
    } catch (error) {
      console.error('Unable to sign out.', {
        status: error?.response?.status || 'network-error',
        code: error?.code || 'unknown',
      })
      setLogoutError('Could not sign out. Please try again.')
    }
  }

  const openProtectedMenu = (menu) => {
    if (!userData) {
      setShowAuth(true)
      return
    }
    setActiveMenu(activeMenu === menu ? '' : menu)
  }

  return (
    <>
      <header className="site-header">
        <nav className="site-nav" aria-label="Main navigation">
          <Link className="brand" to="/" aria-label="InterviewIQ.AI home">
            <span className="brand-mark"><BsRobot size={18} /></span>
            <span className="brand-name">InterviewIQ<span>.AI</span></span>
          </Link>
          <div className={`nav-links${menuOpen ? ' nav-links--open' : ''}`}>
            <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="/#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a>
            <Link to="/pricing" onClick={() => setMenuOpen(false)}>Credits</Link>
          </div>
          <div className="nav-actions">
            {userData ? (
              <div className="nav-account">
                <button type="button" className="credit-chip" onClick={() => openProtectedMenu('credits')} aria-expanded={activeMenu === 'credits'}>
                  <BsCoin aria-hidden="true" />
                  <span>{userData.credits ?? 0}</span>
                </button>
                {activeMenu === 'credits' && (
                  <div className="nav-popover">
                    <p>Available balance<strong>{userData.credits ?? 0} credits</strong></p>
                    <button type="button" onClick={() => { setActiveMenu(''); navigate('/pricing') }}>
                      <FiCreditCard aria-hidden="true" /> Explore credit plans
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="avatar-button"
                  onClick={() => openProtectedMenu('user')}
                  aria-label="Open account menu"
                  aria-expanded={activeMenu === 'user'}
                >
                  {userData.name?.trim()?.[0]?.toUpperCase() || <FaUserAstronaut aria-hidden="true" />}
                </button>
                {activeMenu === 'user' && (
                  <div className="nav-popover">
                    <p><strong>{userData.name || 'Your account'}</strong>{userData.email || ''}</p>
                    {logoutError && <p className="auth-error" role="alert">{logoutError}</p>}
                    <button type="button" onClick={() => { setActiveMenu(''); navigate('/history') }}>
                      <FiClock aria-hidden="true" /> Interview history
                    </button>
                    <button type="button" className="danger" onClick={handleLogout}>
                      <HiOutlineLogout aria-hidden="true" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="button nav-cta" onClick={() => setShowAuth(true)}>Get started</button>
            )}
            <button
              type="button"
              className="icon-button menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <FiX aria-hidden="true" /> : <FaBars aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </header>
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </>
  )
}

export default Navbar
