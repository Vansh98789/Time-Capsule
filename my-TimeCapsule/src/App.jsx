import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from  './routes/Home'
import CreateCapsule from './routes/CreateCapsule'
import Unlock from './routes/UnlockCapsule'

const queryClient = new QueryClient()

function App() {

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/"element={<Home/>}/>
            <Route path="/create" element={<CreateCapsule/>}/>
            <Route path="/unlock" element={<Unlock/>}/>
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
