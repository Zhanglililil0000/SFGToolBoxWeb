import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const location = useLocation()

  const navItems = [
    { path: '/data-processing', label: 'SFG Data Processing' },
    { path: '/calculator', label: 'SFG Calculator' },
    { path: '/database', label: 'SFG Database' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          SFG Tool Box
        </Link>
        <ul className="navbar-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
