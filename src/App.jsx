import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'
import Home from './pages/Home.jsx'
import Demo from './pages/Demo.jsx'
import UseCasesPage from './pages/UseCasesPage.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import WorkspaceSetup from './pages/WorkspaceSetup.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-cream text-ink">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<ProtectedRoute><Demo /></ProtectedRoute>} />
            <Route path="/use-cases" element={<UseCasesPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/workspace-setup" element={<ProtectedRoute requireWorkspace={false}><WorkspaceSetup /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
