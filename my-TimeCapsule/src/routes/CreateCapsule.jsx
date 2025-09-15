import { useState } from "react";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther } from "viem";

function CreateCapsule() {
  const contractAddress = "0xba4A4F1c6FE71d1d2B08A9cCA24B96487C309028";
  const abi = [
    {
      type: "function",
      name: "createCapsule",
      inputs: [
        { name: "_ipfsCid", type: "string", internalType: "string" },
        { name: "_unlockTime", type: "uint256", internalType: "uint256" }
      ],
      outputs: [{ name: "id", type: "uint256", internalType: "uint256" }],
      stateMutability: "payable"
    },
    {
      type: "event",
      name: "CapsuleCreated",
      inputs: [
        { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
        { name: "owner", type: "address", indexed: true, internalType: "address" },
        { name: "unlockTime", type: "uint256", indexed: false, internalType: "uint256" }
      ],
      anonymous: false
    }
  ];
  
 
  
  const [ethAmount, setEthAmount] = useState("");
  const [ipfsCID, setIpfsCID] = useState(""); 
  const [unlockTime, setUnlockTime] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [capsuleData, setCapsuleData] = useState(null);








  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: abi,
    functionName: "createCapsule",
    args: [ipfsCID, unlockTime ? parseInt(unlockTime) : 0],
    value: ethAmount ? parseEther(ethAmount) : parseEther("0"),
    enabled: Boolean(ipfsCID && unlockTime && ethAmount),
  });

  const { write: createCapsule, isLoading: isWriteLoading } = useContractWrite({
    ...config,
    onSuccess(data) {
      setTxHash(data.hash);
      setMessage(`Capsule creation transaction sent! Hash: ${data.hash}`);
    },
    onError(error) {
      console.error("Contract write error:", error);
      setMessage(`Error creating capsule: ${error.message}`);
    }
  });

  const { isLoading: isWaitingForTx } = useWaitForTransaction({
    hash: txHash,
    enabled: Boolean(txHash),
    onSuccess(receipt) {
      console.log("Transaction confirmed:", receipt);  
      const capsuleCreatedTopic = "0x94c04aecc42f013fcb329d54ab685a53f3a2a84902997bdbb2addc2af8e5b9e3"; //  keccak256 hash of "CapsuleCreated(uint256,address,uint256)"
      
      const capsuleCreatedLog = receipt.logs.find(log => 
        log.topics[0] === capsuleCreatedTopic
      );

      if (capsuleCreatedLog) {
        
        const capsuleId = parseInt(capsuleCreatedLog.topics[1], 16);
        const owner = `0x${capsuleCreatedLog.topics[2].slice(26)}`; // Remove padding
        const unlockTimestamp = parseInt(capsuleCreatedLog.data, 16);

        const capsuleInfo = {
          id: capsuleId,
          owner: owner,
          unlockTime: unlockTimestamp,
          unlockDate: new Date(unlockTimestamp * 1000).toLocaleString(),
        };

        setCapsuleData(capsuleInfo);
        setMessage(`Capsule created successfully! ID: ${capsuleId}`);
      } else {
        setMessage("Transaction confirmed but couldn't find capsule creation event");
      }
    },
    onError(error) {
      console.error("Transaction failed:", error);
      setMessage(`Transaction failed: ${error.message}`);
    }
  });







  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };



  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://api.filebase.io/v1/ipfs", {
        method: "POST",
        headers: {
          Authorization: "Bearer YOUR_FILEBASE_API_KEY", 
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      const cid = data.cid;
      setIpfsCID(cid);
      setMessage(` File uploaded! CID: ${cid}`);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(` Failed to upload file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async () => {
    if (!ipfsCID || !unlockTime || !ethAmount) {
      setMessage("Please fill all fields and upload a file first");
      return;
    }

    if (!createCapsule) {
      setMessage("Contract write not ready. Please check your wallet connection.");
      return;
    }

    try {
      setCapsuleData(null);
      setTxHash("");
      createCapsule();
    } catch (err) {
      console.error("Submit error:", err);
      setMessage(`Error: ${err.message}`);
    }
  };

  const resetForm = () => {
    setEthAmount("");
    setIpfsCID("");
    setUnlockTime("");
    setFile(null);
    setMessage("");
    setTxHash("");
    setCapsuleData(null);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Create Time Capsule</h2>

      {message && (
        <div className={`text-sm p-3 rounded border-l-4 ${
          message.includes("NO") || message.includes("Error") || message.includes("Failed") 
            ? "text-red-700 bg-red-50 border-red-400" 
            : message.includes(" Yes")
            ? "text-green-700 bg-green-50 border-green-400"
            : "text-blue-700 bg-blue-50 border-blue-400"
        }`}>
          {message}
        </div>
      )}



      {capsuleData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-green-800">✅ Capsule Created Successfully!</h3>
          <div className="text-sm text-green-700 space-y-1">
            <div><strong>Capsule ID:</strong> {capsuleData.id}</div>
            <div><strong>Owner:</strong> {capsuleData.owner}</div>
            <div><strong>Unlock Date:</strong> {capsuleData.unlockDate}</div>
            <div><strong>ETH Locked:</strong> {capsuleData.ethAmount} ETH</div>
            <div><strong>Transaction:</strong> 
             
            </div>
          </div>
          <button 
            onClick={resetForm}
            className="w-full mt-2 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Create Another Capsule
          </button>
        </div>
      )}

      {!capsuleData && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Unlock Time (seconds from now)
            </label>
            <input
              type="number"
              placeholder="e.g., 86400 for 1 day"
              value={unlockTime}
              onChange={(e) => setUnlockTime(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Select File to Store
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Uploading..." : "Upload File to IPFS"}
          </button>

          <div>
            <label className="block text-sm font-medium mb-1">
              ETH Amount to Lock
            </label>
            <input
              type="number"
              placeholder="0.01"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min="0"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!ipfsCID || !unlockTime || !ethAmount || isWriteLoading || isWaitingForTx}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWriteLoading 
              ? "Signing Transaction..." 
              : isWaitingForTx 
              ? "Creating Capsule..." 
              : "Create Time Capsule"
            }
          </button>

         
        </>
      )}
    </div>
  );
}

export default CreateCapsule;