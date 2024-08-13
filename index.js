const fs = require('fs').promises;
const ethers = require('ethers');

// RPC URLs for each chain (you'll need to fill these in)
const rpcUrls = {

  2525: "https://mainnet.rpc.inevm.com/http",
  196: "https://rpc.xlayer.tech",
  1101: "https://zkevm-rpc.com",
  137: "https://polygon.llamarpc.com",
  1: "https://eth.llamarpc.com",
  5000: "https://rpc.ankr.com/mantle",
  8453: "https://base.llamarpc.com",
  10: "https://optimism.llamarpc.com",
  42161: "https://arbitrum.llamarpc.com",
  80084: "https://bartio.drpc.org"
  
};

async function main() {
  // Read and parse the JSON file with contract addresses
  const data = JSON.parse(await fs.readFile('input.json', 'utf8'));

  // Read and parse the ABI file
  const abi = JSON.parse(await fs.readFile('poolFactoryAbi.json', 'utf8'));

  for (const [chainId, versions] of Object.entries(data)) {
    let output = '';
    const rpcUrl = rpcUrls[chainId];
    
    if (!rpcUrl) {
      console.log(`No RPC URL found for chain ${chainId}. Skipping.`);
      continue;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    for (const [version, contracts] of Object.entries(versions)) {
      const poolFactoryAddress = contracts.TimeswapV2OptionFactory;
      if (poolFactoryAddress) {
        output += `Version: ${version}\n`;
        output += `Address: ${poolFactoryAddress}\n`;

        try {
          const contract = new ethers.Contract(poolFactoryAddress, abi, provider);
          const owner = await contract.owner();
          output += `Owner: ${owner}\n\n`;
        } catch (error) {
          console.error(`Error fetching owner for chain ${chainId}, version ${version}: ${error.message}`);
          output += `Owner: Error fetching\n\n`;
        }
      }
    }

    // Write to file
    if (output) {
      await fs.writeFile(`chain_${chainId}_pool_factory.txt`, output);
      console.log(`File written for chain ${chainId}`);
    }
  }
}

main().catch(console.error);