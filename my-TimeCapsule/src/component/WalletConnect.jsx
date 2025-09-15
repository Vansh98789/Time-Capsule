import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div style={{ margin: '20px 0' }}>
        <p>Connected to: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <div style={{ margin: '20px 0' }}>
      <h3>Connect Your Wallet</h3>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          style={{ margin: '5px', padding: '10px 15px' }}
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}

export default WalletConnect