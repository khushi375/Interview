import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function Timer({timeLeft, totalTime}) {
    const percentage = totalTime > 0
        ? Math.max(0, Math.min(100, (timeLeft / totalTime) * 100))
        : 0
    return (
        <div className="w-20 h-20" role="timer" aria-label={`${timeLeft} seconds remaining`}>
            <CircularProgressbar value={percentage} text={`${timeLeft}s`}
            styles={buildStyles({
                textSize: "23px",
                pathColor: "#00849a",
                textColor: "#303a50",
                trailColor: "#eceef5"
            })} />
        </div>
    )
    
}

export default Timer ;