const ethers = require('ethers');
const fs = require('fs');

const RPC_ENDPOINT = 'https://arb1.arbitrum.io/rpc';

const CONTRACT_ADDRESS = '0x70fEA7B1f981557d2B45CbDD9699D3687DDc73D9';


async function fetchTransactions() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
  
    console.log("Fetching latest block number...");
    const latestBlock = await provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);
  
    const transactions = new Set();
    const batchSize = 100000; 
    let startBlock = 237917306;
  
    while (startBlock <= latestBlock) {
      const endBlock = Math.min(startBlock + batchSize, latestBlock);
      console.log(`Fetching logs from block ${startBlock} to ${endBlock}...`);
  
      try {
        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: startBlock,
          toBlock: endBlock
        });
        
        for (const log of logs) {
          if (!transactions.has(log.transactionHash)) {
            const tx = await provider.getTransaction(log.transactionHash);
            transactions.add(log.transactionHash);
            console.log(`Fetched transaction: ${log.transactionHash}`);
          }
        }
  
        console.log(`Fetched ${logs.length} logs in this batch.`);
      } catch (error) {
        console.error(`Error fetching logs: ${error.message}`);
      }
  
      startBlock = endBlock + 1;
  
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  
    return Array.from(transactions);
  }
  
  async function main() {
    console.log("Starting transaction fetch...");
    const transactionHashes = await fetchTransactions();
  
    console.log(`Total unique transactions fetched: ${transactionHashes.length}`);
  
    const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
    const detailedTransactions = await Promise.all(
      transactionHashes.map(async (hash) => {
        const tx = await provider.getTransaction(hash);
        return {
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          data: tx.data
        };
      })
    );
  
    fs.writeFileSync('arbitrum_transactions.json', JSON.stringify(detailedTransactions, null, 2));
    console.log(`Saved transactions to arbitrum_transactions.json`);
  }
  
  main().catch(error => {
    console.error("An error occurred:", error);
    process.exit(1);
  });