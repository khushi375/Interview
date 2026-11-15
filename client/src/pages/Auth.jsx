import { useState } from 'react'
import {BsRobot} from "react-icons/bs"
import {IoSparkles} from "react-icons/io5"
import {motion} from "motion/react"
import {FcGoogle} from "react-icons/fc"
import { auth, provider } from '../utils/firebase';
import { signInWithPopup } from 'firebase/auth'
import axios from 'axios'
import { ServerUrl } from '../config/api';
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
function Auth({isModel=false}) {
  const dispatch = useDispatch()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState("")

const handleGoogleAuth = async () => {
  if (isSigningIn) return
  setIsSigningIn(true)
  setAuthError("")
  try {
    const response = await signInWithPopup(auth, provider);
   const idToken = await response.user.getIdToken();
   const result= await axios.post(
     ServerUrl + '/api/auth/google',
     { idToken },
     { withCredentials: true }
   );
   dispatch(setUserData(result.data));
   
  } 
  catch (error) {
    console.error("Google sign-in failed.", {
      code: error?.code || "unknown",
      status: error?.response?.status,
    });
    dispatch(setUserData(null));
    setAuthError(
      error?.response?.data?.message ||
      "Google sign-in could not be completed. Please try again."
    )
  } finally {
    setIsSigningIn(false)
  }
}
return (
    <div className={`
      w-full 
      ${isModel?"py-4":"min-h-screen bg=[#f3f3f3] flex items-center justify-center px-6 py-20"}`}> 
      <motion.div
       initial={{ opacity: 0, y: -40 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 1.05 }}
       className={`w-full ${isModel ? "max-w-md p-8 rounded-3xl": "max-w-lg p-12 rounded-[32px]"} bg-white shadow-2xl border border-gray-200`}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18}/>
          </div>
          <h2 className="text-lg font-semibold ">InterviewIQ.AI</h2>
        </div>

        <h1 className="text-2xl font-semibold text-center md:text-3xl leading-snug mb-4">
          Continue with   <span className='bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2'>
            <IoSparkles size={16} /> AI Smart Interview</span>
          </h1>
          <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
        Sign in to start AI-powered mock interviews, 
        track your progress, and unlock detailed performance insights.
          </p>
          {authError && (
            <p className="mb-4 text-center text-sm text-red-600" role="alert">
              {authError}
            </p>
          )}
          <motion.button
          onClick={handleGoogleAuth}
            disabled={isSigningIn}
            whileHover={{ opacity:0.7, scale: 1.03 }}
            whileTap={{ opacity:1, scale: 0.98 }}
            className='w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md'>
            <FcGoogle size={20} />
            {isSigningIn ? "Signing in..." : "Continue with Google"}
          </motion.button>
      </motion.div>
    </div>
  )
}

export default Auth
