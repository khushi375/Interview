import { useCallback, useEffect, useRef, useState } from 'react'
import maleVideo from '../assets/videos/male-ai.mp4'
import femaleVideo from '../assets/videos/female-ai.mp4'
import Timer from './Timer'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import { BsArrowRight, BsRobot } from 'react-icons/bs'
import axios from 'axios'
import { ServerUrl } from '../config/api'

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions = [], userName } = interviewData
  const speechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  const [isIntroPhase, setIsIntroPhase] = useState(true)
  const [isMicOn, setIsMicOn] = useState(speechSupported)
  const [isAIPlaying, setIsAIPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [voiceGender, setVoiceGender] = useState('female')
  const [subtitle, setSubtitle] = useState('')
  const [requestError, setRequestError] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef(null)
  const videoRef = useRef(null)
  const micEnabledRef = useRef(speechSupported)
  const introStartedRef = useRef(false)
  const spokenQuestionRef = useRef(-1)
  const autoSubmittedQuestionRef = useRef(-1)
  const currentQuestion = questions[currentIndex]
  const videoSource = voiceGender === 'male' ? maleVideo : femaleVideo

  const startMic = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
    } catch (error) {
      if (error?.name !== 'InvalidStateError') {
        setVoiceError('Voice input could not start. You can still type your answer.')
      }
    }
  }, [])

  const stopMic = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch (error) {
      if (error?.name !== 'InvalidStateError') {
        setVoiceError('Voice input could not be paused. You can still type your answer.')
      }
    }
  }, [])

  const speakText = useCallback((text) => new Promise((resolve) => {
    if (!window.speechSynthesis || !selectedVoice) {
      resolve()
      return
    }

    window.speechSynthesis.cancel()
    const humanText = text.replace(/,/g, ', ... ').replace(/\./g, '. ... ')
    const utterance = new SpeechSynthesisUtterance(humanText)
    utterance.voice = selectedVoice
    utterance.rate = 0.92
    utterance.pitch = 1.05
    utterance.volume = 1
    utterance.onstart = () => {
      setIsAIPlaying(true)
      stopMic()
      videoRef.current?.play()
    }
    utterance.onend = () => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
      setIsAIPlaying(false)
      if (micEnabledRef.current) startMic()
      window.setTimeout(() => {
        setSubtitle('')
        resolve()
      }, 300)
    }
    utterance.onerror = () => {
      setIsAIPlaying(false)
      resolve()
    }
    setSubtitle(text)
    window.speechSynthesis.speak(utterance)
  }), [selectedVoice, startMic, stopMic])

  useEffect(() => {
    const loadVoices = () => {
      if (!window.speechSynthesis) {
        setSelectedVoice(false)
        return
      }
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) {
        setSelectedVoice(false)
        return
      }

      const femaleVoice = voices.find((voice) =>
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('female')
      )
      if (femaleVoice) {
        setSelectedVoice(femaleVoice)
        setVoiceGender('female')
        return
      }

      const maleVoice = voices.find((voice) =>
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('mark') ||
        voice.name.toLowerCase().includes('male')
      )
      if (maleVoice) {
        setSelectedVoice(maleVoice)
        setVoiceGender('male')
        return
      }

      setSelectedVoice(voices[0])
      setVoiceGender('female')
    }

    loadVoices()
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    if (!speechSupported) return undefined

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
      setAnswer((previous) => `${previous} ${transcript}`.trim())
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        micEnabledRef.current = false
        setIsMicOn(false)
        setVoiceError('Microphone access was not allowed. You can still type your answer.')
      }
    }
    recognitionRef.current = recognition
    return () => {
      try {
        recognition.stop()
        recognition.abort()
      } catch (error) {
        if (error?.name !== 'InvalidStateError') {
          console.error('Unable to stop voice recognition.', { code: error?.name || 'unknown' })
        }
      }
    }
  }, [speechSupported])

  useEffect(() => {
    if (selectedVoice === null) return undefined
    let cancelled = false
    const runInterviewPrompt = async () => {
      if (isIntroPhase) {
        if (introStartedRef.current) return
        introStartedRef.current = true
        await speakText(`Hello ${userName}, welcome to the AI Smart Interview. You will be asked a series of questions. I hope you are feeling confident and ready.`)
        await speakText("Let's begin the interview. Good luck!")
        if (!cancelled) setIsIntroPhase(false)
        return
      }

      if (!currentQuestion || spokenQuestionRef.current === currentIndex) return
      spokenQuestionRef.current = currentIndex
      await new Promise((resolve) => window.setTimeout(resolve, 800))
      if (cancelled) return
      if (currentIndex === questions.length - 1) {
        await speakText('Alright, this one might be a bit more challenging')
      }
      await speakText(currentQuestion.question)
      if (!cancelled && micEnabledRef.current) startMic()
    }

    runInterviewPrompt()
    return () => {
      cancelled = true
    }
  }, [selectedVoice, isIntroPhase, currentIndex, currentQuestion, questions.length, speakText, startMic, userName])

  useEffect(() => {
    if (isIntroPhase || !currentQuestion) return undefined
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isIntroPhase, currentQuestion])

  const toggleMic = () => {
    const nextMicState = !isMicOn
    micEnabledRef.current = nextMicState
    if (nextMicState) startMic()
    else stopMic()
    setIsMicOn(nextMicState)
    setVoiceError('')
  }

  const submitAnswer = useCallback(async () => {
    if (isSubmitting || !currentQuestion) return
    stopMic()
    setIsSubmitting(true)
    setRequestError('')
    try {
      const result = await axios.post(
        ServerUrl + '/api/interview/submit-answer',
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken: (currentQuestion.timeLimit || 60) - timeLeft,
        },
        { withCredentials: true }
      )
      setFeedback(result.data.feedback)
      void speakText(result.data.feedback)
    } catch (error) {
      console.error('Unable to submit interview answer.', {
        status: error?.response?.status || 'network-error',
        code: error?.code || 'unknown',
      })
      setRequestError(error?.response?.data?.message || 'Your answer could not be submitted. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [answer, currentIndex, currentQuestion, interviewId, isSubmitting, speakText, stopMic, timeLeft])

  const finishInterview = useCallback(async () => {
    stopMic()
    setIsFinishing(true)
    setRequestError('')
    try {
      const result = await axios.post(ServerUrl + '/api/interview/finish', { interviewId }, { withCredentials: true })
      micEnabledRef.current = false
      setIsMicOn(false)
      onFinish(result.data)
    } catch (error) {
      console.error('Unable to finish interview.', {
        status: error?.response?.status || 'network-error',
        code: error?.code || 'unknown',
      })
      setRequestError(error?.response?.data?.message || 'Your interview could not be finished. Please try again.')
    } finally {
      setIsFinishing(false)
    }
  }, [interviewId, onFinish, stopMic])

  const handleNext = async () => {
    if (currentIndex + 1 >= questions.length) {
      await finishInterview()
      return
    }
    setAnswer('')
    setFeedback('')
    setRequestError('')
    await speakText('Get ready for the next question')
    const nextIndex = currentIndex + 1
    setTimeLeft(questions[nextIndex]?.timeLimit || 60)
    setCurrentIndex(nextIndex)
  }

  useEffect(() => {
    if (
      isIntroPhase || !currentQuestion || timeLeft !== 0 || isSubmitting || feedback ||
      autoSubmittedQuestionRef.current === currentIndex
    ) return undefined
    autoSubmittedQuestionRef.current = currentIndex
    const timeout = window.setTimeout(() => {
      void submitAnswer()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [currentIndex, currentQuestion, feedback, isIntroPhase, isSubmitting, submitAnswer, timeLeft])

  useEffect(() => () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }, [])

  return (
    <main className="interview-page">
      <section className="interview-shell" aria-label="Live interview">
        <aside className="interview-sidebar">
          <div className="interview-brand">
            <span className="brand">
              <span className="brand-mark"><BsRobot size={17} /></span>
              <span className="brand-name">InterviewIQ<span>.AI</span></span>
            </span>
            <span className="live-indicator"><span className="live-dot" /> Live</span>
          </div>
          <div className="interviewer-video">
            <video src={videoSource} key={videoSource} ref={videoRef} muted playsInline preload="auto" aria-label="AI interviewer" />
            {subtitle && <div className="video-caption" aria-live="polite">{subtitle}</div>}
          </div>
          <div className="interview-status">
            <div className="status-label">
              <span>Session status</span>
              {isAIPlaying && <span className="status-live" aria-live="polite">AI speaking</span>}
            </div>
            <div className="timer-wrap">
              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit || 60} />
            </div>
            <div className="question-progress">
              <span>Question</span><strong>{Math.min(currentIndex + 1, questions.length)} of {questions.length}</strong>
            </div>
            <div className="progress-track" role="progressbar" aria-label="Interview progress" aria-valuemin="0" aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
              <span style={{ width: `${questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }} />
            </div>
          </div>
        </aside>

        <div className="interview-main">
          <header className="interview-main-header">
            <div>
              <span className="eyebrow">Practice session</span>
              <h1>AI interview</h1>
            </div>
          </header>

          {isIntroPhase ? (
            <div className="interview-welcome" aria-live="polite">
              <div className="welcome-mark"><BsRobot aria-hidden="true" /></div>
              <h2>Getting your interview started</h2>
              <p>Your interviewer will introduce the session and read your first question. You can answer out loud or type in the response area.</p>
            </div>
          ) : (
            <>
              <section className="question-card" aria-live="polite">
                <p>Question {currentIndex + 1} <span>of {questions.length}</span></p>
                <h2>{currentQuestion?.question}</h2>
              </section>
              <label className="answer-label" htmlFor="answer">Your answer</label>
              <textarea
                id="answer"
                placeholder="Type your response here, or use the microphone to answer aloud…"
                onChange={(event) => setAnswer(event.target.value)}
                value={answer}
                className="answer-input"
                disabled={Boolean(feedback) || isSubmitting}
              />
              {voiceError && <p className="inline-warning" role="status">{voiceError}</p>}
              {requestError && <p className="inline-error" role="alert">{requestError}</p>}
              {!feedback ? (
                <div className="interview-controls">
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={isSubmitting || !speechSupported}
                    className="icon-button mic-button"
                    title={speechSupported ? (isMicOn ? 'Pause voice input' : 'Start voice input') : 'Voice input is not supported in this browser'}
                    aria-label={speechSupported ? (isMicOn ? 'Pause voice input' : 'Start voice input') : 'Voice input is not supported in this browser'}
                    aria-pressed={isMicOn}
                  >
                    {isMicOn ? <FaMicrophone aria-hidden="true" /> : <FaMicrophoneSlash aria-hidden="true" />}
                  </button>
                  <button type="button" onClick={submitAnswer} disabled={isSubmitting} className="button" aria-busy={isSubmitting}>
                    {isSubmitting ? 'Reviewing your answer…' : 'Submit answer'}
                    {!isSubmitting && <BsArrowRight aria-hidden="true" />}
                  </button>
                </div>
              ) : (
                <section className="feedback-card" aria-live="polite">
                  <p>{feedback}</p>
                  <button type="button" onClick={handleNext} disabled={isFinishing} className="button" aria-busy={isFinishing}>
                    {isFinishing ? 'Finishing interview…' : currentIndex + 1 >= questions.length ? 'Finish interview' : 'Next question'}
                    {!isFinishing && <BsArrowRight aria-hidden="true" />}
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default Step2Interview
