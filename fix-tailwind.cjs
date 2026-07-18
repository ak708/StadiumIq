const fs = require('fs')
const path = require('path')
function walk(dir) {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) walk(full)
    else if (full.endsWith('.jsx') || full.endsWith('.js') || full.endsWith('.css')) {
      let c = fs.readFileSync(full, 'utf8')
      let oc = c
      // Replace non-standard tailwind opacities
      c = c.replace(/white\/4(?!\d)/g, 'white/5')
      c = c.replace(/white\/8(?!\d)/g, 'white/10')
      c = c.replace(/white\/12(?!\d)/g, 'white/10')
      c = c.replace(/white\/15(?!\d)/g, 'white/20')
      if (c !== oc) {
        fs.writeFileSync(full, c)
        console.log('Fixed', full)
      }
    }
  }
}
walk('./src')
