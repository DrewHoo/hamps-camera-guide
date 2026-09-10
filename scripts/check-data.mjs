import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAMERAS, SYSTEMS, PICKS } from '../src/data/cameras.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const systemIds = new Set(SYSTEMS.map((s) => s.id))
const ids = new Set()

const required = {
  '': ['id', 'name', 'maker', 'system', 'shipped', 'summary', 'role', 'verdict'],
  sensor: ['type', 'mp', 'ibis'],
  iso: ['base', 'max', 'usable', 'ceiling'],
  af: ['type', 'short'],
  evf: ['resolution', 'magnification', 'refreshRate'],
  burst: ['electronic'],
  video: ['short'],
  screen: ['size', 'short'],
  sealing: ['level'],
  body: ['w', 'h', 'd', 'weight'],
  storage: ['short'],
  battery: ['model'],
  mount: ['name'],
  prices: ['newPrice'],
}

for (const c of CAMERAS) {
  const where = c.id || c.name || '(unnamed)'
  if (ids.has(c.id)) errors.push(`${where}: duplicate id`)
  ids.add(c.id)
  if (!systemIds.has(c.system)) errors.push(`${where}: unknown system ${c.system}`)
  for (const [group, keys] of Object.entries(required)) {
    const obj = group ? c[group] : c
    if (!obj) { errors.push(`${where}: missing ${group}`); continue }
    for (const k of keys) if (obj[k] === undefined) errors.push(`${where}: missing ${group ? `${group}.` : ''}${k}`)
  }
  if (!['none', 'splash', 'ip'].includes(c.sealing?.level)) errors.push(`${where}: bad sealing level`)
  if (c.image && !fs.existsSync(path.join(ROOT, 'public', c.image.src))) errors.push(`${where}: image ${c.image.src} not in public/`)
  if (c.image && !(c.image.credit && c.image.license && c.image.pageUrl)) errors.push(`${where}: image missing attribution`)
}
const sorted = [...CAMERAS].every((c, i, a) => i === 0 || a[i - 1].shipped <= c.shipped)
if (!sorted) errors.push('CAMERAS is not in shipped order')
for (const p of PICKS) for (const id of p.picks) if (!ids.has(id)) errors.push(`pick "${p.want}" references unknown id ${id}`)

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`ok: ${CAMERAS.length} cameras, ${PICKS.length} picks`)
