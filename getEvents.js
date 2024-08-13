const ethers = require('ethers');
const fs = require('fs');

const RPC_ENDPOINT = 'https://arb1.arbitrum.io/rpc';

const CONTRACT_ADDRESS = '0x70fEA7B1f981557d2B45CbDD9699D3687DDc73D9';

const EVENT_SIGNATURE = '0xb0f772551a87ae0deb37ac0dc16da3a978dc35b0aa19431ac5b052100486c766';

// Function to read transaction hashes from JSON file
function readTransactionHashes(filename) {
    const rawData = fs.readFileSync(filename);
    const transactions = JSON.parse(rawData);
    return transactions.map(tx => tx.hash);
}

function decodeEvent(log) {

    const decodedData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint256'],
        log.data
    );

    return {
        // token0: log.topics[1],
        // token1: log.topics[2],
        // maturity: log.topics[3],
        token0Amount: decodedData[5].toString(),
        token1Amount: decodedData[6].toString()
    };
}

async function fetchAndDecodeEvents(txHashes) {
    const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
    const decodedEvents = [];

    for (const txHash of txHashes) {
        try {
            console.log(`Fetching receipt for transaction: ${txHash}`);
            const receipt = await provider.getTransactionReceipt(txHash);
            
            if (receipt) {
                const logs = receipt.logs.filter(log => 
                    log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
                    log.topics[0] === EVENT_SIGNATURE
                );
                
                for (const log of logs) {
                    const decodedEvent = decodeEvent(log);
                    decodedEvents.push({
                        transactionHash: txHash,
                        ...decodedEvent
                    });
                }
            } else {
                console.log(`No receipt found for transaction: ${txHash}`);
            }
        } catch (error) {
            console.error(`Error fetching receipt for ${txHash}: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return decodedEvents;
}

async function main() {
    const inputFilename = 'arbitrum_transactions.json'; 
    const outputFilename = 'decoded_events.json'; 

    console.log(`Reading transaction hashes from ${inputFilename}...`);
    const txHashes = readTransactionHashes(inputFilename);
    console.log(`Found ${txHashes.length} transaction hashes.`);

    console.log("Fetching and decoding events...");
    const decodedEvents = await fetchAndDecodeEvents(txHashes);

    console.log(`Total CollectProtocolFeesAfterMaturity events decoded: ${decodedEvents.length}`);

    fs.writeFileSync(outputFilename, JSON.stringify(decodedEvents, null, 2));
    console.log(`Saved decoded events to ${outputFilename}`);

    decodedEvents.forEach(event => {
        console.log(`Transaction Hash: ${event.transactionHash}`);
        console.log(`Token0 Amount: ${event.token0Amount}`);
        console.log(`Token1 Amount: ${event.token1Amount}`);
        console.log('---');
    });
}

main().catch(error => {
    console.error("An error occurred:", error);
    process.exit(1);
});