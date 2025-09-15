import { useState } from "react";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";

const contractAddress = "0xba4A4F1c6FE71d1d2B08A9cCA24B96487C309028";
const contractABI = [
  {
    type: "function",
    name: "unlockCapsule",
    inputs: [
      { name: "_capsuleId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getCapsuleContent",
    inputs: [
      { name: "_capsuleId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "", type: "string", internalType: "string" }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "CapsuleUnlocked",
    inputs: [
      { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  }
];

export default function Unlock() {
  const [capsuleId, setCapsuleId] = useState("");
  const [ipfs, setIpfs] = useState("");
  const [txHash, setTxHash] = useState("");
  const [unlockedEvent, setUnlockedEvent] = useState(null);
  const [message, setMessage] = useState("");

  const { writeContract: unlockCapsule, isPending: unlocking } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setTxHash(hash);
        setMessage("⏳ Transaction sent. Waiting for confirmation...");
      },
      onError: (error) => {
        console.error("Unlock error:", error);
        setMessage(`Unlock Error: ${error.message}`);
      }
    }
  });

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
    onSuccess: (receipt) => {
      const capsuleUnlockedTopic =
        "0x0a0b6cd8449f0b4cf21fba5b7dbd228d3a9de9ed5a833d49643e4fa15a8c0097";

      const log = receipt.logs.find((log) => log.topics[0] === capsuleUnlockedTopic);

      if (log) {
        const id = parseInt(log.topics[1], 16);
        const user = `0x${log.topics[2].slice(26)}`;
        const amount = parseInt(log.data, 16);

        setUnlockedEvent({ id, user, amount });
        setMessage("✅ Capsule unlocked successfully!");
      } else {
        setMessage("Transaction confirmed but no CapsuleUnlocked event found.");
      }
    },
    onError: (error) => {
      setMessage(`Transaction failed: ${error.message}`);
    },
  });

  const {
    data: ipfsCid,
    isLoading: loadingIpfs,
    refetch: refetchIpfs,
    error: ipfsError,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getCapsuleContent",
    args: capsuleId ? [BigInt(capsuleId)] : undefined,
    query: {
      enabled: false, 
    }
  });

  const handleUnlock = () => {
    if (!capsuleId) {
      setMessage("Please enter a capsule ID");
      return;
    }

    setUnlockedEvent(null);
    setTxHash("");
    setMessage("");

    unlockCapsule({
      address: contractAddress,
      abi: contractABI,
      functionName: "unlockCapsule",
      args: [BigInt(capsuleId)],
    });
  };

  const handleGetIpfs = async () => {
    if (!capsuleId) {
      setMessage("Please enter a capsule ID first");
      return;
    }

    try {
      const result = await refetchIpfs();
      if (result?.data) {
        setIpfs(result.data);
        setMessage(`IPFS CID retrieved: ${result.data}`);
      }
    } catch (error) {
      setMessage(`Error fetching IPFS CID: ${error.message}`);
    }
  };

  const formatEthAmount = (weiAmount) => {
    return (weiAmount / 1e18).toFixed(6);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Unlock Time Capsule & View Content</h2>

      {message && (
        <div className={`text-sm p-3 rounded border-l-4 ${
          message.includes("Error") || message.includes("failed") 
            ? "text-red-700 bg-red-50 border-red-400" 
            : message.includes("YES") || message.includes("successfully")
            ? "text-green-700 bg-green-50 border-green-400"
            : "text-blue-700 bg-blue-50 border-blue-400"
        }`}>
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Capsule ID
        </label>
        <input
          type="number"
          placeholder="Enter Capsule ID"
          value={capsuleId}
          onChange={(e) => setCapsuleId(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          min="0"
        />
      </div>

      <div className="space-y-2">
        <button
          onClick={handleUnlock}
          disabled={!capsuleId || unlocking || isWaitingForTx}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {unlocking 
            ? "Signing Transaction..." 
            : isWaitingForTx 
            ? "Unlocking..." 
            : "Unlock Capsule"
          }
        </button>

        <button 
          onClick={handleGetIpfs} 
          disabled={!capsuleId || loadingIpfs}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingIpfs ? "Fetching..." : " Get IPFS Content"}
        </button>
      </div>

      {unlockedEvent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-green-800"> Capsule Unlocked!</h3>
          <div className="text-sm text-green-700 space-y-1">
            <div><strong>Capsule ID:</strong> {unlockedEvent.id}</div>
            <div><strong>Recipient:</strong> {unlockedEvent.user}</div>
            <div><strong>ETH Released:</strong> {formatEthAmount(unlockedEvent.amount)} ETH</div>
            <div><strong>Transaction:</strong> 
              <a 
                href={`https://etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
              View on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}

      {ipfsError && (
        <div className="text-sm p-3 rounded border-l-4 text-red-700 bg-red-50 border-red-400">
          IPFS Read Error: {ipfsError.message}
        </div>
      )}

      {ipfs && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2"> Capsule Content</h3>
          <div className="text-sm">
            <p className="mb-2"><strong>IPFS CID:</strong></p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all mb-2">
              {ipfs}
            </p>
            <div className="space-x-2">
              <a 
                href={`https://ipfs.io/ipfs/${ipfs}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
              >
                📖 View on IPFS
              </a>
              <a 
                href={`https://gateway.pinata.cloud/ipfs/${ipfs}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
              >
                📖 View on Pinata
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
        <p><strong>Note:</strong> You can only unlock a capsule after its unlock time has passed. 
        The locked ETH will be returned to the capsule owner upon successful unlock.</p>
      </div>
    </div>
  );
}
