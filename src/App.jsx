import React, { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, ArrowRight, Info, X, Check } from 'lucide-react'

// =============================================================================
// PRICING CATALOG
// =============================================================================
// Edit prices here. Changes are reflected instantly across both modes.

const KITS = [
  { id: 'small', label: 'Small', sub: 'Compact first aid', price: 35 },
  { id: 'medium', label: 'Medium', sub: 'Standard first aid', price: 70 },
  { id: 'large', label: 'Large', sub: 'Standard first aid', price: 90 },
  { id: 'large-plus', label: 'Large Plus', sub: 'Premium first aid', price: 150 },
  { id: 'osha', label: 'OSHA Kit', sub: 'Compliance bundle', price: 56 },
  { id: 'aed', label: 'AED', sub: 'Defibrillator service', price: 25 },
]

const FIRST_AID_IDS = new Set(['small', 'medium', 'large', 'large-plus', 'osha'])

// NOTE: rates below are starting estimates of combined state + local sales tax.
// Verify against current rates for your service category and update as needed —
// this is the only source of truth in the app.
const TAX_REGIONS = {
  none:      { label: 'No local tax',      rate: 0 },
  ny_state:  { label: 'New York State',    rate: 0.08 },
  nyc:       { label: 'New York City',     rate: 0.08875 },
  la:        { label: 'Los Angeles',       rate: 0.075 },
  vegas:     { label: 'Las Vegas',         rate: 0.08375 },
  dallas:    { label: 'Dallas',            rate: 0.0825 },
  miami:     { label: 'Miami',             rate: 0.07 },
  nashville: { label: 'Nashville',         rate: 0.0925 },
  sv:        { label: 'Silicon Valley',    rate: 0.095 },
  chicago:   { label: 'Chicago',           rate: 0.1025 },
  boston:    { label: 'Boston',            rate: 0.0625 },
  dc:        { label: 'Washington DC',     rate: 0.06 },
}

// =============================================================================
// SUBMISSION HOOK — placeholder for Wix Sales Pipeline integration
// =============================================================================
// When ready to wire up Wix, replace the body of this function with a fetch()
// to your Wix endpoint. The `payload` shape is stable: { mode, contact, kits,
// locations, totals }. The `mode` field ('quick' | 'detailed') tells you which
// pipeline to route to.

async function submitToPipeline(payload) {
  // TODO: replace with real Wix call, e.g.:
  //   await fetch('https://your-wix-site.com/_functions/sales-pipeline', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload),
  //   })
  console.log('[pipeline submission]', payload)
  await new Promise((r) => setTimeout(r, 600))
  return { ok: true }
}

// =============================================================================
// HELPERS
// =============================================================================

const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const fmt0 = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const uid = () => Math.random().toString(36).slice(2, 9)

const useAnimatedNumber = (value, duration = 350) => {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    const start = display
    const delta = value - start
    if (delta === 0) return
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(start + delta * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return display
}

// =============================================================================
// SHARED UI
// =============================================================================

const Stepper = ({ value, onChange, min = 0, max = 99 }) => (
  <div className="inline-flex items-center gap-0">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      aria-label="Decrease"
    >
      <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const v = parseInt(e.target.value)
        onChange(isNaN(v) ? 0 : Math.max(min, Math.min(max, v)))
      }}
      className="w-12 h-9 text-center bg-transparent border-x border-neutral-200 text-sm tabular-nums font-medium focus:outline-none focus:border-neutral-900"
    />
    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      aria-label="Increase"
    >
      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
  </div>
)

const BigTotal = ({ value, label, sub }) => {
  const animated = useAnimatedNumber(value)
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[64px] leading-none font-medium tabular-nums tracking-tight text-neutral-900">
          {fmt0(Math.round(animated))}
        </span>
        <span className="text-base text-neutral-400 ml-1">/mo</span>
      </div>
      {sub && <div className="text-xs text-neutral-500 mt-2 tabular-nums">{sub}</div>}
    </div>
  )
}

// =============================================================================
// CONTACT MODAL — collects name/email/company before submitting to pipeline
// =============================================================================

const ContactModal = ({ open, onClose, mode, payloadPreview, onSubmit }) => {
  const [contact, setContact] = useState({ name: '', email: '', company: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (open) {
      setContact({ name: '', email: '', company: '', phone: '' })
      setSubmitting(false)
      setDone(false)
    }
  }, [open])

  if (!open) return null

  const valid = contact.name.trim() && contact.email.trim() && contact.company.trim()

  const handleSubmit = async () => {
    if (!valid) return
    setSubmitting(true)
    await onSubmit(contact)
    setSubmitting(false)
    setDone(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {mode === 'detailed' ? 'Request a quote' : 'Talk to sales'}
            </div>
            <div className="text-base font-medium mt-0.5">Tell us about you</div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-5 h-5 text-green-700" strokeWidth={2.5} />
            </div>
            <div className="text-lg font-medium mb-1">Thanks — we'll be in touch.</div>
            <div className="text-sm text-neutral-500 mb-6">
              Your configuration has been logged. A team member will reach out shortly.
            </div>
            <button
              onClick={onClose}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {[
              { key: 'name', label: 'Full name', type: 'text' },
              { key: 'email', label: 'Work email', type: 'email' },
              { key: 'company', label: 'Company', type: 'text' },
              { key: 'phone', label: 'Phone (optional)', type: 'tel' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={contact[f.key]}
                  onChange={(e) => setContact({ ...contact, [f.key]: e.target.value })}
                  className="w-full mt-1 py-2 bg-transparent border-b border-neutral-200 focus:outline-none focus:border-neutral-900 text-sm transition-colors"
                />
              </div>
            ))}

            <details className="text-xs text-neutral-500 mt-4">
              <summary className="cursor-pointer hover:text-neutral-900 transition-colors">
                Preview what we'll send
              </summary>
              <pre className="mt-2 p-3 bg-neutral-50 border border-neutral-200 rounded-sm overflow-x-auto text-[10px] leading-relaxed">
                {JSON.stringify(payloadPreview, null, 2)}
              </pre>
            </details>

            <button
              onClick={handleSubmit}
              disabled={!valid || submitting}
              className="w-full bg-neutral-900 text-white text-sm font-medium py-3 hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {submitting ? 'Sending…' : 'Send to sales team'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SIMPLE MODE
// =============================================================================

const SimpleMode = ({ onSwitchAdvanced, openContactModal }) => {
  const [counts, setCounts] = useState(Object.fromEntries(KITS.map((k) => [k.id, 0])))
  const monthly = KITS.reduce((s, k) => s + k.price * counts[k.id], 0)
  const annual = monthly * 12
  const totalKits = Object.values(counts).reduce((a, b) => a + b, 0)

  const buildPayload = () => ({
    mode: 'quick',
    kits: KITS.map((k) => ({ id: k.id, label: k.label, qty: counts[k.id] })).filter(
      (k) => k.qty > 0
    ),
    totals: { monthly, annual },
    submitted_at: new Date().toISOString(),
  })

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-12 lg:gap-16">
      <div>
        <h2 className="text-2xl font-medium tracking-tight text-neutral-900 mb-1">
          What do you need?
        </h2>
        <p className="text-sm text-neutral-500 mb-8">
          Tally up the kits across your whole business — we'll do the math.
        </p>

        <div className="border-t border-neutral-200">
          {KITS.map((kit) => (
            <div
              key={kit.id}
              className="flex items-center justify-between py-5 border-b border-neutral-200 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="text-base font-medium text-neutral-900">{kit.label}</span>
                  <span className="text-sm text-neutral-400 tabular-nums">
                    {fmt0(kit.price)}/mo each
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">{kit.sub}</div>
              </div>
              <Stepper
                value={counts[kit.id]}
                onChange={(v) => setCounts((c) => ({ ...c, [kit.id]: v }))}
              />
            </div>
          ))}
        </div>

        <button
          onClick={onSwitchAdvanced}
          className="mt-8 text-sm text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5 group"
        >
          Need per-location pricing with tax?
          <span className="text-neutral-900 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
            Switch to detailed <ArrowRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="bg-neutral-50 border border-neutral-200 p-8">
          <BigTotal
            value={monthly}
            label="Estimated Monthly"
            sub={
              totalKits === 0
                ? 'Add kits to see your estimate'
                : `${totalKits} ${totalKits === 1 ? 'kit' : 'kits'} · ${fmt0(annual)}/yr`
            }
          />

          <div className="h-px bg-neutral-200 my-6" />

          <div className="flex items-start gap-2.5 text-xs text-neutral-500 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
            <span>
              Rough estimate. Excludes sales tax and any one-time setup. For precise
              pricing per location, use the detailed view.
            </span>
          </div>

          <button
            onClick={() => openContactModal('quick', buildPayload())}
            disabled={totalKits === 0}
            className="w-full mt-6 bg-neutral-900 text-white text-sm font-medium py-3 hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            Talk to sales
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// ADVANCED MODE
// =============================================================================

const newLocation = (i = 1) => ({
  id: uid(),
  name: `Location ${i}`,
  taxRegion: 'none',
  counts: Object.fromEntries(KITS.map((k) => [k.id, 0])),
})

const locFirstAid = (loc) =>
  KITS.filter((k) => FIRST_AID_IDS.has(k.id)).reduce(
    (s, k) => s + k.price * loc.counts[k.id],
    0
  )
const locAed = (loc) =>
  KITS.filter((k) => !FIRST_AID_IDS.has(k.id)).reduce(
    (s, k) => s + k.price * loc.counts[k.id],
    0
  )
const locSubtotal = (loc) => locFirstAid(loc) + locAed(loc)
const locTax = (loc) => locFirstAid(loc) * (TAX_REGIONS[loc.taxRegion]?.rate || 0)

const AdvancedMode = ({ onSwitchSimple, openContactModal }) => {
  const [locations, setLocations] = useState([newLocation(1)])

  const update = (id, patch) =>
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const updateCount = (id, kitId, value) =>
    setLocations((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, counts: { ...l.counts, [kitId]: value } } : l
      )
    )
  const remove = (id) => setLocations((prev) => prev.filter((l) => l.id !== id))
  const add = () => setLocations((prev) => [...prev, newLocation(prev.length + 1)])

  const subtotal = locations.reduce((s, l) => s + locSubtotal(l), 0)
  const tax = locations.reduce((s, l) => s + locTax(l), 0)
  const total = subtotal + tax

  const buildPayload = () => ({
    mode: 'detailed',
    locations: locations.map((l) => ({
      name: l.name,
      tax_region: l.taxRegion,
      kits: KITS.map((k) => ({ id: k.id, label: k.label, qty: l.counts[k.id] })).filter(
        (k) => k.qty > 0
      ),
      monthly: locSubtotal(l) + locTax(l),
    })),
    totals: { subtotal, tax, monthly: total, annual: total * 12 },
    submitted_at: new Date().toISOString(),
  })

  const hasAnyKits = locations.some((l) =>
    Object.values(l.counts).some((v) => v > 0)
  )

  return (
    <div>
      <div className="flex items-end justify-between mb-8 gap-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-neutral-900 mb-1">
            Configure each location
          </h2>
          <p className="text-sm text-neutral-500">
            Add as many locations as you need. Tax applies in select regions.
          </p>
        </div>
        <button
          onClick={onSwitchSimple}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Back to quick estimate
        </button>
      </div>

      {/* Desktop matrix */}
      <div className="hidden md:block border border-neutral-200">
        <div
          className="grid items-center px-5 py-3 bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase tracking-[0.15em] text-neutral-500 gap-2"
          style={{ gridTemplateColumns: '2fr repeat(6, 1fr) 1.4fr 1fr 32px' }}
        >
          <div>Location</div>
          {KITS.map((k) => (
            <div key={k.id} className="text-center">
              {k.label}
            </div>
          ))}
          <div>Tax region</div>
          <div className="text-right">Monthly</div>
          <div />
        </div>

        {locations.map((loc) => (
          <div
            key={loc.id}
            className="grid items-center px-5 py-3 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50 transition-colors gap-2"
            style={{ gridTemplateColumns: '2fr repeat(6, 1fr) 1.4fr 1fr 32px' }}
          >
            <input
              value={loc.name}
              onChange={(e) => update(loc.id, { name: e.target.value })}
              className="bg-transparent text-sm font-medium text-neutral-900 focus:outline-none w-full"
            />
            {KITS.map((k) => (
              <div key={k.id} className="flex justify-center">
                <input
                  type="number"
                  value={loc.counts[k.id]}
                  onChange={(e) =>
                    updateCount(loc.id, k.id, Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-12 h-8 text-center bg-transparent border border-neutral-200 text-sm tabular-nums focus:outline-none focus:border-neutral-900 rounded-sm"
                />
              </div>
            ))}
            <select
              value={loc.taxRegion}
              onChange={(e) => update(loc.id, { taxRegion: e.target.value })}
              className="text-xs bg-transparent text-neutral-600 focus:outline-none cursor-pointer hover:text-neutral-900 transition-colors"
            >
              {Object.entries(TAX_REGIONS).map(([id, r]) => (
                <option key={id} value={id}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="text-right text-sm tabular-nums font-medium text-neutral-900">
              {fmt(locSubtotal(loc) + locTax(loc))}
            </div>
            <button
              onClick={() => remove(loc.id)}
              disabled={locations.length === 1}
              className="text-neutral-300 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors justify-self-end"
              aria-label="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {locations.map((loc) => (
          <div key={loc.id} className="border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <input
                value={loc.name}
                onChange={(e) => update(loc.id, { name: e.target.value })}
                className="bg-transparent text-base font-medium text-neutral-900 focus:outline-none flex-1"
              />
              <button
                onClick={() => remove(loc.id)}
                disabled={locations.length === 1}
                className="text-neutral-300 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {KITS.map((k) => (
                <div key={k.id} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{k.label}</span>
                  <Stepper
                    value={loc.counts[k.id]}
                    onChange={(v) => updateCount(loc.id, k.id, v)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
              <select
                value={loc.taxRegion}
                onChange={(e) => update(loc.id, { taxRegion: e.target.value })}
                className="text-xs text-neutral-600 bg-transparent focus:outline-none"
              >
                {Object.entries(TAX_REGIONS).map(([id, r]) => (
                  <option key={id} value={id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="text-base tabular-nums font-medium">
                {fmt(locSubtotal(loc) + locTax(loc))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="mt-3 w-full py-4 border border-dashed border-neutral-300 hover:border-neutral-900 hover:text-neutral-900 text-neutral-500 transition-colors text-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add location
      </button>

      <div className="mt-10 border-t border-neutral-900 pt-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1">
              Monthly subtotal
            </div>
            <div className="text-2xl tabular-nums font-medium">{fmt(subtotal)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1">
              Tax
            </div>
            <div className="text-2xl tabular-nums font-medium text-neutral-500">
              {fmt(tax)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1">
              Monthly total
            </div>
            <div className="text-2xl tabular-nums font-medium">{fmt(total)}</div>
            <div className="text-xs text-neutral-500 tabular-nums mt-1">
              {fmt(total * 12)}/yr
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => openContactModal('detailed', buildPayload())}
          disabled={!hasAnyKits}
          className="bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          Request a formal quote
        </button>
        <span className="text-xs text-neutral-500">
          We'll confirm pricing and prep paperwork.
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// ROOT
// =============================================================================

export default function App() {
  const [mode, setMode] = useState('simple')
  const [modalState, setModalState] = useState({ open: false, mode: null, payload: null })

  const openContactModal = (submissionMode, payload) =>
    setModalState({ open: true, mode: submissionMode, payload })

  const handleSubmit = async (contact) => {
    await submitToPipeline({ ...modalState.payload, contact })
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-12">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
          Initiate Care · Pricing
        </div>

        <header className="mb-10 lg:mb-14 max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-medium tracking-[-0.02em] leading-[1.05] text-neutral-900">
            Build your subscription.
            <br />
            <span className="text-neutral-400">See the price.</span>
          </h1>
          <p className="mt-5 text-base text-neutral-600 max-w-xl leading-relaxed">
            Transparent, real pricing for first aid and AED service — configured to
            your business.
          </p>
        </header>

        <div className="mb-10 lg:mb-14">
          <div className="inline-flex p-1 bg-neutral-100 rounded-full">
            <button
              onClick={() => setMode('simple')}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${
                mode === 'simple'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Quick estimate
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${
                mode === 'advanced'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Detailed quote
            </button>
          </div>
        </div>

        {mode === 'simple' ? (
          <SimpleMode
            onSwitchAdvanced={() => setMode('advanced')}
            openContactModal={openContactModal}
          />
        ) : (
          <AdvancedMode
            onSwitchSimple={() => setMode('simple')}
            openContactModal={openContactModal}
          />
        )}

        <footer className="mt-24 pt-8 border-t border-neutral-200 text-xs text-neutral-500 max-w-2xl leading-relaxed">
          Prices shown reflect standard subscription rates. Sales tax on first aid
          service applies in select regions (New York, Los Angeles, Chicago, Boston,
          Dallas, Miami, Las Vegas, Nashville, Silicon Valley, and Washington DC) —
          select your region in the detailed quote. One-time fees, contract terms,
          and special program discounts are confirmed during quote review.
        </footer>
      </div>

      <ContactModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, mode: null, payload: null })}
        mode={modalState.mode}
        payloadPreview={modalState.payload}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
