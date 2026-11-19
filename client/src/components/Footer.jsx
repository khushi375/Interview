import { Link } from 'react-router-dom'
import { BsRobot } from 'react-icons/bs'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="brand" to="/" aria-label="InterviewIQ.AI home">
            <span className="brand-mark"><BsRobot size={17} /></span>
            <span className="brand-name">InterviewIQ<span>.AI</span></span>
          </Link>
          <p className="footer-copy">
            A focused space to practice interviews, get thoughtful feedback, and build confidence one answer at a time.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/#how-it-works">How it works</a>
          <a href="/#capabilities">Capabilities</a>
          <Link to="/pricing">Credit plans</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
