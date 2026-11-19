import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { FaArrowLeft } from 'react-icons/fa'
import { FaCheck } from 'react-icons/fa6'
import axios from 'axios'
import { ServerUrl } from '../config/api'
import { setUserData } from '../redux/userSlice'

function Pricing() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      credits: 500,
      description: 'Perfect for beginners starting interview preparation.',
      features: ['500 AI Interview Credits', 'Basic Performance Report', 'Voice Interview Access', 'Limited History Tracking'],
    },
    {
      id: 'basic',
      name: 'Starter Pack',
      price: '₹100',
      credits: 650,
      description: 'Great for focused practice and skill improvement.',
      features: ['650 AI Interview Credits', 'Detailed Feedback', 'Performance Analytics', 'Full Interview History'],
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      price: '₹500',
      credits: 850,
      description: 'Best value for serious job preparation.',
      features: ['850 AI Interview Credits', 'Advanced AI Feedback', 'Skill Trend Analytics', 'Priority AI Processing'],
      badge: 'Best value',
    },
  ]

  const handlePayment = async (plan) => {
    setPaymentError('')
    setPaymentMessage('')
    setLoadingPlan(plan.id)
    try {
      const amount = plan.id === 'basic' ? 100 : plan.id === 'pro' ? 500 : 0
      const result = await axios.post(
        ServerUrl + '/api/payment/order',
        { planId: plan.id, amount, credits: plan.credits },
        { withCredentials: true }
      )

      if (!window.Razorpay) {
        throw new Error('Payment checkout is unavailable. Please refresh and try again.')
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.data.amount,
        currency: 'INR',
        name: 'InterviewIQ.AI',
        description: `${plan.name} - ${plan.credits} Credits`,
        order_id: result.data.id,
        handler: async (response) => {
          setLoadingPlan(plan.id)
          try {
            const verifyPayment = await axios.post(ServerUrl + '/api/payment/verify', response, { withCredentials: true })
            dispatch(setUserData(verifyPayment.data.user))
            setPaymentMessage('Payment successful. Your credits have been added.')
          } catch (error) {
            console.error('Payment verification failed.', {
              status: error?.response?.status || 'network-error',
              code: error?.code || 'unknown',
            })
            setPaymentError(error?.response?.data?.message || 'Payment was received but could not be verified. Please contact support.')
          } finally {
            setLoadingPlan(null)
          }
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
        theme: { color: '#00849a' },
      }

      const checkout = new window.Razorpay(options)
      checkout.on('payment.failed', (event) => {
        setPaymentError(event?.error?.description || 'Payment could not be completed. Please try again.')
        setLoadingPlan(null)
      })
      checkout.open()
      setLoadingPlan(null)
    } catch (error) {
      console.error('Unable to start checkout.', {
        status: error?.response?.status || 'network-error',
        code: error?.code || 'unknown',
      })
      setPaymentError(error?.response?.data?.message || error.message || 'Could not start checkout. Please try again.')
      setLoadingPlan(null)
    }
  }

  return (
    <main className="subpage">
      <header className="subpage-header">
        <button type="button" className="icon-button" onClick={() => navigate('/')} aria-label="Back to home">
          <FaArrowLeft aria-hidden="true" />
        </button>
        <div>
          <span className="eyebrow">Interview credits</span>
          <h1>Choose how you practice</h1>
          <p>Pick a credit plan that fits your preparation goals.</p>
        </div>
      </header>

      {paymentError && <p className="error-state" role="alert">{paymentError}</p>}
      {paymentMessage && (
        <div className="empty-state" role="status">
          <div className="empty-icon"><FaCheck aria-hidden="true" /></div>
          <h2>{paymentMessage}</h2>
          <button type="button" className="button" onClick={() => navigate('/')}>Continue to InterviewIQ.AI</button>
        </div>
      )}

      {!paymentMessage && (
        <section className="pricing-grid" aria-label="Credit plans">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id
            return (
              <article className={`plan-card${isSelected ? ' plan-card--selected' : ''}`} key={plan.id}>
                {plan.badge && <span className="plan-badge">{plan.badge}</span>}
                <h2>{plan.name}</h2>
                <div className="plan-price">{plan.price}<small> / one-time</small></div>
                <p className="plan-credits">{plan.credits} credits</p>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature) => <li key={feature}><FaCheck aria-hidden="true" />{feature}</li>)}
                </ul>
                {plan.id === 'free' ? (
                  <button type="button" className="button button--outline plan-action" disabled>Included</button>
                ) : (
                  <button
                    type="button"
                    className={`button plan-action${isSelected ? '' : ' button--outline'}`}
                    disabled={loadingPlan === plan.id || Boolean(loadingPlan)}
                    onClick={() => {
                      if (!isSelected) {
                        setSelectedPlan(plan.id)
                      } else {
                        handlePayment(plan)
                      }
                    }}
                    aria-busy={loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? 'Opening secure checkout…' : isSelected ? 'Continue to payment' : 'Choose this plan'}
                  </button>
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default Pricing
