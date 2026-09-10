import React, { useEffect, useMemo, useState } from 'react'
import { CAMERAS, SYSTEMS, DIMENSIONS, PICKS, META } from './data/cameras.js'

const BASE = import.meta.env.BASE_URL

const systemById = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]))

const fmtUsd = (n) => (n == null ? '—' : `$${n.toLocaleString('en-US')}`)
const fmtDots = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}
const fmtDate = (ym) => {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  if (!m) return y
  return new Date(Date.UTC(+y, +m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

// ---- URL state -------------------------------------------------------------
const readUrl = () => {
  const p = new URLSearchParams(window.location.search)
  return {
    view: p.get('view') === 'table' ? 'table' : 'timeline',
    systems: (p.get('system') || '').split(',').filter((id) => systemById[id]),
    sort: p.get('sort') || 'shipped',
    dir: p.get('dir') === 'desc' ? 'desc' : 'asc',
  }
}
const writeUrl = (s) => {
  const p = new URLSearchParams()
  if (s.view !== 'timeline') p.set('view', s.view)
  if (s.systems.length) p.set('system', s.systems.join(','))
  if (s.sort !== 'shipped') p.set('sort', s.sort)
  if (s.dir !== 'asc') p.set('dir', s.dir)
  const qs = p.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

const DEFAULT_STATE = { view: 'timeline', systems: [], sort: 'shipped', dir: 'asc' }

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(readUrl())
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (hydrated) writeUrl(state)
  }, [state, hydrated])

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

  const visible = useMemo(
    () => CAMERAS.filter((c) => state.systems.length === 0 || state.systems.includes(c.system)),
    [state.systems],
  )

  return (
    <main>
      <Header />
      <MountGuide />
      <Glossary />
      <Controls state={state} update={update} count={visible.length} />
      {state.view === 'timeline' ? (
        <Timeline cameras={visible} />
      ) : (
        <Table cameras={visible} sort={state.sort} dir={state.dir} onSort={(sort, dir) => update({ sort, dir })} />
      )}
      <Picks />
      <Sources />
    </main>
  )
}

// ---- Header ----------------------------------------------------------------
function Header() {
  return (
    <header className="hero">
      <h1 className="m-head">
        <span className="m-eyebrow">Camera buying guide</span>
        <span className="m-title">High-resolution mirrorless cameras for every kind of shooting</span>
      </h1>
      <p className="lede">
        Hamp wants a camera that can do it all: macro, nature, wildlife, and street. He crops hard and wants at least 40 MP.
        This guide compares the cameras he's considering — plus alternatives worth knowing about — on the dimensions that
        decide the purchase: sensor resolution, autofocus, EVF, burst speed, video, weather sealing, size, and price.
      </p>
      <p className="lede small">
        Specs researched {fmtDate(META.asOf)}. Not affiliated with any manufacturer or retailer.
      </p>
    </header>
  )
}

// ---- Mount guide -----------------------------------------------------------
function MountGuide() {
  return (
    <section className="card decoder">
      <h2>Understanding the mount systems</h2>
      <div className="decoder-grid">
        <div>
          <h3>Systems in this guide</h3>
          <ul className="plain">
            {SYSTEMS.map((s) => (
              <li key={s.id}>
                <span className="dot" style={{ background: s.color }} />
                <strong>{s.name}</strong> — {s.blurb}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Why mount matters</h3>
          <ul className="plain">
            <li><strong>Lens investment</strong> — the mount determines which lenses you can use natively. Adapters add cost, size, and sometimes lose autofocus.</li>
            <li><strong>L-mount alliance</strong> — Leica, Panasonic, and Sigma share the L-mount, so one lens system covers two of the cameras here.</li>
            <li><strong>Adapter flexibility</strong> — shorter flange distances (Sony E, L-mount) can adapt more legacy mounts than longer ones.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

// ---- Dimension glossary ----------------------------------------------------
function Glossary() {
  const [open, setOpen] = useState(false)
  return (
    <section className="card glossary">
      <button className="disclosure" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h2>What the dimensions mean and why they matter</h2>
        <span className="chev">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <dl className="dims">
          {DIMENSIONS.map((d) => (
            <div key={d.id}>
              <dt>{d.label}</dt>
              <dd>{d.why}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

// ---- Controls --------------------------------------------------------------
function Controls({ state, update, count }) {
  const toggleSystem = (id) =>
    update({
      systems: state.systems.includes(id) ? state.systems.filter((s) => s !== id) : [...state.systems, id],
    })
  return (
    <div className="controls">
      <div className="seg" role="tablist" aria-label="View">
        <button role="tab" aria-selected={state.view === 'timeline'} className={state.view === 'timeline' ? 'on' : ''} onClick={() => update({ view: 'timeline' })}>
          Timeline
        </button>
        <button role="tab" aria-selected={state.view === 'table'} className={state.view === 'table' ? 'on' : ''} onClick={() => update({ view: 'table' })}>
          Table
        </button>
      </div>
      <div className="chips" aria-label="Filter by mount system">
        {SYSTEMS.map((s) => {
          const on = state.systems.length === 0 || state.systems.includes(s.id)
          return (
            <button key={s.id} className={`chip ${on ? 'on' : ''}`} onClick={() => toggleSystem(s.id)} style={{ '--chip': s.color }}>
              <span className="dot" />
              {s.short}
            </button>
          )
        })}
        {state.systems.length > 0 && (
          <button className="chip clear" onClick={() => update({ systems: [] })}>
            all
          </button>
        )}
      </div>
      <div className="toggles">
        <span className="count muted">{count} bodies</span>
      </div>
    </div>
  )
}

// ---- Shared pieces ---------------------------------------------------------
function Chip({ label, value, tone }) {
  return (
    <span className={`spec ${tone || ''}`}>
      <span className="spec-k">{label}</span>
      <span className="spec-v">{value}</span>
    </span>
  )
}

const sealingLabel = { none: 'None', splash: 'Splash resistant', ip: 'IP-rated' }
const sealingTone = { none: 'warn', splash: 'ok', ip: 'good' }

function CameraImage({ camera }) {
  const img = camera.image
  if (!img) {
    return (
      <div className="img-missing">
        <span>No freely licensed photo yet.</span>
        {camera.referenceUrl && (
          <a href={camera.referenceUrl} target="_blank" rel="noreferrer">Manufacturer page</a>
        )}
      </div>
    )
  }
  return (
    <figure className="camimg lg">
      <img src={`${BASE}${img.src}`} alt={img.alt} loading="lazy" />
      <figcaption>
        <a href={img.pageUrl} target="_blank" rel="noreferrer">{img.credit}</a>, {img.license}
      </figcaption>
    </figure>
  )
}

// ---- Timeline --------------------------------------------------------------
function Timeline({ cameras }) {
  const seen = new Set()
  return (
    <section className="timeline" aria-label="Camera comparison">
      {cameras.map((c) => {
        const sys = systemById[c.system]
        const showSystem = !seen.has(sys.id)
        seen.add(sys.id)
        return (
          <React.Fragment key={c.id}>
            {showSystem && (
              <div className="tl-family" style={{ '--fam': sys.color }}>
                <span className="tl-family-dot" />
                <h2 id={`sys-${sys.id}`}>{sys.name}</h2>
              </div>
            )}
            <TimelineEntry camera={c} sys={sys} />
          </React.Fragment>
        )
      })}
    </section>
  )
}

function TimelineEntry({ camera: c, sys }) {
  return (
    <article className="tl-entry" id={c.id} style={{ '--fam': sys.color }}>
      <div className="tl-rail">
        <span className="tl-dot" />
        <span className="tl-date">{fmtDate(c.shipped)}</span>
        <span className="tl-fam">{sys.short}</span>
      </div>
      <div className="card tl-card">
        <div className="tl-top">
          <CameraImage camera={c} />
          <div className="tl-head">
            <h3>{c.maker} {c.name}</h3>
            <p className="role">{c.role}</p>
            <p className="summary">{c.summary}</p>
            <div className="specs">
              <Chip label="Sensor" value={`${c.sensor.mp} MP ${c.sensor.type}`} />
              <Chip label="IBIS" value={c.sensor.ibis ? `${c.sensor.ibisStops}-stop` : 'None'} tone={c.sensor.ibis ? 'good' : 'warn'} />
              <Chip label="Usable ISO" value={`${c.iso.usable.toLocaleString()} clean / ${c.iso.ceiling.toLocaleString()} max`} />
              <Chip label="AF" value={c.af.short} />
              <Chip label="EVF" value={`${fmtDots(c.evf.resolution)} ${c.evf.refreshRate}Hz`} />
              <Chip label="Burst" value={`${c.burst.mechanical || '—'}/${c.burst.electronic} fps`} />
              <Chip label="Video" value={c.video.short} />
              <Chip label="Screen" value={c.screen.short} />
              <Chip label="Sealing" value={c.sealing.rating || sealingLabel[c.sealing.level]} tone={sealingTone[c.sealing.level]} />
              <Chip label="Size" value={`${c.body.weight} g`} />
              <Chip label="Mount" value={c.mount.name} />
            </div>
          </div>
        </div>
        <div className="tl-body">
          <div>
            <h4>For Hamp's shooting</h4>
            <UseCases camera={c} />
          </div>
          <div>
            <h4>Price</h4>
            {c.prices.newPrice && <p className="price"><span className="price-typ">{fmtUsd(c.prices.newPrice)}</span><span className="muted"> new</span></p>}
            {c.prices.usedTypical != null && (
              <p className="price muted small">Used: {fmtUsd(c.prices.usedLow)}–{fmtUsd(c.prices.usedHigh)}</p>
            )}
            {c.prices.note && <p className="muted small">{c.prices.note}</p>}
          </div>
        </div>
        <div className="tl-notes">
          <Note label="Sensor">{c.sensor.note}</Note>
          <Note label="ISO">{c.iso.note}</Note>
          <Note label="Autofocus">{c.af.note}</Note>
          <Note label="EVF">{c.evf.note}</Note>
          <Note label="Burst">{c.burst.note}</Note>
          <Note label="Video">{c.video.note}</Note>
          <Note label="Screen">{c.screen.note}</Note>
          <Note label="Sealing">{c.sealing.note}</Note>
          <Note label="Storage">{c.storage.note}</Note>
          <Note label="Battery">{c.battery.note}</Note>
          <Note label="Mount">{c.mount.note}</Note>
        </div>
        <p className="verdict"><strong>Verdict.</strong> {c.verdict}</p>
      </div>
    </article>
  )
}

function UseCases({ camera: c }) {
  const cases = [
    { key: 'macro', label: 'Macro' },
    { key: 'wildlife', label: 'Wildlife' },
    { key: 'street', label: 'Street' },
    { key: 'nature', label: 'Nature / landscape' },
  ]
  return (
    <div className="use-cases">
      {cases.map(({ key, label }) => (
        <span key={key} className={`use-badge ${c.useCases[key]}`}>{label}</span>
      ))}
    </div>
  )
}

function Note({ label, children }) {
  if (!children) return null
  return (
    <p className="note">
      <span className="note-k">{label}</span> {children}
    </p>
  )
}

// ---- Table -----------------------------------------------------------------
const COLUMNS = [
  { id: 'name', label: 'Model', get: (c) => c.name, render: (c) => <ModelCell camera={c} /> },
  { id: 'shipped', label: 'Shipped', get: (c) => c.shipped, render: (c) => fmtDate(c.shipped) },
  { id: 'sensor', label: 'Sensor', get: (c) => c.sensor.mp, render: (c) => `${c.sensor.mp} MP ${c.sensor.type}` },
  { id: 'ibis', label: 'IBIS', get: (c) => c.sensor.ibisStops || 0, render: (c) => c.sensor.ibis ? `${c.sensor.ibisStops}-stop` : '—' },
  { id: 'iso', label: 'Usable ISO', get: (c) => c.iso.usable, render: (c) => `${c.iso.usable.toLocaleString()} / ${c.iso.ceiling.toLocaleString()}`, title: 'clean / max usable' },
  { id: 'af', label: 'AF system', get: (c) => c.af.short, render: (c) => c.af.short },
  { id: 'evf', label: 'EVF', get: (c) => c.evf.resolution, render: (c) => `${fmtDots(c.evf.resolution)} ${c.evf.refreshRate}Hz` },
  { id: 'burst', label: 'Burst', get: (c) => c.burst.electronic, render: (c) => `${c.burst.mechanical || '—'}/${c.burst.electronic} fps`, title: 'Mechanical / electronic fps' },
  { id: 'video', label: 'Video', get: (c) => c.video.short, render: (c) => c.video.short },
  { id: 'screen', label: 'Screen', get: (c) => c.screen.size, render: (c) => c.screen.short },
  { id: 'sealing', label: 'Sealing', get: (c) => ({ none: 0, splash: 1, ip: 2 })[c.sealing.level], render: (c) => c.sealing.rating || sealingLabel[c.sealing.level] },
  { id: 'weight', label: 'Weight', get: (c) => c.body.weight, render: (c) => `${c.body.weight} g`, title: 'Body with battery and card' },
  { id: 'price', label: 'New price', get: (c) => c.prices.newPrice ?? Infinity, render: (c) => <PriceCell camera={c} />, title: 'Current MSRP' },
]

function PriceCell({ camera: c }) {
  return (
    <span className="pricecell">
      <strong>{fmtUsd(c.prices.newPrice)}</strong>
      {c.prices.usedTypical != null && <span className="muted small">~{fmtUsd(c.prices.usedTypical)} used</span>}
    </span>
  )
}

function ModelCell({ camera: c }) {
  const sys = systemById[c.system]
  return (
    <span className="model-cell">
      <span className="dot" style={{ background: sys.color }} />
      <a href={`#${c.id}`} onClick={(e) => e.stopPropagation()}>{c.maker} {c.name}</a>
      {c.sensor.size !== '36×24 mm' && <span className="tag">MF</span>}
    </span>
  )
}

function Table({ cameras, sort, dir, onSort }) {
  const col = COLUMNS.find((c) => c.id === sort) || COLUMNS[1]
  const rows = useMemo(() => {
    const arr = [...cameras]
    arr.sort((a, b) => {
      const x = col.get(a)
      const y = col.get(b)
      if (x === Infinity || y === Infinity) return x === y ? 0 : x === Infinity ? 1 : -1
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return dir === 'asc' ? r : -r
    })
    return arr
  }, [cameras, col, dir])
  const click = (id) => onSort(id, sort === id && dir === 'asc' ? 'desc' : 'asc')
  return (
    <section className="card table-wrap" aria-label="Comparison table">
      <div className="scroll">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.id} title={c.title} aria-sort={sort === c.id ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button onClick={() => click(c.id)}>
                    {c.label}
                    {sort === c.id && <span className="sort">{dir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                {COLUMNS.map((col) => (
                  <td key={col.id}>{col.render(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Usable ISO is a reviewer consensus for "clean" and "still usable with noise reduction", not the max setting.
        Burst shows mechanical / electronic fps. IBIS is in-body image stabilization, rated in stops of correction.
        Click a model name to jump to its timeline entry.
      </p>
    </section>
  )
}

// ---- Picks -----------------------------------------------------------------
function Picks() {
  return (
    <section className="card picks">
      <h2>If you want…</h2>
      <ul className="picks-list">
        {PICKS.map((p) => (
          <li key={p.want}>
            <strong>{p.want}</strong> →{' '}
            {p.picks.map((id, i) => {
              const c = CAMERAS.find((x) => x.id === id)
              return (
                <React.Fragment key={id}>
                  {i > 0 && ', '}
                  <a href={`#${id}`}>{c.maker} {c.name}</a>
                </React.Fragment>
              )
            })}
            <span className="muted"> — {p.why}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---- Sources ---------------------------------------------------------------
function Sources() {
  return (
    <section className="card sources">
      <h2>Method and sources</h2>
      <p>{META.method}</p>
      <ul>
        {META.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
            {s.note && <span className="muted"> — {s.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
