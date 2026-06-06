import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import './index.css'
import App from './App.tsx'

// ─── Environment ──────────────────────────────────────────────────────────────
const TATUM_RPC = 'https://fullnode.testnet.sui.io:443'
const TATUM_KEY = import.meta.env.VITE_TATUM_KEY as string

// ─── Inject Tatum API key into all fetch calls targeting Tatum gateway ────────
const _origFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.href
      : (input as Request).url
  if (TATUM_KEY && (url.includes('tatum.io') || url.includes('gateway.tatum'))) {
    const headers = new Headers(init?.headers)
    headers.set('x-api-key', TATUM_KEY)
    return _origFetch(input, { ...init, headers })
  }
  return _origFetch(input, init)
}

// ─── Sui Network Config ───────────────────────────────────────────────────────
const { networkConfig } = createNetworkConfig({
  testnet: { url: TATUM_RPC, network: 'testnet' },
})

// ─── React Query ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  30_000,
      gcTime:     5 * 60 * 1000,
      retry:      2,
      retryDelay: 1000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider autoConnect>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>,
)
