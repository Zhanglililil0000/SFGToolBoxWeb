import { Link } from 'react-router-dom'
import './HomePage.css'

const features = [
  {
    path: '/data-processing',
    title: 'SFG Data Processing',
    description: 'Upload and normalize SFG spectral data, spike removal, wavenumber conversion, generate charts',
    icon: '📊',
  },
  {
    path: '/calculator',
    title: 'SFG Calculator',
    description: 'Quartz refractive index, Fresnel factors, focusing parameters, second-order nonlinear susceptibility calculation',
    icon: '🔬',
  },
  {
    path: '/database',
    title: 'SFG Database',
    description: 'Browse, search and manage SFG spectral data, intensity ranking visualization, spectrum viewing',
    icon: '🗄️',
  },
]

function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>SFG Tool Box</h1>
        <p className="hero-subtitle">
          Sum Frequency Generation Spectroscopy Research Tool Box
        </p>
      </section>
      <section className="feature-grid">
        {features.map((feature) => (
          <Link to={feature.path} key={feature.path} className="feature-card">
            <span className="feature-icon">{feature.icon}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}

export default HomePage
