#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const appDir = __dirname
const args = process.argv.slice(2)

// Handle --version / -v
if (args.includes('--version') || args.includes('-v')) {
  const pkg = require(path.join(appDir, 'package.json'))
  console.log(`${pkg.version} (claude-cat)`)
  process.exit(0)
}

// Handle --help / -h
if (args.includes('--help') || args.includes('-h')) {
  console.log(`claude-cat v${require(path.join(appDir, 'package.json')).version}`)
  console.log('')
  console.log('Desktop pet companion for Claude Code')
  console.log('')
  console.log('Usage: claude-cat [options]')
  console.log('')
  console.log('Options:')
  console.log('  -v, --version    Show version')
  console.log('  -h, --help       Show this help')
  console.log('  -d, --detach     Run in background (detach from terminal)')
  process.exit(0)
}

// Find electron binary
let electronPath
try {
  electronPath = require('electron')
  // require('electron') returns the path to the binary when used from Node
  if (typeof electronPath !== 'string') {
    electronPath = require.resolve('electron/dist/Electron.app/Contents/MacOS/Electron')
  }
} catch {
  // Fallback: resolve relative to this package
  const candidates = [
    path.join(appDir, 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron'),
    path.join(appDir, 'node_modules', '.bin', 'electron'),
  ]
  electronPath = candidates.find(p => {
    try { require('fs').accessSync(p, require('fs').constants.X_OK); return true } catch { return false }
  })
}

if (!electronPath) {
  console.error('Error: Could not find Electron binary.')
  console.error('Run: cd ' + appDir + ' && npm install')
  process.exit(1)
}

const detach = args.includes('--detach') || args.includes('-d')

const child = spawn(electronPath, [appDir], {
  stdio: detach ? 'ignore' : 'inherit',
  detached: detach,
  env: { ...process.env, ELECTRON_NO_ATTACH_CONSOLE: '1' },
})

if (detach) {
  child.unref()
  console.log('claude-cat started in background (pid: ' + child.pid + ')')
  process.exit(0)
} else {
  child.on('exit', (code) => process.exit(code ?? 0))
}
