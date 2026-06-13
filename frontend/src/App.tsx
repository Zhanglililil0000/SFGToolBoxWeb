import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DataProcessingPage from './pages/DataProcessingPage'
import CalculatorPage from './pages/CalculatorPage'
import DatabasePage from './pages/DatabasePage'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/data-processing" element={<DataProcessingPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/database" element={<DatabasePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
