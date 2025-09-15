import Navbar from '../component/Navbar'
import WalletConnect from '../component/WalletConnect'

export default function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Wagmi React App</h1>
      <WalletConnect />
      <Navbar/>
      

    </div>
  )
}
