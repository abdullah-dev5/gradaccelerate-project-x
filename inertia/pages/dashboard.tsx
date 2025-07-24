import { Head, Link } from '@inertiajs/react'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <>
      <Head title="Dashboard - Race Track" />
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        {/* Header */}
        <header className="bg-[#2C2C2E] border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <svg width="40" height="40" viewBox="0 0 2048 2048" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <h1 className="text-xl font-bold">Race Track</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user?.fullName || 'User'}</span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-gray-400">Manage your projects, notes, and tasks</p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Notes Card */}
            <Link href="/notes" className="block">
              <div className="bg-[#2C2C2E] p-6 rounded-xl hover:bg-[#3C3C3E] transition-colors duration-200 border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Notes</h3>
                    <p className="text-gray-400 text-sm">Manage your notes</p>
                  </div>
                </div>
                <p className="text-gray-300">Capture ideas, thoughts, and important information in one place.</p>
              </div>
            </Link>

            {/* Projects Card */}
            <Link href="/projects" className="block">
              <div className="bg-[#2C2C2E] p-6 rounded-xl hover:bg-[#3C3C3E] transition-colors duration-200 border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Projects</h3>
                    <p className="text-gray-400 text-sm">Track your projects</p>
                  </div>
                </div>
                <p className="text-gray-300">Organize and monitor your project progress and milestones.</p>
              </div>
            </Link>

            {/* Todos Card */}
            <Link href="/todos" className="block">
              <div className="bg-[#2C2C2E] p-6 rounded-xl hover:bg-[#3C3C3E] transition-colors duration-200 border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Todos</h3>
                    <p className="text-gray-400 text-sm">Manage your tasks</p>
                  </div>
                </div>
                <p className="text-gray-300">Keep track of your daily tasks and stay organized.</p>
              </div>
            </Link>
          </div>

          {/* Quick Stats or Recent Activity Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/notes" className="bg-[#2C2C2E] p-4 rounded-lg hover:bg-[#3C3C3E] transition-colors border border-gray-700">
                <div className="flex items-center justify-between">
                  <span>Create New Note</span>
                  <span className="text-2xl">📝</span>
                </div>
              </Link>
              <Link href="/projects" className="bg-[#2C2C2E] p-4 rounded-lg hover:bg-[#3C3C3E] transition-colors border border-gray-700">
                <div className="flex items-center justify-between">
                  <span>New Project</span>
                  <span className="text-2xl">🚀</span>
                </div>
              </Link>
              <Link href="/todos" className="bg-[#2C2C2E] p-4 rounded-lg hover:bg-[#3C3C3E] transition-colors border border-gray-700">
                <div className="flex items-center justify-between">
                  <span>Add Todo</span>
                  <span className="text-2xl">✅</span>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
