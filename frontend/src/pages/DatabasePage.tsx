import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './DatabasePage.css'

const TABS = [
  { key: 'intensity', label: 'Intensity Ranking' },
  { key: 'table', label: 'Database View' },
  { key: 'spectrum', label: 'Spectrum View' },
] as const

type TabKey = typeof TABS[number]['key']

interface SFGRecord {
  id: number
  name: string
  formula?: string
  normalized_intensity?: number
  effective_chi2?: number
  peak_position?: number
  peak_width?: number
  vibrational_mode?: string
  functional_group?: string
  vis_angle?: number
  ir_angle?: number
  laser_energy?: string
  instrument?: string
  reference?: string
  image_path?: string
  uploader?: string
  created_at?: string
}

function DatabasePage() {
  const [records, setRecords] = useState<SFGRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('intensity')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortMetric, setSortMetric] = useState<'normalized_intensity' | 'effective_chi2'>('normalized_intensity')

  const [name, setName] = useState<string>('')
  const [formula, setFormula] = useState<string>('')
  const [normalizedIntensity, setNormalizedIntensity] = useState<string>('')
  const [effectiveChi2, setEffectiveChi2] = useState<string>('')
  const [peakPosition, setPeakPosition] = useState<string>('')
  const [peakWidth, setPeakWidth] = useState<string>('')
  const [vibrationalMode, setVibrationalMode] = useState<string>('')
  const [functionalGroup, setFunctionalGroup] = useState<string>('')
  const [visAngle, setVisAngle] = useState<string>('')
  const [irAngle, setIrAngle] = useState<string>('')
  const [laserEnergy, setLaserEnergy] = useState<string>('')
  const [instrument, setInstrument] = useState<string>('')
  const [reference, setReference] = useState<string>('')
  const [uploader, setUploader] = useState<string>('')

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [xMin, setXMin] = useState<string>('1000')
  const [xMax, setXMax] = useState<string>('4000')
  const [yMin, setYMin] = useState<string>('0')
  const [yMax, setYMax] = useState<string>('')
  const [intensityMin, setIntensityMin] = useState<string>('')
  const [intensityMax, setIntensityMax] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const [detailRecord, setDetailRecord] = useState<SFGRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<SFGRecord | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false)
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const imageUrlRef = useRef<string | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/database/records')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRecords(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const resetForm = () => {
    setName('')
    setFormula('')
    setNormalizedIntensity('')
    setEffectiveChi2('')
    setPeakPosition('')
    setPeakWidth('')
    setVibrationalMode('')
    setFunctionalGroup('')
    setVisAngle('')
    setIrAngle('')
    setLaserEnergy('')
    setInstrument('')
    setReference('')
    setUploader('')
    setSelectedImage(null)
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
    setImagePreview(null)
    setUploadError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }

    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    imageUrlRef.current = previewUrl
    setImagePreview(previewUrl)
  }

  const handleUpload = async () => {
    if (!name.trim()) return
    setUploading(true)
    setUploadError(null)

    try {
      const data: { [key: string]: unknown } = { name: name.trim() }

      if (formula.trim()) data.formula = formula.trim()
      if (normalizedIntensity.trim()) data.normalized_intensity = Number(normalizedIntensity)
      if (effectiveChi2.trim()) data.effective_chi2 = Number(effectiveChi2)
      if (peakPosition.trim()) data.peak_position = Number(peakPosition)
      if (peakWidth.trim()) data.peak_width = Number(peakWidth)
      if (vibrationalMode.trim()) data.vibrational_mode = vibrationalMode.trim()
      if (functionalGroup.trim()) data.functional_group = functionalGroup.trim()
      if (visAngle.trim()) data.vis_angle = Number(visAngle)
      if (irAngle.trim()) data.ir_angle = Number(irAngle)
      if (laserEnergy.trim()) data.laser_energy = laserEnergy.trim()
      if (instrument.trim()) data.instrument = instrument.trim()
      if (reference.trim()) data.reference = reference.trim()
      if (uploader.trim()) data.uploader = uploader.trim()

      const formData = new FormData()
      formData.append('data', JSON.stringify(data))
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const res = await fetch('/api/database/records', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.detail || `Upload failed (${res.status})`)
      }

      closeModal()
      fetchRecords()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/database/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sfg_backup.txt'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/database/import', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.detail || 'Import failed')
      let msg = `Successfully imported ${result.imported} records`
      if (result.errors?.length) {
        msg += `, ${result.errors.length} errors: ${result.errors.join('; ')}`
      }
      setError(msg)
      fetchRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
      if (importFileRef.current) importFileRef.current.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/database/records/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      fetchRecords()
      setDeleteConfirm(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const openDetail = (record: SFGRecord) => {
    setDetailRecord(record)
    setEditingRecord(null)
    setUnsavedChanges(false)
    setEditImage(null)
    setEditImagePreview(null)
  }

  const startEditing = () => {
    if (!detailRecord) return
    setEditingRecord({ ...detailRecord })
    setUnsavedChanges(false)
  }

  const handleEditFieldChange = (field: string, value: string) => {
    if (!editingRecord) return
    setEditingRecord({ ...editingRecord, [field]: value })
    setUnsavedChanges(true)
  }

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImage(file)
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImagePreview(URL.createObjectURL(file))
    setUnsavedChanges(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord || !detailRecord) return
    setSaving(true)
    try {
      const data: Record<string, unknown> = {}
      for (const key of Object.keys(editingRecord) as (keyof SFGRecord)[]) {
        const val = editingRecord[key]
        if (val !== undefined && val !== null && val !== '') {
          data[key] = val
        }
      }
      if (editImage) {
        data.image_is_new = true
      }

      const formData = new FormData()
      formData.append('data', JSON.stringify(data))
      if (editImage) {
        formData.append('image', editImage)
      }

      const res = await fetch(`/api/database/records/${detailRecord.id}`, {
        method: 'PATCH',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail || 'Update failed')
      }
      const updated = await res.json()
      setDetailRecord(updated)
      setEditingRecord(null)
      setUnsavedChanges(false)
      setEditImage(null)
      setEditImagePreview(null)
      fetchRecords()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const closeDetail = () => {
    if (unsavedChanges && editingRecord) {
      if (!window.confirm('You have unsaved changes. Discard changes?')) return
    }
    setDetailRecord(null)
    setEditingRecord(null)
    setUnsavedChanges(false)
    setEditImage(null)
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview)
      setEditImagePreview(null)
    }
  }

  const renderDetailField = (field: string, label: string, type: string, _required: boolean) => {
    const record = editingRecord || detailRecord
    if (!record) return null

    const value = (record as unknown as Record<string, unknown>)[field]
    const showAsEmpty = !editingRecord && (value === undefined || value === null || value === '')

    if (showAsEmpty) return null

    return (
      <div className="detail-field">
        <label className="detail-field-label">{label}</label>
        {editingRecord ? (
          <input
            type={type}
            className="detail-field-input"
            value={String((editingRecord as unknown as Record<string, unknown>)[field] ?? '')}
            onChange={(e) => handleEditFieldChange(field, e.target.value)}
          />
        ) : (
          <span className="detail-field-value">
            {type === 'number' && typeof value === 'number'
              ? (Math.abs(value) < 0.01 && value !== 0 ? value.toExponential(4) : value.toFixed(4))
              : String(value ?? '')}
          </span>
        )}
      </div>
    )
  }

  const sortedIntensity = [...records]
    .filter((r) => {
      const val = r[sortMetric]
      if (val == null) return false
      if (intensityMin.trim() && val < Number(intensityMin)) return false
      if (intensityMax.trim() && val > Number(intensityMax)) return false
      return true
    })
    .sort((a, b) => (b[sortMetric] ?? 0) - (a[sortMetric] ?? 0))

  const maxMetricValue = sortedIntensity.length > 0
    ? Math.max(...sortedIntensity.map((r) => r[sortMetric] ?? 0))
    : 1

  const getBarColor = (value: number) => {
    const ratio = maxMetricValue > 0 ? value / maxMetricValue : 0
    const r = Math.round(233 - (233 - 100) * ratio)
    const g = Math.round(69 - (69 - 100) * ratio)
    const b = Math.round(96 - (96 - 120) * ratio)
    return `rgb(${r}, ${g}, ${b})`
  }

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      (r.formula && r.formula.toLowerCase().includes(q)) ||
      (r.functional_group && r.functional_group.toLowerCase().includes(q))
    )
  })

  const spectrumData = records
    .filter((r) => r.peak_position != null && r.normalized_intensity != null)
    .map((r) => ({
      peak_position: r.peak_position ?? 0,
      normalized_intensity: r.normalized_intensity ?? 0,
      name: r.name,
      vibrational_mode: r.vibrational_mode,
      xMin: (r.peak_position ?? 0) - 10,
      xMax: (r.peak_position ?? 0) + 10,
    }))

  const renderIntensityTab = () => (
    <div className="tab-content">
      <div className="intensity-toggles">
        <button
          className={`intensity-toggle${sortMetric === 'normalized_intensity' ? ' active' : ''}`}
          onClick={() => setSortMetric('normalized_intensity')}
        >
          Normalized Intensity
        </button>
        <button
          className={`intensity-toggle${sortMetric === 'effective_chi2' ? ' active' : ''}`}
          onClick={() => setSortMetric('effective_chi2')}
        >
          Effective χ²
        </button>
      </div>

      <div className="intensity-filter">
        <div className="form-group">
          <label>Min Intensity</label>
          <input type="number" value={intensityMin} onChange={(e) => setIntensityMin(e.target.value)} placeholder="Unlimited" />
        </div>
        <div className="form-group">
          <label>Max Intensity</label>
          <input type="number" value={intensityMax} onChange={(e) => setIntensityMax(e.target.value)} placeholder="Unlimited" />
        </div>
      </div>

      {sortedIntensity.length === 0 ? (
        <div className="empty-state">No data</div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={Math.max(400, sortedIntensity.length * 28)}>
            <BarChart data={sortedIntensity} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-text-muted)" />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                stroke="var(--color-text-muted)"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                }}
                formatter={(value) => {
                  const num = typeof value === 'number' ? value : Number(value)
                  return [isNaN(num) ? '-' : num.toFixed(4), sortMetric === 'normalized_intensity' ? 'Normalized Intensity' : 'Effective χ²']
                }}
              />
              <Bar dataKey={sortMetric} radius={[0, 4, 4, 0]} onClick={(data: any) => {
                const rec = records.find(r => r.name === data.name && r[sortMetric] === data[sortMetric])
                if (rec) openDetail(rec)
              }}>
                {sortedIntensity.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry[sortMetric] ?? 0)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )

  const renderTableTab = () => (
    <div className="tab-content">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search name, formula, functional group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? 'No matching records' : 'No data'}
        </div>
      ) : (
        <div className="db-card-list">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="db-card"
            >
              <div
                className="db-card-header"
                onClick={() => openDetail(record)}
              >
                <div className="db-card-header-title">
                  <span className="db-card-name">{record.name}</span>
                  {record.formula && (
                    <span className="db-card-formula">{record.formula}</span>
                  )}
                </div>
                <div className="db-card-header-actions">
                  {deleteConfirm === record.id ? (
                    <div className="delete-confirm">
                      <span>Confirm delete?</span>
                      <button
                        className="delete-confirm-yes"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(record.id)
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        className="delete-confirm-no"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(record.id)
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="db-card-meta">
                {record.normalized_intensity != null && (
                  <span className="db-card-field">
                    <span className="db-card-field-label">Normalized Intensity:</span>
                    <span>{record.normalized_intensity.toFixed(4)}</span>
                  </span>
                )}
                {record.effective_chi2 != null && (
                  <span className="db-card-field">
                    <span className="db-card-field-label">Effective χ²:</span>
                    <span>{record.effective_chi2.toExponential(4)}</span>
                  </span>
                )}
                {record.peak_position != null && (
                  <span className="db-card-field">
                    <span className="db-card-field-label">Peak Position:</span>
                    <span>{record.peak_position} cm⁻¹</span>
                  </span>
                )}
                {record.functional_group && (
                  <span className="db-card-field">
                    <span className="db-card-field-label">Functional Group:</span>
                    <span>{record.functional_group}</span>
                  </span>
                )}
                {record.vibrational_mode && (
                  <span className="db-card-field">
                    <span className="db-card-field-label">Vibrational Mode:</span>
                    <span>{record.vibrational_mode}</span>
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSpectrumTab = () => (
    <div className="tab-content">
      <div className="spectrum-controls">
        <div className="form-group">
          <label>X Min</label>
          <input type="number" value={xMin} onChange={(e) => setXMin(e.target.value)} />
        </div>
        <div className="form-group">
          <label>X Max</label>
          <input type="number" value={xMax} onChange={(e) => setXMax(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Y Min</label>
          <input type="number" value={yMin} onChange={(e) => setYMin(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Y Max</label>
          <input type="number" value={yMax} onChange={(e) => setYMax(e.target.value)} />
        </div>
        <button
          className="process-btn"
          onClick={() => {
            setXMin(xMin)
            setXMax(xMax)
            setYMin(yMin)
            setYMax(yMax)
          }}
        >
          Apply
        </button>
      </div>

      {spectrumData.length === 0 ? (
        <div className="empty-state">No spectrum data</div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={spectrumData}
              margin={{ top: 12, right: 24, bottom: 12, left: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="peak_position"
                type="number"
                domain={[Number(xMin) || 1000, Number(xMax) || 4000]}
                stroke="var(--color-text-muted)"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                label={{ value: 'Wavenumber (cm⁻¹)', position: 'insideBottomRight', offset: -8, style: { fill: 'var(--color-text-muted)', fontSize: 13 } }}
              />
              <YAxis
                type="number"
                domain={[Number(yMin) || 0, yMax.trim() ? Number(yMax) : 'auto']}
                allowDataOverflow={yMax.trim() !== ''}
                stroke="var(--color-text-muted)"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                label={{ value: 'Normalized Intensity', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-muted)', fontSize: 13 } }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]?.payload) return null
                  const d = payload[0].payload
                  return (
                    <div style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary)' }}>{d.name}</div>
                      <div>Wavenumber: {d.peak_position} cm⁻¹</div>
                      <div>Normalized Intensity: {d.normalized_intensity?.toFixed(4)}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="normalized_intensity" fill="var(--color-primary)" barSize={2} onClick={(data: any) => {
                const rec = records.find(r => r.peak_position === data.peak_position && r.normalized_intensity === data.normalized_intensity)
                if (rec) openDetail(rec)
              }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )

  return (
    <div className="database-page">
      <div className="database-page-header">
        <h1 className="page-title">SFG Database</h1>
        <div className="database-page-actions">
          <input
            ref={importFileRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button className="action-btn" onClick={handleExport}>
            Export Data
          </button>
          <button className="action-btn" onClick={() => importFileRef.current?.click()}>
            Import Data
          </button>
          <button className="process-btn" onClick={() => setShowModal(true)}>
            Upload Data
          </button>
        </div>
      </div>

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
      {loading && <div className="loading">Loading...</div>}

      {!loading && (
        <>
          {activeTab === 'intensity' && renderIntensityTab()}
          {activeTab === 'table' && renderTableTab()}
          {activeTab === 'spectrum' && renderSpectrumTab()}
        </>
      )}

      {detailRecord && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-modal-header-left">
                {editingRecord ? (
                  <input
                    type="text"
                    className="detail-modal-name-input"
                    value={editingRecord.name}
                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                  />
                ) : (
                  <h2 className="detail-modal-name">{detailRecord.name}</h2>
                )}
                {detailRecord.formula && !editingRecord && (
                  <span className="detail-modal-formula">{detailRecord.formula}</span>
                )}
                {editingRecord && (
                  <input
                    type="text"
                    className="detail-modal-formula-input"
                    value={editingRecord.formula || ''}
                    onChange={(e) => handleEditFieldChange('formula', e.target.value)}
                    placeholder="Formula"
                  />
                )}
              </div>
              <div className="detail-modal-header-actions">
                {editingRecord ? (
                  <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button className="edit-btn" onClick={startEditing}>Edit</button>
                )}
                <button className="close-btn" onClick={closeDetail}>Close</button>
              </div>
            </div>

            <div className="detail-modal-body">
              <div className="detail-grid">
                {renderDetailField('normalized_intensity', 'Normalized Intensity', 'number', false)}
                {renderDetailField('effective_chi2', 'Effective χ²', 'number', false)}
                {renderDetailField('peak_position', 'Peak Position (cm⁻¹)', 'number', false)}
                {renderDetailField('peak_width', 'Peak Width (cm⁻¹)', 'number', false)}
                {renderDetailField('vibrational_mode', 'Vibrational Mode', 'text', false)}
                {renderDetailField('functional_group', 'Functional Group', 'text', false)}
                {renderDetailField('vis_angle', 'Visible Incident Angle (°)', 'number', false)}
                {renderDetailField('ir_angle', 'IR Incident Angle (°)', 'number', false)}
                {renderDetailField('laser_energy', 'Laser Energy', 'text', false)}
                {renderDetailField('instrument', 'Instrument', 'text', false)}
                {renderDetailField('reference', 'Reference', 'text', false)}
                {renderDetailField('uploader', 'Uploader', 'text', false)}
              </div>

              <div className="detail-image-section">
                <label className="detail-field-label">Spectrum Image</label>
                {editingRecord ? (
                  <div>
                    <input type="file" accept="image/jpeg,image/png" onChange={handleEditImageSelect} />
                    {editImagePreview && (
                      <img src={editImagePreview} alt="Preview" className="detail-image" />
                    )}
                    {!editImagePreview && detailRecord.image_path && (
                      <img src={`/api/database/images/${detailRecord.image_path}`} alt="Spectrum" className="detail-image" />
                    )}
                  </div>
                ) : detailRecord.image_path ? (
                  <img src={`/api/database/images/${detailRecord.image_path}`} alt="Spectrum" className="detail-image" />
                ) : (
                  <span className="detail-field-empty">No image</span>
                )}
              </div>

              {detailRecord.created_at && !editingRecord && (
                <div className="detail-created-at">
                  Created: {new Date(detailRecord.created_at).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Upload SFG Data</h2>
            <div className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Formula</label>
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Normalized Intensity</label>
                  <input
                    type="number"
                    value={normalizedIntensity}
                    onChange={(e) => setNormalizedIntensity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Effective χ²</label>
                  <input
                    type="number"
                    value={effectiveChi2}
                    onChange={(e) => setEffectiveChi2(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Peak Position</label>
                  <input
                    type="number"
                    value={peakPosition}
                    onChange={(e) => setPeakPosition(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Peak Width</label>
                  <input
                    type="number"
                    value={peakWidth}
                    onChange={(e) => setPeakWidth(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Vibrational Mode</label>
                  <input
                    type="text"
                    value={vibrationalMode}
                    onChange={(e) => setVibrationalMode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Functional Group</label>
                  <input
                    type="text"
                    value={functionalGroup}
                    onChange={(e) => setFunctionalGroup(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Visible Incident Angle</label>
                  <input
                    type="number"
                    value={visAngle}
                    onChange={(e) => setVisAngle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>IR Incident Angle</label>
                  <input
                    type="number"
                    value={irAngle}
                    onChange={(e) => setIrAngle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Laser Energy</label>
                  <input
                    type="text"
                    value={laserEnergy}
                    onChange={(e) => setLaserEnergy(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Instrument</label>
                  <input
                    type="text"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Reference</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Uploader</label>
                  <input
                    type="text"
                    value={uploader}
                    onChange={(e) => setUploader(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Spectrum Image (JPG/PNG)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageSelect}
                />
              </div>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: 120 }} />
                </div>
              )}
            </div>

            {uploadError && <div className="error-msg">{uploadError}</div>}

            <div className="modal-actions">
              <button onClick={closeModal} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !name.trim()}
                className="process-btn"
              >
                {uploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabasePage
