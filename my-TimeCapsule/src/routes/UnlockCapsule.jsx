import { useState } from "react";
import {
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
} from "wagmi";
import { contractAddress, contractABI } from "./contract";

export default function UnlockAndReadCapsule() {
  const [capsuleId, setCapsuleId] = useState("");
  const [ipfs, setIpfs] = useState("");
  const [txHash, setTxHash] = useState("");
  const [unlockedEvent, setUnlockedEvent] = useState(null);
  const [message, setMessage] = useState("");


  const { config: unlockConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: "unlockCapsule",
    args: capsuleId ? [BigInt(capsuleId)] : undefined,
    enabled: Boolean(capsuleId),
  });

  const {
    write: unlockCapsule,
    isLoading: unlocking,
    isSuccess: unlockSuccess,
    error: unlockError,
  } = useContractWrite({
    ...unlockConfig,
    onSuccess: (data) => {
      setTxHash(data.hash);
      setMessage("⏳ Transaction sent. Waiting for confirmation...");
    },
  });


  useWaitForTransaction({
    hash: txHash,
    enabled: Boolean(txHash),
    onSuccess: (receipt) => {
      const capsuleUnlockedTopic =
        "0x0a0b6cd8449f0b4cf21fba5b7dbd228d3a9de9ed5a833d49643e4fa15a8c0097"; // keccak256("CapsuleUnlocked(uint256,address,uint256)")

      const log = receipt.logs.find((log) => log.topics[0] === capsuleUnlockedTopic);

      if (log) {
        const id = parseInt(log.topics[1], 16);
        const user = `0x${log.topics[2].slice(26)}`;
        const amount = parseInt(log.data, 16);

        setUnlockedEvent({ id, user, amount });
        setMessage("Capsule unlocked successfully!");
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
  } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "getCapsuleContent",
    args: capsuleId ? [BigInt(capsuleId)] : undefined,
    enabled: false,
  });

  const handleGetIpfs = async () => {
    const result = await refetchIpfs();
    if (result?.data) {
      setIpfs(result.data);
    }
  };

  return (
    <div>
      <h2>Unlock Capsule & View IPFS</h2>

      {message && (
        <div
          style={{
            padding: "10px",
            background: message.includes("NO") ? "#ffe5e5" : "#e5ffe5",
            border: "1px solid",
            marginBottom: "1rem",
          }}
        >
          {message}
        </div>
      )}

      <input
        type="number"
        placeholder="Enter Capsule ID"
        value={capsuleId}
        onChange={(e) => setCapsuleId(e.target.value)}
      />

      <br />

      <button
        onClick={() => unlockCapsule?.()}
        disabled={!unlockCapsule || unlocking}
      >
        {unlocking ? "Unlocking..." : "Unlock Capsule"}
      </button>

      {unlockError && (
        <p style={{ color: "red" }}> Unlock Error: {unlockError.message}</p>
      )}

      {unlockedEvent && (
        <div style={{ marginTop: "1rem", color: "green" }}>
          <p>Capsule Unlocked Event Detected!</p>
          <p><strong>ID:</strong> {unlockedEvent.id}</p>
          <p><strong>User:</strong> {unlockedEvent.user}</p>
          <p><strong>Amount:</strong> {unlockedEvent.amount} wei</p>
        </div>
      )}

      <br />

      <button onClick={handleGetIpfs} disabled={loadingIpfs}>
        {loadingIpfs ? "Fetching IPFS..." : "Get IPFS CID"}
      </button>

      {ipfsError && (
        <p style={{ color: "red" }}>Read Error: {ipfsError.message}</p>
      )}

      {ipfs && (
        <p>
          Your IPFS CID:{" "}
          <a href={`https://ipfs.io/ipfs/${ipfs}`} target="_blank" rel="noreferrer">
            {ipfs}
          </a>
        </p>
      )}
    </div>
  );
}
