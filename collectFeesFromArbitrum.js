const fs = require('fs');
const ethers = require('ethers');


const abi = JSON.parse(fs.readFileSync('collectFeesAbi.json', 'utf8'));

const data = JSON.parse(fs.readFileSync('arbitrumData.json', 'utf8'));

const provider = new ethers.providers.JsonRpcProvider('https://arbitrum.llamarpc.com');

const contractAddress = '0x70fEA7B1f981557d2B45CbDD9699D3687DDc73D9';

const privateKey = '';
const wallet = new ethers.Wallet(privateKey, provider);

const contract = new ethers.Contract(contractAddress, abi, wallet);

async function collectFees(entry) {
    const param = {
        token0: entry.token0_address,
        token1: entry.token1_address,
        strike: entry.strike,
        maturity: entry.maturity_epoch,
        token0To: '',
        token1To: '',
        minToken0Amount: 0,
        minToken1Amount: 0,
        deadline: 1754497165
    };

    try {
        const tx = await contract.collectProtocolFeesAfterMaturity(param);
        const receipt = await tx.wait();
        
        const event = receipt.events.find(e => e.event === 'CollectProtocolFeesAfterMaturity');
        
        if (event) {
            const { token0Amount, token1Amount, shortFees } = event.args;
            return {
                transactionHash: receipt.transactionHash,
                token0Amount: token0Amount.toString(),
                token1Amount: token1Amount.toString(),
                // shortFees: shortFees.toString()
            };
        } else {
            console.error('CollectProtocolFeesAfterMaturity event not found in transaction logs');
            return null;
        }
    } catch (error) {
        console.error(`Error collecting fees for ${entry.token0_symbol}-${entry.token1_symbol}: ${error.message} maturity - ${entry.maturity} & strike - ${entry.strike}`);
        return null;
    }
}

async function withdrawFees() {
    const outputData = [];
    for (const entry of data) {
        const txHash = await collectFees(entry);
        if (txHash) {
            outputData.push({
                maturity: entry.maturity,
                maturity_epoch: entry.maturity_epoch,
                strike: entry.strike,
                chain_id: entry.chain_id,
                token0_address: entry.token0_address,
                token0_symbol: entry.token0_symbol,
                token1_symbol: entry.token1_symbol,
                token1_address: entry.token1_address,
                transaction_hash: txHash,
                token0_amount: result.token0Amount,
                token1_amount: result.token1Amount,
                short_fees: result.shortFees
            });
        }
    }
    fs.writeFileSync('outputArbitrum.json', JSON.stringify(outputData, null, 2));
    console.log('Processing complete. Results written to output.json');
}

withdrawFees().catch(console.error);