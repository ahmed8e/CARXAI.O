import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import UserSelect from '../../components/admin/UserSelect'
import {
  Upload, FileJson, FileText, CheckCircle2, AlertCircle,
  ArrowLeft, Eye, Loader2, Download
} from 'lucide-react'

interface PreviewRow {
  Business_name: string
  Category: string
  City: string
  Phone: string
  Lat: string
  Long: string
  [key: string]: string
}

function parseCSV(text: string): PreviewRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })
    return row
  })
}

const CSV_TEMPLATE = [
  'Business_name,Category,Address,City,State,PostalCode,Country,Phone,Website_url,Email,Lat,Long,Rating,Review,image1,BusinessDescription,Working_hour',
  '"Garage Example","Mécanicien","123 Rue Mohammed V","Casablanca","","20000","Morocco","+212-522-000000","https://example.com","info@example.com","33.5731","-7.5898","4.5","42","","Premium garage","Mon-Fri 8am-6pm"'
].join('\n')

export default function AdminImportProviders() {
  const navigate = useNavigate()
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [format, setFormat] = useState<'csv' | 'json' | null>(null)
  const [rawContent, setRawContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success?: number; failed?: number; error?: string } | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleFile = (file: File) => {
    const isJson = file.name.endsWith('.json')
    const isCsv = file.name.endsWith('.csv')
    if (!isJson && !isCsv) { setResult({ error: 'Only .csv or .json files are supported.' }); return }
    setFormat(isJson ? 'json' : 'csv')
    setResult(null)

    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setRawContent(text)
      try {
        if (isJson) {
          const parsed = JSON.parse(text)
          setPreview(Array.isArray(parsed) ? parsed.slice(0, 10) : [])
        } else {
          setPreview(parseCSV(text).slice(0, 10))
        }
      } catch { setResult({ error: 'Could not parse file. Check format.' }) }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!rawContent || preview.length === 0) return
    setImporting(true)
    setResult(null)

    try {
      let rows: any[]
      if (format === 'json') {
        rows = JSON.parse(rawContent)
      } else {
        rows = parseCSV(rawContent)
      }

      const cleaned = rows.map(r => ({
        Business_name: r.Business_name || null,
        Category: r.Category || null,
        Address: r.Address || null,
        City: r.City || null,
        State: r.State || null,
        PostalCode: r.PostalCode || null,
        Country: r.Country || 'Morocco',
        Phone: r.Phone || null,
        Website_url: r.Website_url || null,
        Email: r.Email || null,
        Lat: r.Lat || null,
        Long: r.Long || null,
        Rating: r.Rating ? parseFloat(r.Rating) : null,
        Review: r.Review ? parseInt(r.Review) : null,
        image1: r.image1 || null,
        BusinessDescription: r.BusinessDescription || null,
        Working_hour: r.Working_hour || null,
        assigned_user_id: selectedUserId,
      })).filter(r => r.Business_name)

      // Call the secure backend API instead of direct supabase insert
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ providers: cleaned })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Import failed')

      setResult({ success: data.added, failed: data.failed })
    } catch (e: any) {
      setResult({ error: e.message })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'carxai_providers_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/admin/providers')}
          className="w-9 h-9 rounded-xl bg-white border border-overlay flex items-center justify-center text-muted hover:text-navy hover:border-navy/20 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Import Providers</h1>
          <p className="text-sm text-muted">Bulk import mechanics and towing providers via CSV or JSON</p>
        </div>
      </div>

      {/* Template download */}
      <div className="flex items-center justify-between p-4 bg-navy/5 rounded-2xl border border-navy/10">
        <div>
          <p className="text-sm font-bold text-navy">Download CSV Template</p>
          <p className="text-xs text-muted mt-0.5">Fill in the template and upload it below</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy/90 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragging ? 'border-navy bg-navy/5' : 'border-overlay bg-white hover:border-navy/30 hover:bg-navy/[0.02]'
        }`}
      >
        <input type="file" accept=".csv,.json" onChange={handleFileInput} className="absolute inset-0 opacity-0 cursor-pointer" />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-navy" />
          </div>
          <div>
            <p className="font-bold text-on-surface">Drop CSV or JSON file here</p>
            <p className="text-sm text-muted mt-1">or click to browse</p>
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-low rounded-full border border-overlay">
              <FileText className="w-3.5 h-3.5 text-muted" />
              <span className="text-[11px] font-bold text-muted uppercase tracking-widest">CSV</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-low rounded-full border border-overlay">
              <FileJson className="w-3.5 h-3.5 text-muted" />
              <span className="text-[11px] font-bold text-muted uppercase tracking-widest">JSON</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <AnimatePresence>
        {preview.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-navy" />
                <p className="text-sm font-black text-on-surface">Preview — first {preview.length} rows</p>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                format === 'json' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>{format?.toUpperCase()}</span>
            </div>
            <div className="bg-white rounded-2xl border border-overlay overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="border-b border-overlay">
                  <tr>
                    {['Business_name', 'Category', 'City', 'Phone', 'Lat', 'Long'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-overlay">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-low/50">
                      {['Business_name', 'Category', 'City', 'Phone', 'Lat', 'Long'].map(k => (
                        <td key={k} className="px-4 py-2.5 text-on-surface truncate max-w-[130px]">{row[k] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-overlay shadow-sm space-y-4">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Import Settings</h3>
              <UserSelect
                selectedUserId={selectedUserId}
                onSelect={setSelectedUserId}
                label="Assign these providers to:"
              />
              
              <button 
                onClick={handleImport} 
                disabled={importing || !selectedUserId}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy text-white text-sm font-bold shadow-sm shadow-navy/20 hover:bg-navy/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                {importing ? 'Importing…' : `Import ${rawContent ? 'All' : preview.length} Providers to Selected User`}
              </button>
              {!selectedUserId && (
                <p className="text-[10px] text-red-500 font-bold text-center italic">
                  * Please select a target user before importing
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {result.error ? (
              <div className="flex items-center gap-2 px-4 py-3.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 font-medium">{result.error}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 font-bold">
                  Import complete — {result.success} added{result.failed ? `, ${result.failed} failed` : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
