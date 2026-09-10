import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://drewhoover.com/hamps-camera-guide/'
const OUT = path.join(ROOT, 'dist/index.html')

const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
})
const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
const { CAMERAS } = await vite.ssrLoadModule('/src/data/cameras.js')
const appHtml = renderToString(React.createElement(App))
await vite.close()

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': SITE,
      url: SITE,
      name: 'High-resolution mirrorless camera guide for Hamp',
      description: 'Leica SL3, Sony A7R V, Panasonic S1R II, Nikon Z8, and Fujifilm GFX 100S II compared for macro, wildlife, nature and street photography.',
      mainEntity: { '@id': `${SITE}#cameras` },
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE}#cameras`,
      name: 'High-resolution mirrorless cameras compared',
      numberOfItems: CAMERAS.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: CAMERAS.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: `${c.maker} ${c.name}`,
          brand: { '@type': 'Brand', name: c.maker },
          releaseDate: c.shipped,
          description: c.summary,
        },
      })),
    },
  ],
}

let html = fs.readFileSync(OUT, 'utf8')
if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: could not find an empty #root in dist/index.html')
}
html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
html = html.replace(
  '</head>',
  `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`,
)
fs.writeFileSync(OUT, html)

const words = appHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
console.log(`prerendered ${(appHtml.length / 1024).toFixed(0)}KB (~${words} words), ${CAMERAS.length} cameras in JSON-LD`)
