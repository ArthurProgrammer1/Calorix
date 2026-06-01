'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Loader2, Plus, CheckCircle2, Camera, Upload, X, Sparkles, ScanBarcode } from 'lucide-react'
import { addFoodEntry, getUser, getRecentFoods } from '@/lib/storage'
import type { MealType } from '@/types'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(
  () => import('@/components/log/BarcodeScanner').then(m => m.BarcodeScanner),
  { ssr: false, loading: () => <div className="rounded-2xl flex items-center justify-center" style={{ aspectRatio: '4/3', background: '#000' }}><Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" /></div> }
)

const mealTabs: { type: MealType; emoji: string; label: string }[] = [
  { type: 'breakfast', emoji: '🌅', label: 'Breakfast' },
  { type: 'lunch', emoji: '🥗', label: 'Lunch' },
  { type: 'dinner', emoji: '🍽️', label: 'Dinner' },
  { type: 'snack', emoji: '🍎', label: 'Snack' },
]

interface FoodResult {
  name: string; calories: number; protein: number; carbs: number; fat: number
  serving?: string; portion?: string
}

const cs = {
  card: { background: 'var(--cx-card)', border: '1px solid var(--cx-border)', borderRadius: 16 } as React.CSSProperties,
  input: { background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', color: 'var(--cx-text)', borderRadius: 12 } as React.CSSProperties,
  text: { color: 'var(--cx-text)' } as React.CSSProperties,
  text2: { color: 'var(--cx-text2)' } as React.CSSProperties,
  text3: { color: 'var(--cx-text3)' } as React.CSSProperties,
  label: { color: 'var(--cx-label)' } as React.CSSProperties,
}

// Resize image on canvas before sending to keep payload small
async function resizeImage(file: File, maxPx = 1024): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = e => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

function ResultCard({ r, onAdd, added }: { r: FoodResult; onAdd: (r: FoodResult) => void; added: boolean }) {
  const serving = r.serving || r.portion || ''
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-2xl p-4 transition-all"
      style={added ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.4)' } : cs.card}>
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-semibold truncate" style={cs.text}>{r.name}</p>
        <p className="text-xs" style={cs.text3}>{serving}{serving ? ' · ' : ''}P:{r.protein}g C:{r.carbs}g F:{r.fat}g</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-bold text-[#22C55E]">{r.calories} kcal</span>
        {added ? (
          <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
        ) : (
          <button onClick={() => onAdd(r)} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#22C55E] transition hover:bg-[#22C55E] hover:text-black"
            style={{ background: 'rgba(34,197,94,0.12)' }}>
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function LogContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [meal, setMeal] = useState<MealType>((params.get('meal') as MealType) || 'snack')
  const [mode, setMode] = useState<'search' | 'barcode' | 'photo' | 'manual'>('search')

  // Search state
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoodResult[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Photo state
  const [image, setImage] = useState<{ preview: string; base64: string; mimeType: string } | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [photoResults, setPhotoResults] = useState<FoodResult[]>([])
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [photoNote, setPhotoNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Manual state
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })

  // Selected (search mode)
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const [recentFoods, setRecentFoods] = useState<import('@/lib/storage').RecentFood[]>([])

  useEffect(() => {
    if (!getUser()) router.push('/onboarding')
    setRecentFoods(getRecentFoods())
  }, [router])

  // ── Search ──
  async function runSearch(q: string) {
    if (!q.trim()) return
    setSearching(true); setSearchResults([])
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data)
      if (data.length === 0) toast.info('No results — try a different term')
    } catch { toast.error('Search failed') }
    finally { setSearching(false) }
  }

  function handleSearch() { runSearch(query) }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (val.trim().length >= 3) {
      searchTimer.current = setTimeout(() => runSearch(val), 600)
    } else {
      setSearchResults([])
    }
  }

  function handleAddSearch(food: FoodResult) {
    logFood(food)
    setSelected(food)
    setTimeout(() => router.push('/dashboard'), 800)
  }

  // ── Photo ──
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { base64, mimeType } = await resizeImage(file)
      setImage({ preview: URL.createObjectURL(file), base64, mimeType })
      setPhotoResults([])
      setAddedItems(new Set())
      setPhotoNote('')
    } catch { toast.error('Could not load image') }
  }

  async function handleAnalyse() {
    if (!image) return
    setAnalysing(true)
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mimeType, note: photoNote }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || 'Analysis failed')
        return
      }
      if (!Array.isArray(data) || data.length === 0) {
        toast.info('No food detected — try a clearer photo')
        return
      }
      setPhotoResults(data)
      toast.success(`Found ${data.length} item${data.length > 1 ? 's' : ''}!`)
    } catch { toast.error('Analysis failed') }
    finally { setAnalysing(false) }
  }

  function handleAddPhoto(food: FoodResult) {
    const key = food.name + food.calories
    if (addedItems.has(key)) return
    logFood(food)
    setAddedItems(prev => new Set([...prev, key]))
    toast.success(`${food.name} added!`)
  }

  function handleAddAll() {
    photoResults.forEach(f => {
      const key = f.name + f.calories
      if (!addedItems.has(key)) logFood(f)
    })
    setAddedItems(new Set(photoResults.map(f => f.name + f.calories)))
    toast.success('All items added!')
    setTimeout(() => router.push('/dashboard'), 800)
  }

  // ── Manual ──
  function handleManualAdd() {
    if (!manual.name || !manual.calories) { toast.error('Name and calories required'); return }
    logFood({ name: manual.name, calories: Number(manual.calories), protein: Number(manual.protein) || 0, carbs: Number(manual.carbs) || 0, fat: Number(manual.fat) || 0 })
    toast.success(`${manual.name} added!`)
    router.push('/dashboard')
  }

  function logFood(food: FoodResult & { serving?: string }) {
    const today = new Date().toISOString().split('T')[0]
    addFoodEntry({ date: today, mealType: meal, name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat })
    setRecentFoods(getRecentFoods())
    return true
  }

  // ── Barcode ──
  const [scanning, setScanning] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState<{
    name: string; serving: string;
    per100g: { calories: number; protein: number; carbs: number; fat: number }
  } | null>(null)
  const [barcodeGrams, setBarcodeGrams] = useState('100')

  async function handleBarcodeDetected(code: string) {
    setScanning(false)
    toast.loading('Looking up product…', { id: 'barcode' })
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      toast.dismiss('barcode')
      if (!res.ok || data.error) { toast.error(data.error || 'Product not found'); return }
      setBarcodeProduct(data)
      setBarcodeGrams('100')
    } catch {
      toast.dismiss('barcode')
      toast.error('Lookup failed — try again')
    }
  }

  function getBarcodeNutrition() {
    if (!barcodeProduct) return null
    const g = Math.max(1, Number(barcodeGrams) || 100)
    const ratio = g / 100
    return {
      calories: Math.round(barcodeProduct.per100g.calories * ratio),
      protein:  Math.round(barcodeProduct.per100g.protein  * ratio),
      carbs:    Math.round(barcodeProduct.per100g.carbs    * ratio),
      fat:      Math.round(barcodeProduct.per100g.fat      * ratio),
    }
  }

  function handleBarcodeAdd() {
    if (!barcodeProduct) return
    const n = getBarcodeNutrition()!
    logFood({ name: `${barcodeProduct.name} (${barcodeGrams}g)`, ...n })
    toast.success(`${barcodeProduct.name} added!`)
    router.push('/dashboard')
  }

  const modes = [
    { id: 'search',  label: '🔍 Search' },
    { id: 'barcode', label: '📊 Barcode' },
    { id: 'photo',   label: '📸 AI Photo' },
    { id: 'manual',  label: '✏️ Manual' },
  ] as const

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-bold" style={cs.text}>Log Food</motion.h1>

      {/* Meal tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {mealTabs.map(({ type, emoji, label }) => (
          <button key={type} onClick={() => setMeal(type)}
            className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all"
            style={meal === type ? { background: '#22C55E', color: '#000' } : { ...cs.card, color: 'var(--cx-text2)' }}>
            <span>{emoji}</span>{label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="mb-5 flex rounded-2xl p-1" style={{ background: 'var(--cx-card)', border: '1px solid var(--cx-border)' }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={cn('flex-1 rounded-xl py-2.5 text-sm font-medium transition-all')}
            style={mode === m.id ? { background: '#22C55E', color: '#000' } : { color: 'var(--cx-text2)' }}>
            {m.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Search mode ── */}
        {mode === 'search' && (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-4 flex gap-2">
              <input value={query} onChange={e => handleQueryChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search food (e.g. chicken breast, banana)…"
                className="flex-1 rounded-xl px-4 py-3 outline-none transition"
                style={cs.input} />
              <button onClick={handleSearch} disabled={searching}
                className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((r, i) => (
                  <ResultCard key={i} r={r} onAdd={handleAddSearch} added={selected?.name === r.name} />
                ))}
              </div>
            )}
            {searchResults.length === 0 && !searching && recentFoods.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={cs.text3}>Recently Logged</p>
                <div className="space-y-2">
                  {recentFoods.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-2xl p-3.5" style={cs.card}>
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-sm truncate" style={cs.text}>{f.name}</p>
                        <p className="text-xs" style={cs.text3}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-bold text-sm text-[#22C55E]">{f.calories} kcal</span>
                        <button onClick={() => { logFood(f); toast.success(`${f.name} added!`) }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-[#22C55E] transition hover:bg-[#22C55E] hover:text-black"
                          style={{ background: 'rgba(34,197,94,0.12)' }}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Barcode mode ── */}
        {mode === 'barcode' && (
          <motion.div key="barcode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!scanning && !barcodeProduct && (
              <div className="flex flex-col items-center justify-center rounded-3xl py-14 px-6 text-center cursor-pointer transition-all"
                style={{ background: 'var(--cx-inner)', border: '2px dashed var(--cx-border)' }}
                onClick={() => setScanning(true)}>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <ScanBarcode className="h-7 w-7 text-[#22C55E]" />
                </div>
                <p className="font-semibold mb-1" style={cs.text}>Scan a barcode</p>
                <p className="text-sm mb-5" style={cs.text3}>Point your camera at any packaged food barcode</p>
                <span className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                  <ScanBarcode className="h-4 w-4" /> Open Scanner
                </span>
              </div>
            )}

            {scanning && (
              <BarcodeScanner
                onDetected={handleBarcodeDetected}
                onClose={() => setScanning(false)}
              />
            )}

            {barcodeProduct && !scanning && (() => {
              const n = getBarcodeNutrition()!
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Product card */}
                  <div className="rounded-2xl p-5" style={cs.card}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <p className="font-bold text-base leading-tight" style={cs.text}>{barcodeProduct.name}</p>
                        <p className="text-xs mt-1" style={cs.text3}>Per 100g: {barcodeProduct.per100g.calories} kcal · P:{barcodeProduct.per100g.protein}g C:{barcodeProduct.per100g.carbs}g F:{barcodeProduct.per100g.fat}g</p>
                      </div>
                      <button onClick={() => setBarcodeProduct(null)} style={cs.text3}><X className="h-4 w-4" /></button>
                    </div>

                    {/* Grams input */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={cs.text3}>Serving size (grams)</label>
                      <div className="flex items-center gap-3">
                        <input type="number" value={barcodeGrams} onChange={e => setBarcodeGrams(e.target.value)}
                          className="w-28 rounded-xl px-4 py-2.5 text-center font-semibold outline-none"
                          style={{ ...cs.input, fontSize: 18 }} min="1" max="2000" />
                        <div className="flex gap-2">
                          {['50', '100', '150', '200'].map(g => (
                            <button key={g} onClick={() => setBarcodeGrams(g)}
                              className="rounded-xl px-3 py-1.5 text-xs font-medium transition"
                              style={barcodeGrams === g ? { background: '#22C55E', color: '#000' } : { background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', color: 'var(--cx-text2)' }}>
                              {g}g
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Calculated macros */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Calories', value: `${n.calories}`, unit: 'kcal', color: '#22C55E' },
                        { label: 'Protein',  value: `${n.protein}g`,  unit: '',     color: '#3B82F6' },
                        { label: 'Carbs',    value: `${n.carbs}g`,    unit: '',     color: '#F59E0B' },
                        { label: 'Fat',      value: `${n.fat}g`,      unit: '',     color: '#A855F7' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'var(--cx-inner)' }}>
                          <div className="text-sm font-bold" style={{ color }}>{value}</div>
                          <div className="text-[10px]" style={cs.text3}>{label}</div>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleBarcodeAdd}
                      className="w-full rounded-xl py-3 font-semibold text-black transition hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                      Add to {mealTabs.find(m => m.type === meal)?.label}
                    </button>
                  </div>

                  <button onClick={() => { setBarcodeProduct(null); setScanning(true) }}
                    className="w-full rounded-xl py-2.5 text-sm transition" style={{ color: 'var(--cx-text3)' }}>
                    Scan a different product
                  </button>
                </motion.div>
              )
            })()}
          </motion.div>
        )}

        {/* ── Photo mode ── */}
        {mode === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {!image ? (
              /* Upload zone */
              <div
                className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-14 px-6 text-center cursor-pointer transition-all"
                style={{ borderColor: 'var(--cx-border)', background: 'var(--cx-inner)' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#22C55E' }}
                onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--cx-border)' }}
                onDrop={async e => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--cx-border)'
                  const file = e.dataTransfer.files[0]
                  if (file?.type.startsWith('image/')) {
                    const { base64, mimeType } = await resizeImage(file)
                    setImage({ preview: URL.createObjectURL(file), base64, mimeType })
                    setPhotoResults([]); setAddedItems(new Set())
                  }
                }}>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl mx-auto"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <Camera className="h-7 w-7 text-[#22C55E]" />
                </div>
                <p className="font-semibold mb-1" style={cs.text}>Take or upload a photo</p>
                <p className="text-sm mb-5" style={cs.text3}>Snap your meal and AI will estimate the calories automatically</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <span className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-[#22C55E]"
                    style={{ background: 'rgba(34,197,94,0.12)' }}>
                    <Camera className="h-4 w-4" /> Camera
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium" style={{ background: 'var(--cx-card)', border: '1px solid var(--cx-border)', color: 'var(--cx-text2)' }}>
                    <Upload className="h-4 w-4" /> Upload
                  </span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              /* Image preview + results */
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: 280 }}>
                  <img src={image.preview} alt="Food" className="w-full object-cover" style={{ maxHeight: 280 }} />
                  <button
                    onClick={() => { setImage(null); setPhotoResults([]); setAddedItems(new Set()); setPhotoNote('') }}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:scale-110"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Note field + Analyse — shown before results */}
                {photoResults.length === 0 && !analysing && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--cx-card)', border: '1px solid var(--cx-border)' }}>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--cx-text3)' }}>
                        Any notes for the AI? <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        value={photoNote}
                        onChange={e => setPhotoNote(e.target.value)}
                        placeholder="e.g. made with tortilla instead of dough, half portion, no cheese…"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                        style={{ background: 'var(--cx-inner)', border: '1px solid var(--cx-border)', color: 'var(--cx-text)' }}
                      />
                    </div>
                    <button onClick={handleAnalyse} disabled={analysing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                      <Sparkles className="h-4 w-4" /> Analyse Food
                    </button>
                  </div>
                )}

                {/* Results */}
                {analysing && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <Sparkles className="h-5 w-5 text-[#22C55E] animate-pulse" />
                    </div>
                    <p className="text-sm font-medium" style={cs.text}>Identifying your meal…</p>
                    <p className="text-xs" style={cs.text3}>This takes a few seconds</p>
                  </div>
                )}

                {photoResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold" style={cs.text}>{photoResults.length} item{photoResults.length > 1 ? 's' : ''} detected</p>
                      {photoResults.length > 1 && addedItems.size < photoResults.length && (
                        <button onClick={handleAddAll}
                          className="rounded-xl px-4 py-1.5 text-sm font-semibold text-black transition hover:opacity-90"
                          style={{ background: '#22C55E' }}>
                          Add All
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {photoResults.map((r, i) => (
                        <ResultCard key={i} r={r} onAdd={handleAddPhoto} added={addedItems.has(r.name + r.calories)} />
                      ))}
                    </div>
                    {addedItems.size > 0 && (
                      <button onClick={() => router.push('/dashboard')}
                        className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold transition hover:opacity-90"
                        style={{ background: 'var(--cx-card)', border: '1px solid var(--cx-border)', color: 'var(--cx-text)' }}>
                        Done — Go to Dashboard
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Re-analyse / change photo */}
                {photoResults.length > 0 && (
                  <button onClick={() => { setImage(null); setPhotoResults([]); setAddedItems(new Set()) }}
                    className="w-full rounded-xl py-2.5 text-sm transition" style={{ color: 'var(--cx-text3)' }}>
                    Try a different photo
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Manual mode ── */}
        {mode === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl p-6 space-y-4" style={cs.card}>
              {[
                { key: 'name', label: 'Food Name *', type: 'text', placeholder: 'e.g. Chicken breast' },
                { key: 'calories', label: 'Calories *', type: 'number', placeholder: '350' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium" style={cs.label}>{label}</label>
                  <input type={type} value={manual[key as keyof typeof manual]}
                    onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-4 py-3 outline-none transition"
                    style={cs.input} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fat (g)', 'fat']].map(([label, key]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-medium" style={cs.label}>{label}</label>
                    <input type="number" value={manual[key as keyof typeof manual]}
                      onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition"
                      style={cs.input} />
                  </div>
                ))}
              </div>
              <button onClick={handleManualAdd}
                className="w-full rounded-2xl py-3.5 font-semibold text-black transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                Add to {mealTabs.find(m => m.type === meal)?.label}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default function LogPage() {
  return <Suspense><LogContent /></Suspense>
}
