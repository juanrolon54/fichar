# Fichar

For more information please refer to its [website](https://fich.ar)

## Development

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## DB work

```bash
npx drizzle-kit generate
```

```bash
wrangler d1 migrations apply "<DB_NAME>"
```

```bash
wrangler d1 migrations apply "<DB_NAME>" --remote
```
