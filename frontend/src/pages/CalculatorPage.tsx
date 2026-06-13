import { useState } from 'react'
import './CalculatorPage.css'

const TABS = [
  { key: 'quartz', label: 'Quartz Calculator' },
  { key: 'focus', label: 'Focus Calculator' },
  { key: 'fresnel', label: 'Fresnel Calculator' },
] as const

type TabKey = typeof TABS[number]['key']

interface QuartzResult {
  sfg_wavelength: number
  sfg_angle: number
  ir_wavelength: number
  n_vis: number
  n_ir: number
  n_sfg: number
  vis_ref_angle: number
  ir_ref_angle: number
  sfg_ref_angle: number
  coherence_length: number
  lxx_sfg: number
  lyy_sfg: number
  lxx_vis: number
  lyy_vis: number
  lxx_ir: number
  lyy_ir: number
  chi2_ssp: number
  chi2_sps: number
  chi2_pss: number
  chi2_ppp: number
  chi2_ssp_sq: number
  chi2_sps_sq: number
  chi2_pss_sq: number
  chi2_ppp_sq: number
}

interface FocusResult {
  vis_focus_diameter: number
  ir_focus_diameter: number
  vis_focus_depth: number
  ir_focus_depth: number
  vis_spot_diameter: number
  ir_spot_diameter: number
  sfg_spot_diameter: number
  slit_spot_size: number
}

interface FresnelResult {
  coherence_length: number
  sfg_lxx: number
  sfg_lyy: number
  sfg_lzz: number
  vis_lxx: number
  vis_lyy: number
  vis_lzz: number
  ir_lxx: number
  ir_lyy: number
  ir_lzz: number
  ssp_yyz: number
  sps_yzy: number
  pss_zyy: number
  ppp_zxx: number
  ppp_xxz: number
  ppp_xzx: number
  ppp_zzz: number
  psp_zyx: number
  psp_xyz: number
  spp_yzx: number
  spp_yxz: number
  pps_zxy: number
  pps_xzy: number
}

function formatValue(value: number | undefined, type: 'fresnel' | 'chi' | 'default'): string {
  if (value === undefined || value === null || isNaN(value)) return '-'
  if (type === 'fresnel') {
    return value.toFixed(4)
  }
  if (type === 'chi') {
    if (Math.abs(value) < 1e-6 && value !== 0) return value.toExponential(4)
    return value.toFixed(6)
  }
  if (Math.abs(value) < 0.01 && value !== 0) return value.toExponential(4)
  if (Math.abs(value) > 10000) return value.toExponential(4)
  return value.toFixed(2)
}

function ResultCard({ label, value, type = 'default' }: { label: string; value: number | undefined; type?: 'fresnel' | 'chi' | 'default' }) {
  return (
    <div className="result-card">
      <span className="result-card-label">{label}</span>
      <span className="result-card-value">{formatValue(value, type)}</span>
    </div>
  )
}

function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('quartz')

  const [visAngle, setVisAngle] = useState<number>(45)
  const [irAngle, setIrAngle] = useState<number>(55)
  const [visWavelength, setVisWavelength] = useState<number>(532)
  const [irWavenumber, setIrWavenumber] = useState<number>(3000)

  const [visWavelengthF, setVisWavelengthF] = useState<number>(532)
  const [irWavelengthF, setIrWavelengthF] = useState<number>(3300)
  const [sfgWavelengthF, setSfgWavelengthF] = useState<number>(458)
  const [visSpotSize, setVisSpotSize] = useState<number>(5)
  const [irSpotSize, setIrSpotSize] = useState<number>(5)
  const [visFocal, setVisFocal] = useState<number>(250)
  const [irFocal, setIrFocal] = useState<number>(150)
  const [sfgFocal, setSfgFocal] = useState<number>(200)
  const [visDefocus, setVisDefocus] = useState<number>(15)
  const [irDefocus, setIrDefocus] = useState<number>(7)
  const [spectrometerFocal, setSpectrometerFocal] = useState<number>(100)

  const [nSfg, setNSfg] = useState<number>(1.4727)
  const [nVis, setNVis] = useState<number>(1.4727)
  const [nIr, setNIr] = useState<number>(1.47)
  const [visAngleFr, setVisAngleFr] = useState<number>(45)
  const [irAngleFr, setIrAngleFr] = useState<number>(55)
  const [visWavelengthFr, setVisWavelengthFr] = useState<number>(532.1)
  const [irWavenumberFr, setIrWavenumberFr] = useState<number>(2900)

  const [quartzResult, setQuartzResult] = useState<QuartzResult | null>(null)
  const [focusResult, setFocusResult] = useState<FocusResult | null>(null)
  const [fresnelResult, setFresnelResult] = useState<FresnelResult | null>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleQuartzCalc = async () => {
    setLoading(true)
    setError(null)
    setQuartzResult(null)

    try {
      const body: Record<string, unknown> = {
        vis_angle: visAngle,
        ir_angle: irAngle,
        vis_wavelength: visWavelength,
        ir_wavenumber: irWavenumber,
      }

      const response = await fetch('/api/calculator/quartz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.detail || `Server error (${response.status})`)
      }

      const data = await response.json()
      setQuartzResult(data as QuartzResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed, please retry')
    } finally {
      setLoading(false)
    }
  }

  const handleFocusCalc = async () => {
    setLoading(true)
    setError(null)
    setFocusResult(null)

    try {
      const response = await fetch('/api/calculator/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vis_wavelength: visWavelengthF,
          ir_wavelength: irWavelengthF,
          sfg_wavelength: sfgWavelengthF,
          vis_spot_size: visSpotSize,
          ir_spot_size: irSpotSize,
          vis_focal: visFocal,
          ir_focal: irFocal,
          sfg_focal: sfgFocal,
          vis_defocus: visDefocus,
          ir_defocus: irDefocus,
          spectrometer_focal: spectrometerFocal,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.detail || `Server error (${response.status})`)
      }

      const data = await response.json()
      setFocusResult(data as FocusResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed, please retry')
    } finally {
      setLoading(false)
    }
  }

  const handleFresnelCalc = async () => {
    setLoading(true)
    setError(null)
    setFresnelResult(null)

    try {
      const response = await fetch('/api/calculator/fresnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n_sfg: nSfg,
          n_vis: nVis,
          n_ir: nIr,
          vis_angle: visAngleFr,
          ir_angle: irAngleFr,
          vis_wavelength: visWavelengthFr,
          ir_wavenumber: irWavenumberFr,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.detail || `Server error (${response.status})`)
      }

      const data = await response.json()
      setFresnelResult(data as FresnelResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed, please retry')
    } finally {
      setLoading(false)
    }
  }

  const renderQuartzTab = () => (
    <div className="tab-content">
      <div className="section-card">
        <h2 className="section-title">Parameters</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Visible Incident Angle (°)</label>
            <input
              type="number"
              value={visAngle}
              onChange={(e) => setVisAngle(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Incident Angle (°)</label>
            <input
              type="number"
              value={irAngle}
              onChange={(e) => setIrAngle(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Wavelength (nm)</label>
            <input
              type="number"
              value={visWavelength}
              onChange={(e) => setVisWavelength(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Wavenumber (cm⁻¹)</label>
            <input
              type="number"
              value={irWavenumber}
              onChange={(e) => setIrWavenumber(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="submit-section">
        <button
          type="button"
          className="process-btn"
          disabled={loading}
          onClick={handleQuartzCalc}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {quartzResult && renderQuartzSingleResult()}
    </div>
  )

  const renderQuartzSingleResult = () => {
    if (!quartzResult) return null
    return (
      <div className="section-card">
        <h2 className="section-title">Results</h2>
        <div className="result-grid">
          <ResultCard label="SFG Wavelength (nm)" value={quartzResult.sfg_wavelength} />
          <ResultCard label="SFG Reflection Angle (°)" value={quartzResult.sfg_angle} />
          <ResultCard label="IR Wavelength (nm)" value={quartzResult.ir_wavelength} />
          <ResultCard label="Visible Refractive Index" value={quartzResult.n_vis} type="fresnel" />
          <ResultCard label="IR Refractive Index" value={quartzResult.n_ir} type="fresnel" />
          <ResultCard label="SFG Refractive Index" value={quartzResult.n_sfg} type="fresnel" />
          <ResultCard label="Visible Refraction Angle" value={quartzResult.vis_ref_angle} />
          <ResultCard label="IR Refraction Angle" value={quartzResult.ir_ref_angle} />
          <ResultCard label="SFG Refraction Angle" value={quartzResult.sfg_ref_angle} />
          <ResultCard label="Coherence Length (nm)" value={quartzResult.coherence_length} />
          <ResultCard label="Lxx SFG" value={quartzResult.lxx_sfg} type="fresnel" />
          <ResultCard label="Lyy SFG" value={quartzResult.lyy_sfg} type="fresnel" />
          <ResultCard label="Lxx Vis" value={quartzResult.lxx_vis} type="fresnel" />
          <ResultCard label="Lyy Vis" value={quartzResult.lyy_vis} type="fresnel" />
          <ResultCard label="Lxx IR" value={quartzResult.lxx_ir} type="fresnel" />
          <ResultCard label="Lyy IR" value={quartzResult.lyy_ir} type="fresnel" />
          <ResultCard label="χ² SSP" value={quartzResult.chi2_ssp} type="chi" />
          <ResultCard label="χ² SPS" value={quartzResult.chi2_sps} type="chi" />
          <ResultCard label="χ² PSS" value={quartzResult.chi2_pss} type="chi" />
          <ResultCard label="χ² PPP" value={quartzResult.chi2_ppp} type="chi" />
          <ResultCard label="|χ² SSP|²" value={quartzResult.chi2_ssp_sq} type="chi" />
          <ResultCard label="|χ² SPS|²" value={quartzResult.chi2_sps_sq} type="chi" />
          <ResultCard label="|χ² PSS|²" value={quartzResult.chi2_pss_sq} type="chi" />
          <ResultCard label="|χ² PPP|²" value={quartzResult.chi2_ppp_sq} type="chi" />
        </div>
      </div>
    )
  }

  const renderFocusTab = () => (
    <div className="tab-content">
      <div className="section-card">
        <h2 className="section-title">Parameters</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Visible Wavelength (nm)</label>
            <input
              type="number"
              value={visWavelengthF}
              onChange={(e) => setVisWavelengthF(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Wavelength (nm)</label>
            <input
              type="number"
              value={irWavelengthF}
              onChange={(e) => setIrWavelengthF(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>SFG Wavelength (nm)</label>
            <input
              type="number"
              value={sfgWavelengthF}
              onChange={(e) => setSfgWavelengthF(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Spot Diameter (mm)</label>
            <input
              type="number"
              value={visSpotSize}
              onChange={(e) => setVisSpotSize(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Spot Diameter (mm)</label>
            <input
              type="number"
              value={irSpotSize}
              onChange={(e) => setIrSpotSize(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Lens Focal (mm)</label>
            <input
              type="number"
              value={visFocal}
              onChange={(e) => setVisFocal(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Lens Focal (mm)</label>
            <input
              type="number"
              value={irFocal}
              onChange={(e) => setIrFocal(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>SFG Lens Focal (mm)</label>
            <input
              type="number"
              value={sfgFocal}
              onChange={(e) => setSfgFocal(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Defocus (mm)</label>
            <input
              type="number"
              value={visDefocus}
              onChange={(e) => setVisDefocus(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Defocus (mm)</label>
            <input
              type="number"
              value={irDefocus}
              onChange={(e) => setIrDefocus(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Spectrometer Focal (mm)</label>
            <input
              type="number"
              value={spectrometerFocal}
              onChange={(e) => setSpectrometerFocal(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="submit-section">
        <button
          type="button"
          className="process-btn"
          disabled={loading}
          onClick={handleFocusCalc}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {focusResult && (
        <div className="section-card">
          <h2 className="section-title">Results</h2>
          <div className="result-grid">
            <ResultCard label="Visible Focus Diameter (μm)" value={focusResult.vis_focus_diameter} />
            <ResultCard label="IR Focus Diameter (μm)" value={focusResult.ir_focus_diameter} />
            <ResultCard label="Visible Focus Depth (mm)" value={focusResult.vis_focus_depth} />
            <ResultCard label="IR Focus Depth (mm)" value={focusResult.ir_focus_depth} />
            <ResultCard label="Visible Defocus Spot Diameter (μm)" value={focusResult.vis_spot_diameter} />
            <ResultCard label="IR Spot Diameter (μm)" value={focusResult.ir_spot_diameter} />
            <ResultCard label="SFG Spot Diameter (mm)" value={focusResult.sfg_spot_diameter} />
            <ResultCard label="Slit Focus Size (μm)" value={focusResult.slit_spot_size} />
          </div>
        </div>
      )}
    </div>
  )

  const renderFresnelTab = () => (
    <div className="tab-content">
      <div className="section-card">
        <h2 className="section-title">Parameters</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>SFG Refractive Index</label>
            <input
              type="number"
              step="0.0001"
              value={nSfg}
              onChange={(e) => setNSfg(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Refractive Index</label>
            <input
              type="number"
              step="0.0001"
              value={nVis}
              onChange={(e) => setNVis(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Refractive Index</label>
            <input
              type="number"
              step="0.0001"
              value={nIr}
              onChange={(e) => setNIr(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Incident Angle (°)</label>
            <input
              type="number"
              value={visAngleFr}
              onChange={(e) => setVisAngleFr(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Incident Angle (°)</label>
            <input
              type="number"
              value={irAngleFr}
              onChange={(e) => setIrAngleFr(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Visible Wavelength (nm)</label>
            <input
              type="number"
              value={visWavelengthFr}
              onChange={(e) => setVisWavelengthFr(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>IR Wavenumber (cm⁻¹)</label>
            <input
              type="number"
              value={irWavenumberFr}
              onChange={(e) => setIrWavenumberFr(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="submit-section">
        <button
          type="button"
          className="process-btn"
          disabled={loading}
          onClick={handleFresnelCalc}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {fresnelResult && (
        <div className="section-card">
          <h2 className="section-title">Results</h2>

          <div className="result-grid" style={{ marginBottom: 20 }}>
            <ResultCard label="Coherence Length (nm)" value={fresnelResult.coherence_length} />
          </div>

          <div className="fresnel-tables">
            <div className="result-section">
              <h3>SFG Fresnel Factors</h3>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Coefficient</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Lxx</td><td>{formatValue(fresnelResult.sfg_lxx, 'fresnel')}</td></tr>
                  <tr><td>Lyy</td><td>{formatValue(fresnelResult.sfg_lyy, 'fresnel')}</td></tr>
                  <tr><td>Lzz</td><td>{formatValue(fresnelResult.sfg_lzz, 'fresnel')}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="result-section">
              <h3>VIS Fresnel</h3>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Coefficient</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Lxx</td><td>{formatValue(fresnelResult.vis_lxx, 'fresnel')}</td></tr>
                  <tr><td>Lyy</td><td>{formatValue(fresnelResult.vis_lyy, 'fresnel')}</td></tr>
                  <tr><td>Lzz</td><td>{formatValue(fresnelResult.vis_lzz, 'fresnel')}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="result-section">
              <h3>IR Fresnel</h3>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Coefficient</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Lxx</td><td>{formatValue(fresnelResult.ir_lxx, 'fresnel')}</td></tr>
                  <tr><td>Lyy</td><td>{formatValue(fresnelResult.ir_lyy, 'fresnel')}</td></tr>
                  <tr><td>Lzz</td><td>{formatValue(fresnelResult.ir_lzz, 'fresnel')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="result-section">
            <h3>Non-chiral Combinations</h3>
            <table className="result-table">
              <thead>
                <tr>
                  <th>Combination</th>
                    <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>SSP YYZ</td><td>{formatValue(fresnelResult.ssp_yyz, 'fresnel')}</td></tr>
                <tr><td>SPS YZY</td><td>{formatValue(fresnelResult.sps_yzy, 'fresnel')}</td></tr>
                <tr><td>PSS ZYY</td><td>{formatValue(fresnelResult.pss_zyy, 'fresnel')}</td></tr>
                <tr><td>PPP ZXX</td><td>{formatValue(fresnelResult.ppp_zxx, 'fresnel')}</td></tr>
                <tr><td>PPP XXZ</td><td>{formatValue(fresnelResult.ppp_xxz, 'fresnel')}</td></tr>
                <tr><td>PPP XZX</td><td>{formatValue(fresnelResult.ppp_xzx, 'fresnel')}</td></tr>
                <tr><td>PPP ZZZ</td><td>{formatValue(fresnelResult.ppp_zzz, 'fresnel')}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="result-section">
            <h3>Chiral Combinations</h3>
            <table className="result-table">
              <thead>
                <tr>
                  <th>Combination</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>PSP ZYX</td><td>{formatValue(fresnelResult.psp_zyx, 'fresnel')}</td></tr>
                <tr><td>PSP XYZ</td><td>{formatValue(fresnelResult.psp_xyz, 'fresnel')}</td></tr>
                <tr><td>SPP YZX</td><td>{formatValue(fresnelResult.spp_yzx, 'fresnel')}</td></tr>
                <tr><td>SPP YXZ</td><td>{formatValue(fresnelResult.spp_yxz, 'fresnel')}</td></tr>
                <tr><td>PPS ZXY</td><td>{formatValue(fresnelResult.pps_zxy, 'fresnel')}</td></tr>
                <tr><td>PPS XZY</td><td>{formatValue(fresnelResult.pps_xzy, 'fresnel')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="calculator-page">
      <h1 className="page-title">SFG Calculator</h1>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key)
              setError(null)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Calculating, please wait...</div>}

      {activeTab === 'quartz' && renderQuartzTab()}
      {activeTab === 'focus' && renderFocusTab()}
      {activeTab === 'fresnel' && renderFresnelTab()}
    </div>
  )
}

export default CalculatorPage
