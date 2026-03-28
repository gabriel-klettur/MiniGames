// @ts-nocheck
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs/promises'

// https://vite.dev/config/
function publishBooksPlugin(): Plugin {
  return {
    name: 'publish-books-dev-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const r: any = req as any;
          if (r.method !== 'POST') return next();
          if (!r.url) return next();
          // Handle clear-books
          if (r.url.startsWith('/__dev/clear-books')) {
            const root = server.config.root || process.cwd();
            const booksDir = path.resolve(root, 'public', 'books');
            async function countFiles(dir: string): Promise<number> {
              try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                let total = 0;
                for (const e of entries) {
                  const p = path.resolve(dir, e.name);
                  if (e.isDirectory()) total += await countFiles(p);
                  else total += 1;
                }
                return total;
              } catch {
                return 0;
              }
            }
            const removed = await countFiles(booksDir);
            try {
              await fs.rm(booksDir, { recursive: true, force: true });
            } catch {}
            await fs.mkdir(booksDir, { recursive: true });
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, removed }));
            return;
          }
          if (!r.url.startsWith('/__dev/publish-books')) return next();
          // Accumulate JSON body
          const chunks: any[] = []
          await new Promise<void>((resolve, reject) => {
            r.on('data', (c: any) => chunks.push((globalThis as any).Buffer?.isBuffer?.(c) ? c : (globalThis as any).Buffer?.from?.(c)))
            r.on('end', () => resolve())
            r.on('error', (e: any) => reject(e))
          })
          const raw = ((globalThis as any).Buffer?.concat?.(chunks) || '').toString?.('utf-8') || '{}'
          let payload: any
          try { payload = JSON.parse(raw) } catch { payload = {} }
          const files: Array<{ relativePath: string; content: string }> = Array.isArray(payload?.files) ? payload.files : []
          // Only allow writing under public/books
          const root = server.config.root || process.cwd()
          const booksDir = path.resolve(root, 'public', 'books')
          const wrote: Array<{ path: string; bytes: number }> = []
          for (const f of files) {
            if (!f || typeof f.relativePath !== 'string') continue
            const safeRel = f.relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
            if (!safeRel || safeRel.includes('..')) continue
            const abs = path.resolve(booksDir, safeRel)
            if (!abs.startsWith(booksDir)) continue
            const dir = path.dirname(abs)
            await fs.mkdir(dir, { recursive: true })
            const data = typeof f.content === 'string' ? f.content : String(f.content ?? '')
            await fs.writeFile(abs, data, 'utf-8')
            const b = (globalThis as any).Buffer;
            const bytes = b && typeof b.byteLength === 'function' ? b.byteLength(data) : (new TextEncoder().encode(data)).byteLength;
            wrote.push({ path: abs, bytes })
          }
          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true, wrote }))
          return
        } catch (err) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: (err as Error).message }))
          return
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), publishBooksPlugin()],
})
