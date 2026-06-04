import { Link } from 'react-router-dom'
import LogoMark from '../common/LogoMark.jsx'

export default function Footer() {
  return (
    <footer className="bg-forest text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <LogoMark size="sm" variant="light" />
            <div>
              <p className="display-font font-extrabold text-white">Niswarth <span className="text-green-200">AI</span></p>
              <p className="text-sm text-green-100/85">Selfless service, smarter impact.</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-green-50/80">A workspace for NGO campaign work, field updates, volunteer visibility, and reviewed impact reports.</p>
        </div>
        <div>
          <p className="font-bold text-white">Product</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-green-50/80">
            <Link to="/demo" className="hover:text-white">Workflow Dashboard</Link>
            <Link to="/use-cases" className="hover:text-white">How it Works</Link>
            <Link to="/about" className="hover:text-white">About</Link>
          </div>
        </div>
        <div>
          <p className="font-bold text-white">Contact</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-green-50/80">
            <Link to="/contact" className="hover:text-white">Contact developer</Link>
            <a href="https://github.com/Dhruvg334/niswarth-ai" target="_blank" rel="noreferrer" className="hover:text-white">GitHub repository</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-green-50/75">© 2026 Niswarth AI. Selfless service, smarter impact.</div>
    </footer>
  )
}
