import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from  './routes/Home'

// Create a client for React Query
const queryClient = new QueryClient()

function App() {

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            
            <Route
              path="/"
              element={<Home/>}
            />
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
