import { useState, useEffect } from 'react'
import { Head, Link } from '@inertiajs/react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { setUser } = useAuth()

  // Check for success message from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const message = urlParams.get('message')
      if (message) {
        setSuccessMessage(message)
        // Clean up URL
        window.history.replaceState({}, '', '/login')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure we're on the client side
    if (typeof window === 'undefined') return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('auth_token', data.token)
        setUser(data.user)
        
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        setErrors(data.errors || { general: data.message })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <Head title="Login - Race Track" />
      <div className="min-h-screen bg-[#1C1C1E] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <svg width="80" height="80" viewBox="0 0 2048 2048" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
                <path d="M1112.56 742.52C1137.5 742.52 1168.43 741.731 1193.36 741.291L1248.05 740.343C1257.56 740.227 1267.48 739.521 1276.9 740.556C1276.86 742.975 1275.19 744.317 1273.75 746.208C1250.55 783.615 1224.05 819.706 1199.22 856.096C1190.25 869.248 1180.23 882.315 1172.24 896.065C1174.23 897.375 1175.91 897.48 1178.21 897.805C1185.53 895.218 1259.91 896.217 1272.37 896.941L1256.73 918.041L1170.55 1031.62C1163.56 1040.83 1149.38 1062.73 1141.85 1069.25L1134.6 1079.14C1131.29 1083.43 1128.09 1088.24 1124.28 1092.08C1101.5 1125 1085.6 1143 1064.23 1177.8C1055.17 1189.46 1035.6 1222.03 1023 1228.5C1021.25 1229.4 1017.53 1228.04 1016.4 1226.69C1014.66 1224.61 1014.82 1221.64 1015.39 1219.16C1016.37 1214.89 1018.39 1211.21 1019.88 1207.13C1046.58 1133.39 1076.8 1058.1 1108.39 986.207C1098.51 986.163 1088.63 986.065 1078.75 985.911C1061.44 986.55 1043.93 986.031 1026.59 986.032C1030.54 952.504 1099.5 777 1112.56 742.52Z" fill="url(#paint0_linear_44689_2672)"/>
                <defs>
                  <linearGradient id="paint0_linear_44689_2672" x1="825.5" y1="1031" x2="1047.79" y2="779.83" gradientUnits="userSpaceOnUse">
                    <stop offset="0.035" stopColor="#FFB30F"/>
                    <stop offset="0.505" stopColor="#FFBA06"/>
                    <stop offset="1" stopColor="#D73E47"/>
                  </linearGradient>
                </defs>
              </svg>
            </Link>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-gray-400 mt-2">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <div className="bg-[#2C2C2E] p-8 rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded">
                  {successMessage}
                </div>
              )}
              
              {errors.general && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1C1C1E] border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 text-white"
                  placeholder="Enter your email"
                  required
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1C1C1E] border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 text-white"
                  placeholder="Enter your password"
                  required
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-orange-500 hover:text-orange-400">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
