// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeCapsule {
    struct Capsule {
        address owner;
        uint256 unlockTime;
        string ipfsCid;
        bool unlocked;
        uint256 ethAmount;
        uint256 createdTime;
    }

    uint256 public capsuleCount;
    mapping(uint256 => Capsule) private capsules;
    
    event CapsuleCreated(uint256 indexed id, address indexed owner, uint256 unlockTime);
    event CapsuleUnlocked(uint256 indexed id, address indexed unlockedBy, uint256 ethAmount);

    modifier validCapsule(uint256 _id) {
        require(_id < capsuleCount, "Capsule not found");
        _;
    }

    function createCapsule(string memory _ipfsCid, uint256 _unlockTime) 
        external payable returns (uint256 id) 
    {
        require(_unlockTime > 0, "Unlock time must be greater than 0");
        
        uint256 unlockTimestamp = block.timestamp + _unlockTime;
        
        id = capsuleCount;
        capsules[id] = Capsule({
            owner: msg.sender,
            unlockTime: unlockTimestamp,
            ipfsCid: _ipfsCid,
            unlocked: false,
            ethAmount: msg.value,
            createdTime: block.timestamp
        });

        emit CapsuleCreated(id, msg.sender, unlockTimestamp);
        capsuleCount++;
    }

    function unlockCapsule(uint256 _id) 
        external 
        validCapsule(_id) 
    {
        Capsule storage capsule = capsules[_id];
        
        require(block.timestamp >= capsule.unlockTime, "Too early to unlock");
        require(!capsule.unlocked, "Already unlocked");

        capsule.unlocked = true;
        uint256 amount = capsule.ethAmount;
        capsule.ethAmount = 0;

        emit CapsuleUnlocked(_id, msg.sender, amount);

        if (amount > 0) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH transfer failed");
        }
    }

    function getCapsuleInfo(uint256 _id) 
        external 
        view 
        validCapsule(_id) 
        returns (
            address owner, 
            uint256 unlockTime, 
            uint256 ethAmount, 
            bool unlocked
        ) 
    {
        Capsule memory capsule = capsules[_id];
        return (capsule.owner, capsule.unlockTime, capsule.ethAmount, capsule.unlocked);
    }

    function getCapsuleContent(uint256 _id) 
        external 
        view 
        validCapsule(_id) 
        returns (string memory ipfsCid) 
    {
        Capsule memory capsule = capsules[_id];
        require(capsule.unlocked, "Capsule not unlocked yet");
        return capsule.ipfsCid;
    }

    function getMyCapsules() external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](capsuleCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < capsuleCount; i++) {
            if (capsules[i].owner == msg.sender) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }

    function canUnlock(uint256 _id) 
        external 
        view 
        validCapsule(_id) 
        returns (bool) 
    {
        Capsule memory capsule = capsules[_id];
        return block.timestamp >= capsule.unlockTime && !capsule.unlocked;
    }

    function getCapsuleDetails(uint256 _id) 
        external 
        view 
        validCapsule(_id) 
        returns (
            address owner,
            uint256 unlockTime,
            string memory ipfsCid,
            bool unlocked,
            uint256 ethAmount
        ) 
    {
        Capsule memory capsule = capsules[_id];
        return (
            capsule.owner,
            capsule.unlockTime,
            capsule.ipfsCid,
            capsule.unlocked,
            capsule.ethAmount
        );
    }

    function getCapsuleCreatedTime(uint256 _id) 
        external 
        view 
        validCapsule(_id) 
        returns (uint256 createdTime) 
    {
        return capsules[_id].createdTime;
    }
    // function getAllCapsule() public view returns(uint256[] memory){
    //     uint256[] memory arr=new uint256[](capsuleCount);
    //     uint256 count=0;
    //     for(uint i=0;i<=capsuleCount;i++){
    //         arr[count]=i;
    //         count++;
    //     }
    //     return arr;
    // }
}