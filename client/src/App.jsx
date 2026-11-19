import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'
import { ServerUrl } from './config/api'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Auth = lazy(() => import('./pages/Auth'))
const InterviewPage = lazy(() => import('./pages/InterviewPage'))
const InterviewHistory = lazy(() => import('./pages/InterviewHistory'))
const Pricing = lazy(() => import('./pages/Pricing'))
const InterviewReport = lazy(() => import('./pages/InterviewReport'))

function App() {
  const dispatch = useDispatch()
  useEffect(() => {
   const getUser= async()=>{
    try{
        const result = await axios.get(ServerUrl+"/api/user/current-user",{withCredentials:true})
        dispatch(setUserData(result.data))
    }catch(error){
        if (error?.response?.status !== 401) {
            console.error("Unable to restore the current session.", {
                status: error?.response?.status || "network-error",
                code: error?.code || "unknown",
            });
        }
        dispatch(setUserData(null))
    }
   }
   getUser()
},[dispatch])
  return (
  <Suspense fallback={<main className="subpage"><div className="loading-state" role="status">Loading InterviewIQ.AI…</div></main>}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/history" element={<InterviewHistory />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/report/:id" element={<InterviewReport />} />
    </Routes>
  </Suspense>
  )
}

export default App
