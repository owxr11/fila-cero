import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { fork } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const targetScript = resolve(__dirname, '../apps/api/scripts/seed-demo-history.js')

const child = fork(targetScript, process.argv.slice(2), {
    stdio: 'inherit',
    cwd: resolve(__dirname, '../apps/api')
})

child.on('exit', (code) => {
    process.exit(code ?? 0)
})
