import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function Step3Report({ report }) {
  const navigate = useNavigate()
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  if (!report) {
    return <div className="subpage"><div className="loading-state" role="status">Loading report…</div></div>
  }

  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    questionWiseScore = [],
    questions = [],
  } = report
  const questionsData = questionWiseScore.length
    ? questionWiseScore
    : questions.map((question) => ({
      question: question.question,
      score: question.score || 0,
      feedback: question.feedback || '',
      confidence: question.confidence || 0,
      communication: question.communication || 0,
      correctness: question.correctness || 0,
    }))
  const questionScoreData = questionsData.map((item, index) => ({
    name: `Q${index + 1}`,
    score: Number(item.score) || 0,
  }))
  const skills = [
    { label: 'Confidence', value: confidence },
    { label: 'Communication', value: communication },
    { label: 'Correctness', value: correctness },
  ]
  const score = Number(finalScore) || 0
  const percentage = Math.max(0, Math.min(100, (score / 10) * 100))
  const performanceText = score >= 8
    ? 'Ready for job opportunities.'
    : score >= 5
      ? 'Needs minor improvement before interviews.'
      : 'Significant improvement required.'
  const shortTagline = score >= 8
    ? 'Excellent clarity and structured responses.'
    : score >= 5
      ? 'Good foundation, refine articulation.'
      : 'Work on clarity and confidence.'

  const downloadPDF = async () => {
    setIsExporting(true)
    setExportError('')
    try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let currentY = 25

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(0, 112, 132)
    doc.text('AI Interview Performance Report', pageWidth / 2, currentY, { align: 'center' })
    currentY += 5
    doc.setDrawColor(0, 132, 154)
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
    currentY += 15

    doc.setFillColor(228, 248, 250)
    doc.roundedRect(margin, currentY, contentWidth, 20, 4, 4, 'F')
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Final Score: ${score}/10`, pageWidth / 2, currentY + 12, { align: 'center' })
    currentY += 30

    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, 'F')
    doc.setFontSize(12)
    doc.text(`Confidence: ${confidence}`, margin + 10, currentY + 10)
    doc.text(`Communication: ${communication}`, margin + 10, currentY + 18)
    doc.text(`Correctness: ${correctness}`, margin + 10, currentY + 26)
    currentY += 45

    const advice = score >= 8
      ? 'Excellent performance. Maintain confidence and structure. Continue refining clarity and supporting answers with strong real-world examples.'
      : score >= 5
        ? 'Good foundation shown. Improve clarity and structure. Practice delivering concise, confident answers with stronger supporting examples.'
        : 'Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering aloud regularly.'
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(220)
    doc.roundedRect(margin, currentY, contentWidth, 35, 4, 4)
    doc.setFont('helvetica', 'bold')
    doc.text('Professional Advice', margin + 10, currentY + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(doc.splitTextToSize(advice, contentWidth - 20), margin + 10, currentY + 20)
    currentY += 50

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Question', 'Score', 'Feedback']],
      body: questionsData.map((question, index) => [
        `${index + 1}`,
        question.question || 'Question not available',
        `${question.score ?? 0}/10`,
        question.feedback || 'No feedback available for this question.',
      ]),
      styles: { fontSize: 9, cellPadding: 3, valign: 'top' },
      headStyles: { fillColor: [0, 132, 154], textColor: 255, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    })
    doc.save('AI_Interview_Report.pdf')
    } catch (error) {
      console.error('Unable to export interview report.', { code: error?.name || 'unknown' })
      setExportError('The PDF could not be created. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="subpage">
      <div className="report-wrap">
        <header className="report-top">
          <div className="report-title">
            <button type="button" onClick={() => navigate('/history')} className="icon-button" aria-label="Back to interview history">
              <FaArrowLeft aria-hidden="true" />
            </button>
            <div>
              <span className="eyebrow">Interview report</span>
              <h1>Performance review</h1>
              <p>A closer look at your answers and interview performance.</p>
            </div>
          </div>
          <button type="button" onClick={downloadPDF} disabled={isExporting} className="button" aria-busy={isExporting}>
            {isExporting ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </header>
        {exportError && <p className="inline-error" role="alert">{exportError}</p>}

        <div className="report-grid">
          <div className="report-column">
            <section className="report-card score-card">
              <h2>Overall performance</h2>
              <div className="score-meter">
                <CircularProgressbar
                  value={percentage}
                  text={`${score}/10`}
                  aria-label={`Overall score ${score} out of 10`}
                  styles={buildStyles({
                    textSize: '19px',
                    pathColor: '#00849a',
                    textColor: '#303a50',
                    trailColor: '#eceef5',
                  })}
                />
              </div>
              <p className="score-summary">{performanceText}</p>
              <p className="score-caption">{shortTagline}</p>
            </section>

            <section className="report-card">
              <h2>Skill evaluation</h2>
              <div className="skill-list">
                {skills.map((skill) => (
                  <div key={skill.label}>
                    <div className="skill-row-head"><span>{skill.label}</span><strong>{skill.value}/10</strong></div>
                    <div className="skill-bar" role="progressbar" aria-label={skill.label} aria-valuemin="0" aria-valuemax="10" aria-valuenow={Number(skill.value) || 0}>
                      <span style={{ width: `${Math.max(0, Math.min(100, (Number(skill.value) || 0) * 10))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="report-card">
              <h2>Keep building on this</h2>
              <p className="score-caption">Use the question feedback below to identify a specific answer to refine in your next practice session.</p>
              <button type="button" className="button button--outline" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/interview')}>
                Practice again
              </button>
            </section>
          </div>

          <div className="report-column">
            <section className="report-card">
              <h2>Score by question</h2>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={questionScoreData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#eef0f5" strokeDasharray="4 4" />
                    <XAxis dataKey="name" tick={{ fill: '#858fa2', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#858fa2', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ border: '1px solid #e4e9f1', borderRadius: 10, fontSize: 11 }} />
                    <Area type="monotone" dataKey="score" stroke="#00849a" fill="#e4f8fa" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="report-card">
              <h2>Question-by-question feedback</h2>
              <div className="question-breakdown">
                {questionsData.map((question, index) => (
                  <article className="report-question" key={`${index}-${question.question || 'question'}`}>
                    <div className="report-question-head">
                      <div>
                        <small>QUESTION {index + 1}</small>
                        <h3>{question.question || 'Question not available'}</h3>
                      </div>
                      <span className="question-score">{question.score ?? 0}/10</span>
                    </div>
                    <div className="report-feedback">
                      <strong>AI feedback</strong>
                      {question.feedback?.trim() || 'No feedback available for this question.'}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Step3Report
