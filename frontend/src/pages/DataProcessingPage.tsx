import { useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './DataProcessingPage.css'

interface FileData {
  data: { wavelength: number; intensity: number }[] | null
  filename: string | null
  rawContent: string | null
}

interface ProcessResult {
  wavenumber: number[]
  intensity: number[]
}

function parseCSV(text: string): { wavelength: number; intensity: number }[] | null {
  try {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return null

    const rows: { wavelength: number; intensity: number }[] = []
    let startIndex = 0

    const firstLine = lines[0].split(',')
    const firstVal = parseFloat(firstLine[0].trim())
    if (isNaN(firstVal)) {
      startIndex = 1
    }

    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < 2) continue
      const wl = parseFloat(cols[0].trim())
      const intensity = parseFloat(cols[1].trim())
      if (!isNaN(wl) && !isNaN(intensity)) {
        rows.push({ wavelength: wl, intensity })
      }
    }

    return rows.length > 0 ? rows : null
  } catch {
    return null
  }
}

function DataProcessingPage() {
  const [visibleWavelength, setVisibleWavelength] = useState<number>(800)
  const [sampleExposureTime, setSampleExposureTime] = useState<number>(1)
  const [quartzExposureTime, setQuartzExposureTime] = useState<number>(1)
  const [dataName, setDataName] = useState<string>('SFG_Data')

  const [enableSpikeRemove, setEnableSpikeRemove] = useState<boolean>(false)
  const [windowSize, setWindowSize] = useState<number>(15)
  const [thresholdMult, setThresholdMult] = useState<number>(3)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  const [file1, setFile1] = useState<FileData>({ data: null, filename: null, rawContent: null })
  const [file2, setFile2] = useState<FileData>({ data: null, filename: null, rawContent: null })
  const [file3, setFile3] = useState<FileData>({ data: null, filename: null, rawContent: null })
  const [file4, setFile4] = useState<FileData>({ data: null, filename: null, rawContent: null })

  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)
  const fileInput3Ref = useRef<HTMLInputElement>(null)
  const fileInput4Ref = useRef<HTMLInputElement>(null)

  const allFilesReady =
    file1.data !== null && file2.data !== null && file3.data !== null && file4.data !== null

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileData>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const parsed = parseCSV(text)
      setter({
        data: parsed,
        filename: file.name,
        rawContent: text
      })
    }
    reader.readAsText(file)
  }

  const handleProcess = async () => {
    if (!allFilesReady) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/data-processing/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sample_signal: file1.rawContent,
          sample_background: file2.rawContent,
          quartz_signal: file3.rawContent,
          quartz_background: file4.rawContent,
          visible_wavelength: visibleWavelength,
          sample_exposure_time: sampleExposureTime,
          quartz_exposure_time: quartzExposureTime,
          data_name: dataName,
          remove_spikes: enableSpikeRemove,
          window_size: windowSize,
          threshold_mult: thresholdMult
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.detail || `Server error (${response.status})`)
      }

      const data = await response.json()
      setResult({
        wavenumber: data.wavenumber,
        intensity: data.intensity
      })
    } catch (err: any) {
      setError(err.message || 'Processing failed, please retry')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const csvLines = ['wavenumber,intensity']
    for (let i = 0; i < result.wavenumber.length; i++) {
      csvLines.push(`${result.wavenumber[i]},${result.intensity[i]}`)
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${dataName}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderPreviewChart = (fileData: FileData) => {
    if (!fileData.data) {
      return (
        <div className="preview-placeholder">
          Please select a file
        </div>
      )
    }

    const chartData = fileData.data.map((d) => ({
      wavelength: d.wavelength,
      intensity: d.intensity
    }))

    return (
      <div className="preview-chart">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Line
              type="monotone"
              dataKey="intensity"
              stroke="var(--color-primary)"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderFileSlot = (
    label: string,
    fileData: FileData,
    fileRef: React.RefObject<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileData>>
  ) => {
    return (
      <div className="file-slot">
        <span className="file-slot-label">{label}</span>
        <div className="file-upload-area">
          <button
            type="button"
            className="file-select-btn"
            onClick={() => fileRef.current?.click()}
          >
            Choose File
          </button>
          <span className="file-name">
            {fileData.filename || 'No file selected'}
          </span>
          <input
            type="file"
            accept=".csv"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e, setter)}
          />
        </div>
        {renderPreviewChart(fileData)}
      </div>
    )
  }

  const renderResultChart = () => {
    if (!result) return null

    const chartData = result.wavenumber.map((wn, i) => ({
      wavenumber: wn,
      intensity: result.intensity[i]
    }))

    return (
      <div className="section-card">
        <h2 className="section-title">Processing Results</h2>
        <div className="result-chart">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 12, right: 24, bottom: 12, left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="wavenumber"
                label={{ value: 'Wavenumber (cm⁻¹)', position: 'insideBottomRight', offset: -8, style: { fill: 'var(--color-text-muted)', fontSize: 13 } }}
                stroke="var(--color-text-muted)"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              />
              <YAxis
                label={{ value: 'Normalized Intensity', angle: -90, position: 'insideLeft', offset: 4, style: { fill: 'var(--color-text-muted)', fontSize: 13 } }}
                stroke="var(--color-text-muted)"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)'
                }}
              />
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="var(--color-primary)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="download-section">
          <button type="button" className="download-btn" onClick={handleDownload}>
            Download CSV
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="data-processing-page">
      <h1 className="page-title">SFG Data Processing</h1>

      <div className="section-card">
        <h2 className="section-title">Parameter Settings</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Visible Wavelength (nm)</label>
            <input
              type="number"
              value={visibleWavelength}
              onChange={(e) => setVisibleWavelength(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Data Name</label>
            <input
              type="text"
              value={dataName}
              onChange={(e) => setDataName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Sample Exposure Time (s)</label>
            <input
              type="number"
              step="0.1"
              value={sampleExposureTime}
              onChange={(e) => setSampleExposureTime(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Quartz Exposure Time (s)</label>
            <input
              type="number"
              step="0.1"
              value={quartzExposureTime}
              onChange={(e) => setQuartzExposureTime(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="checkbox-group" style={{ marginTop: 16 }}>
          <input
            type="checkbox"
            id="spike-remove"
            checked={enableSpikeRemove}
            onChange={(e) => setEnableSpikeRemove(e.target.checked)}
          />
          <label htmlFor="spike-remove">Enable Cosmic Ray Removal</label>
        </div>

        {enableSpikeRemove && (
          <>
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▾' : '▸'} Advanced Options
            </button>
            {showAdvanced && (
              <div className="advanced-options">
                <div className="form-group">
                  <label>Window Size</label>
                  <input
                    type="number"
                    value={windowSize}
                    onChange={(e) => setWindowSize(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Threshold Multiplier</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholdMult}
                    onChange={(e) => setThresholdMult(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="section-card">
        <h2 className="section-title">Data Files</h2>
        <div className="file-slots">
          {renderFileSlot('Sample Signal', file1, fileInput1Ref, setFile1)}
          {renderFileSlot('Sample Background', file2, fileInput2Ref, setFile2)}
          {renderFileSlot('Quartz Signal', file3, fileInput3Ref, setFile3)}
          {renderFileSlot('Quartz Background', file4, fileInput4Ref, setFile4)}
        </div>
      </div>

      <div className="submit-section">
        <button
          type="button"
          className="process-btn"
          disabled={!allFilesReady || loading}
          onClick={handleProcess}
        >
          {loading ? 'Processing...' : 'Start Processing'}
        </button>
      </div>

      {error && (
        <div className="error-msg">{error}</div>
      )}

      {loading && (
        <div className="loading">Processing data, please wait...</div>
      )}

      {renderResultChart()}
    </div>
  )
}

export default DataProcessingPage
