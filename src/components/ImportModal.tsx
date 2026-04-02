'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import type { Application, ApplicationStatus } from '@/lib/types'

// ── Field definitions ─────────────────────────────────────────────────────────

type AppField =
  | 'company' | 'position' | 'status' | 'url' | 'notes'
  | 'salary' | 'salary_period' | 'location' | 'deadline'
  | 'applied_date' | 'interview_date' | 'ignore'

const FIELD_OPTIONS: { value: AppField; label: string; required?: boolean }[] = [
  { value: 'ignore',         label: '— Yoksay —' },
  { value: 'company',        label: 'Şirket',            required: true },
  { value: 'position',       label: 'Pozisyon',          required: true },
  { value: 'status',         label: 'Durum' },
  { value: 'location',       label: 'Konum' },
  { value: 'salary',         label: 'Maaş' },
  { value: 'salary_period',  label: 'Maaş Dönemi' },
  { value: 'url',            label: 'İlan Linki' },
  { value: 'applied_date',   label: 'Başvuru Tarihi' },
  { value: 'deadline',       label: 'Son Başvuru Tarihi' },
  { value: 'interview_date', label: 'Mülakat Tarihi' },
  { value: 'notes',          label: 'Notlar' },
]

const VALID_STATUSES = new Set<ApplicationStatus>(['wishlist', 'applied', 'interview', 'offered', 'rejected'])

// Normalize Turkish diacritics → ASCII for fuzzy matching
function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[İi̇]/g, 'i').replace(/ı/g, 'i')
    .replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o').replace(/[âÂ]/g, 'a')
    .replace(/\s+/g, ' ').trim()
}

// Build status alias lookup with normalized keys
const STATUS_ALIASES: Record<string, ApplicationStatus> = {
  // wishlist / not applied
  'wishlist': 'wishlist',
  'istek listesi': 'wishlist', 'istek': 'wishlist', 'liste': 'wishlist',
  'basvurulmadi': 'wishlist', 'basvuru yapilmadi': 'wishlist',
  'henuz basvurulmadi': 'wishlist', 'basvurulmamis': 'wishlist',
  'uygulanmadi': 'wishlist', 'bekliyor': 'wishlist', 'bekleniyor': 'wishlist',
  'not applied': 'wishlist', 'didnt applied': 'wishlist', 'didnt apply': 'wishlist',
  "didn't apply": 'wishlist', "didn't applied": 'wishlist',
  'did not apply': 'wishlist', 'not yet applied': 'wishlist',
  'pending': 'wishlist', 'todo': 'wishlist',
  'to apply': 'wishlist', 'dusunuluyor': 'wishlist', 'planlanıyor': 'wishlist',
  'planlaniyor': 'wishlist', 'kayitli': 'wishlist', 'saved': 'wishlist',
  // applied
  'applied': 'applied',
  'basvuruldu': 'applied', 'basvuru yapildi': 'applied', 'gonderildi': 'applied',
  'submitted': 'applied', 'sent': 'applied', 'basvurdum': 'applied',
  // interview
  'interview': 'interview',
  'mulakat': 'interview', 'gorusme': 'interview', 'mulakatta': 'interview',
  'mulakat asamasinda': 'interview', 'mulakate cagirildi': 'interview',
  'in progress': 'interview', 'surec': 'interview', 'devam ediyor': 'interview',
  // offered
  'offered': 'offered', 'offer': 'offered',
  'teklif': 'offered', 'teklif alindi': 'offered', 'kabul edildi': 'offered',
  'accepted': 'offered', 'hired': 'offered', 'kazanildi': 'offered',
  // rejected
  'rejected': 'rejected',
  'reddedildi': 'rejected', 'red': 'rejected', 'elendi': 'rejected',
  'gecildi': 'rejected', 'olumsuz': 'rejected', 'declined': 'rejected',
  'basarisiz': 'rejected', 'iptal': 'rejected', 'canceled': 'rejected',
}

function normalizeStatus(raw: string): ApplicationStatus {
  const key = norm(raw)
  if (STATUS_ALIASES[key]) return STATUS_ALIASES[key]
  // Partial match fallback
  if (key.includes('basvurulmad') || key.includes('not apply') || key.includes('yapilmad')) return 'wishlist'
  if (key.includes('basvurul') || key.includes('submit') || key.includes('gonder')) return 'applied'
  if (key.includes('mulakat') || key.includes('intervie') || key.includes('gorusm')) return 'interview'
  if (key.includes('teklif') || key.includes('offer') || key.includes('kabul')) return 'offered'
  if (key.includes('redded') || key.includes('reject') || key.includes('elen')) return 'rejected'
  if (VALID_STATUSES.has(key as ApplicationStatus)) return key as ApplicationStatus
  return 'wishlist'
}

// ── Safe date parser — returns null for non-date strings ─────────────────────

function safeDate(raw: string): string | null {
  if (!raw || raw.length < 4) return null
  // ISO: 2024-01-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmy = raw.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})$/)
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    const d = new Date(`${year}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  // Natural language: "Jan 15, 2024", "15 January 2024", etc.
  const d = new Date(raw)
  if (!isNaN(d.getTime()) && d.getFullYear() > 1990 && d.getFullYear() < 2100) {
    return d.toISOString().split('T')[0]
  }
  return null // "Başvurulmadı" and any non-date string → null
}

// ── Auto-detect column → field ────────────────────────────────────────────────

function autoDetect(header: string): AppField {
  const h = norm(header)

  // Status — checked BEFORE applied_date to avoid "Başvuru Durumu" → applied_date
  if (['status', 'durum', 'asama', 'surec', 'stage', 'basvuru durumu',
       'is durumu', 'aşama', 'basvuru asama', 'hal'].some(k => h.includes(norm(k)))) return 'status'

  // Company
  if (['company', 'sirket', 'firma', 'employer', 'organization', 'org',
       'is yeri', 'isyeri', 'kurum', 'kuruluş', 'kurulusu', 'sirket adi',
       'firma adi', 'firma ismi', 'sirket ismi', 'sirket adi', 'name of company',
       'company name', 'where', 'nereye', 'ise veren', 'isverenin adi',
       'hangi sirket', 'hangi firma'].some(k => h.includes(norm(k)))) return 'company'

  // Position
  if (['position', 'pozisyon', 'role', 'rol', 'title', 'unvan', 'gorev',
       'is unvani', 'job title', 'job role', 'is tanimi', 'is adi',
       'ne isi', 'pozisyon adi', 'is pozisyonu', 'hangi pozisyon',
       'hangi rol', 'job', 'is', 'iş'].some(k => h === norm(k) || h.includes(norm(k)))) return 'position'

  // Location
  if (['location', 'konum', 'sehir', 'city', 'lokasyon', 'yer',
       'nerede', 'ofis', 'remote', 'sehir/ulke', 'ulke', 'country'].some(k => h.includes(norm(k)))) return 'location'

  // Salary
  if (['salary', 'maas', 'ucret', 'wage', 'pay', 'odeme', 'kazanc', 'gelir',
       'beklenti', 'maas beklentisi', 'ucret beklentisi', 'maas teklifi',
       'net maas', 'brut maas', 'monthly salary', 'annual salary'].some(k => h.includes(norm(k)))) return 'salary'

  // Salary period (check before general "period" to avoid false matches)
  if (['salary period', 'maas donemi', 'odeme periyodu', 'aylik mi', 'yillik mi',
       'period', 'donem', 'periyot'].some(k => h.includes(norm(k)))) return 'salary_period'

  // URL — specific, check before notes
  if (['url', 'link', 'ilan linki', 'ilan baglantisi', 'baglanti', 'adres',
       'website', 'apply link', 'job link', 'uygulama linki'].some(k => h.includes(norm(k)))) return 'url'

  // Deadline — "son" + date OR "deadline" keyword
  if (['deadline', 'son basvuru tarihi', 'son basvuru', 'bitis tarihi',
       'kapanma tarihi', 'son tarih', 'last date', 'closing date'].some(k => h.includes(norm(k)))) return 'deadline'

  // Applied date — must include "tarih" or "date" to be specific
  if (['basvuru tarihi', 'applied date', 'application date', 'ne zaman basvuruldu',
       'basvuru tarih', 'application tarihi', 'when applied'].some(k => h.includes(norm(k)))) return 'applied_date'

  // Interview date
  if (['mulakat tarihi', 'interview date', 'gorusme tarihi', 'mulakat tarih',
       'mulakat gunu', 'interview day', 'gorusme gunu'].some(k => h.includes(norm(k)))) return 'interview_date'

  // Notes
  if (['note', 'notlar', 'aciklama', 'yorum', 'comment', 'remark', 'detail',
       'bilgi', 'hakkinda', 'ekstra', 'extra', 'diger', 'other', 'memo'].some(k => h.includes(norm(k)))) return 'notes'

  return 'ignore'
}

// ── Row builder ───────────────────────────────────────────────────────────────

type ImportRow = {
  company: string
  position: string
  status: ApplicationStatus
  url?: string | null
  notes?: string | null
  salary?: number | null
  salary_period?: 'monthly' | 'yearly' | null
  location?: string | null
  deadline?: string | null
  applied_date?: string | null
  interview_date?: string | null
}

function buildImportRows(
  headers: string[],
  rows: string[][],
  mapping: Record<string, AppField>
): { valid: ImportRow[]; skipped: number } {
  let skipped = 0
  const valid: ImportRow[] = []

  for (const row of rows) {
    const obj: Record<string, unknown> = {}
    headers.forEach((h, i) => {
      const field = mapping[h]
      if (field === 'ignore') return
      const raw = (row[i] ?? '').toString().trim()
      if (!raw) return

      if (field === 'salary') {
        const n = Number(raw.replace(/[^\d.]/g, ''))
        if (n > 0) obj[field] = n
      } else if (field === 'salary_period') {
        const v = norm(raw)
        obj[field] = v.includes('yil') || v.includes('year') || v === 'yearly' || v === 'annual' ? 'yearly' : 'monthly'
      } else if (field === 'status') {
        obj[field] = normalizeStatus(raw)
      } else if (field === 'deadline' || field === 'applied_date' || field === 'interview_date') {
        // Validate date — non-date strings (e.g. "Başvurulmadı") are silently dropped
        const d = safeDate(raw)
        if (d) obj[field] = d
      } else {
        obj[field] = raw
      }
    })

    // Only skip if company is missing — position gets a placeholder
    if (!obj.company) { skipped++; continue }
    valid.push({
      company: obj.company as string,
      position: (obj.position as string) || 'Belirtilmemiş',
      status: (obj.status as ApplicationStatus) ?? 'wishlist',
      url: (obj.url as string) ?? null,
      notes: (obj.notes as string) ?? null,
      salary: (obj.salary as number) ?? null,
      salary_period: (obj.salary_period as 'monthly' | 'yearly') ?? null,
      location: (obj.location as string) ?? null,
      deadline: (obj.deadline as string) ?? null,
      applied_date: (obj.applied_date as string) ?? null,
      interview_date: (obj.interview_date as string) ?? null,
    })
  }

  return { valid, skipped }
}

// ── File parser ───────────────────────────────────────────────────────────────

function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'binary', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })
        const nonEmpty = raw.filter((r: unknown[]) => (r as unknown[]).some(c => c != null && c !== ''))
        if (nonEmpty.length < 2) { reject(new Error('Dosya en az 1 başlık + 1 veri satırı içermelidir')); return }
        const headers = (nonEmpty[0] as unknown[]).map(c => String(c ?? '').trim()).filter(Boolean)
        const rows = nonEmpty.slice(1).map(r =>
          headers.map((_, i) => String((r as unknown[])[i] ?? '').trim())
        )
        resolve({ headers, rows })
      } catch {
        reject(new Error('Dosya okunamadı. Geçerli bir .xlsx veya .csv dosyası yükle.'))
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsBinaryString(file)
  })
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImported: (apps: Application[]) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [step, setStep]           = useState<'upload' | 'map'>('upload')
  const [dragging, setDragging]   = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [headers, setHeaders]     = useState<string[]>([])
  const [rows, setRows]           = useState<string[][]>([])
  const [mapping, setMapping]     = useState<Record<string, AppField>>({})
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [fileName, setFileName]   = useState('')
  const fileInputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep('upload'); setDragging(false); setParseError(null)
      setHeaders([]); setRows([]); setMapping({}); setImporting(false)
      setImportError(null); setFileName('')
    }
  }, [open])

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('Yalnızca .xlsx, .xls veya .csv dosyaları desteklenmektedir.')
      return
    }
    setParseError(null)
    setFileName(file.name)
    try {
      const { headers: h, rows: r } = await parseFile(file)
      if (r.length === 0) {
        setParseError('Hiç satır içe aktarılamadı — sütun isimlerini kontrol et.')
        return
      }
      const autoMapping: Record<string, AppField> = {}
      h.forEach(col => { autoMapping[col] = autoDetect(col) })
      setHeaders(h)
      setRows(r)
      setMapping(autoMapping)
      setStep('map')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Dosya okunamadı')
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function updateMapping(col: string, field: AppField) {
    setMapping(prev => ({ ...prev, [col]: field }))
  }

  // Only company is truly required; position defaults to 'Belirtilmemiş' if missing
  const requiredMapped = Object.values(mapping).includes('company')

  const { valid, skipped } = step === 'map'
    ? buildImportRows(headers, rows, mapping)
    : { valid: [], skipped: 0 }

  async function handleImport() {
    if (!requiredMapped || valid.length === 0) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/applications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: valid }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'İçe aktarma başarısız')
      }
      const { data } = await res.json()
      onImported(data)
      onClose()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop"
      style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full animate-modal flex flex-col"
        style={{
          maxWidth: step === 'map' ? 900 : 480,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          borderRadius: 20,
          maxHeight: 'calc(100dvh - 2rem)',
          transition: 'max-width 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--teal-glow)', border: '1px solid var(--teal)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h5" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="13" cy="12" r="2.5" stroke="var(--teal)" strokeWidth="1.5"/>
                <path d="M13 11v2M12 12h2" stroke="var(--teal)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Excel / CSV İçe Aktar
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {step === 'upload' ? '.xlsx, .xls veya .csv dosyası seç' : `${fileName} · ${rows.length} satır`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              <StepDot active={step === 'upload'} done={step === 'map'} label="1" />
              <div className="w-6 h-px" style={{ background: 'var(--border-strong)' }} />
              <StepDot active={step === 'map'} done={false} label="2" />
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'upload' ? (
            <UploadStep
              dragging={dragging}
              error={parseError}
              fileInputRef={fileInputRef}
              onFile={handleFile}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
            />
          ) : (
            <MapStep
              headers={headers}
              rows={rows}
              mapping={mapping}
              onMappingChange={updateMapping}
              valid={valid.length}
              skipped={skipped}
              requiredMapped={requiredMapped}
              importing={importing}
              importError={importError}
              onBack={() => setStep('upload')}
              onImport={handleImport}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step dot ──────────────────────────────────────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
      style={{
        background: done ? 'var(--teal)' : active ? 'var(--teal-glow)' : 'var(--bg-raised)',
        border: `1.5px solid ${done || active ? 'var(--teal)' : 'var(--border-strong)'}`,
        color: done ? 'white' : active ? 'var(--teal)' : 'var(--text-muted)',
      }}
    >
      {done ? (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : label}
    </div>
  )
}

// ── Upload step ───────────────────────────────────────────────────────────────

function UploadStep({
  dragging, error, fileInputRef, onFile, onDrop, onDragOver, onDragLeave,
}: {
  dragging: boolean
  error: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onFile: (f: File) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
}) {
  return (
    <div className="p-6 flex flex-col gap-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
        style={{
          padding: '3.5rem 2rem',
          border: `2px dashed ${dragging ? 'var(--teal)' : 'var(--border-strong)'}`,
          background: dragging ? 'var(--teal-glow)' : 'var(--bg-surface)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{
            background: dragging ? 'var(--teal-glow)' : 'var(--bg-raised)',
            border: `1px solid ${dragging ? 'var(--teal)' : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: dragging ? 'var(--teal)' : 'var(--text-muted)' }}>
            <path d="M12 16V8M9 11l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 16.5A3.5 3.5 0 0018 10h-.5A6 6 0 106 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: dragging ? 'var(--teal)' : 'var(--text-primary)' }}>
            {dragging ? 'Bırak!' : 'Dosyayı sürükle veya tıkla'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            .xlsx, .xls, .csv desteklenmektedir
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />

      {error && (
        <p
          className="text-sm px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', border: '1px solid var(--status-rejected-text)' }}
        >
          {error}
        </p>
      )}

      {/* Format hint */}
      <div className="rounded-xl p-3.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Beklenen sütun adları (otomatik eşleşir):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['company / şirket', 'position / pozisyon', 'status / durum', 'location / konum', 'salary / maaş', 'url / link'].map(h => (
            <span
              key={h}
              className="px-2 py-0.5 rounded-md text-xs font-mono"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Map step ──────────────────────────────────────────────────────────────────

function MapStep({
  headers, rows, mapping, onMappingChange,
  valid, skipped, requiredMapped, importing, importError, onBack, onImport,
}: {
  headers: string[]
  rows: string[][]
  mapping: Record<string, AppField>
  onMappingChange: (col: string, field: AppField) => void
  valid: number
  skipped: number
  requiredMapped: boolean
  importing: boolean
  importError: string | null
  onBack: () => void
  onImport: () => void
}) {
  const preview = rows.slice(0, 5)
  const missingRequired = ['company'].filter(
    f => !Object.values(mapping).includes(f as AppField)
  )

  return (
    <div className="flex flex-col">
      {/* Stats bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <Stat value={rows.length} label="satır" color="var(--text-primary)" />
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <Stat value={valid} label="geçerli" color="var(--status-offered-text)" />
        {skipped > 0 && (
          <>
            <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
            <Stat value={skipped} label="atlanacak" color="var(--status-rejected-text)" />
          </>
        )}
        <div className="flex-1" />
        {missingRequired.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--status-interview-text)' }}>
            Gerekli: Şirket eşleştirilmedi
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1" style={{ maxHeight: '55vh' }}>
        <table className="w-full border-collapse" style={{ fontSize: '11px', minWidth: headers.length * 140 }}>
          {/* Column mapping row */}
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-strong)', position: 'sticky', top: 0, zIndex: 1 }}>
              {headers.map(col => {
                const field = mapping[col]
                const isRequired = field === 'company' || field === 'position'
                const isSet = field !== 'ignore'
                return (
                  <th key={col} className="text-left" style={{ padding: '10px 12px', minWidth: 140, verticalAlign: 'top' }}>
                    {/* Original column name */}
                    <div
                      className="text-xs mb-1.5 truncate font-mono"
                      style={{ color: 'var(--text-muted)', maxWidth: 140 }}
                      title={col}
                    >
                      {col}
                    </div>
                    {/* Field select */}
                    <select
                      value={field}
                      onChange={e => onMappingChange(col, e.target.value as AppField)}
                      className="w-full input-base"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        height: 28,
                        borderColor: isRequired ? 'var(--teal)' : isSet ? 'var(--border-strong)' : 'var(--border)',
                        color: isRequired ? 'var(--teal)' : isSet ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {FIELD_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}{o.required ? ' *' : ''}</option>
                      ))}
                    </select>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Preview rows */}
          <tbody>
            {preview.map((row, ri) => (
              <tr
                key={ri}
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="font-mono truncate"
                    style={{ padding: '7px 12px', color: cell ? 'var(--text-secondary)' : 'var(--text-muted)', maxWidth: 160 }}
                    title={cell}
                  >
                    {cell || <span style={{ opacity: 0.3 }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length > 5 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="text-center py-2"
                  style={{ color: 'var(--text-muted)', fontSize: '11px', borderTop: '1px solid var(--border)' }}
                >
                  + {rows.length - 5} satır daha gösterilmiyor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {importError && (
          <p className="flex-1 text-xs" style={{ color: 'var(--status-rejected-text)' }}>{importError}</p>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1.5px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Geri
          </button>
          <button
            onClick={onImport}
            disabled={!requiredMapped || valid === 0 || importing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--teal)' }}
          >
            {importing ? (
              <>
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Aktarılıyor…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M4 6l3 3 3-3M1 11h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {valid} satırı içe aktar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stat ──────────────────────────────────────────────────────────────────────

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </span>
  )
}
