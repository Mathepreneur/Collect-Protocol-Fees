const fs = require('fs').promises;
const ethers = require('ethers');

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');

    const poolFactoryAbi = JSON.parse(await fs.readFile('./jsonFiles/poolFactoryAbi.json', 'utf8'));
    const poolAbi = JSON.parse(await fs.readFile('./jsonFiles/poolAbi.json', 'utf8'));

    const poolFactoryAddress = '0x97509c65Ff29C268F0D283A41201Be6b4090354c'; 
    const poolFactoryContract = new ethers.Contract(poolFactoryAddress, poolFactoryAbi, provider);

    const existingData = JSON.parse(await fs.readFile('./jsonFiles/arbitrumData252.json', 'utf8'));

    const newData = await Promise.all(existingData.map(async (item) => {
        try {
            const poolAddress = await poolFactoryContract['get(address,address)'](
                item.token0_address,
                item.token1_address
            );

            const poolContract = new ethers.Contract(poolAddress, poolAbi, provider);

            const protocolFees = await poolContract.protocolFeesEarned(
                item.strike,
                item.maturity_epoch
            );

            return {
                created_at: item.created_at,
                maturity: item.maturity,
                maturity_epoch: item.maturity_epoch,
                strike: item.strike,
                chain_id: item.chain_id,
                token0_address: item.token0_address,
                token0_symbol: item.token0_symbol,
                token1_symbol: item.token1_symbol,
                token1_address: item.token1_address,
                pool_address: poolAddress,
                long0ProtocolFees: protocolFees[0].toString(),
                long1ProtocolFees: protocolFees[1].toString(),
                shortProtocolFees: protocolFees[2].toString()
            };
        } catch (error) {
            console.error(`Error processing item:`, item, error);
            return null;
        }
    }));

    const filteredData = newData.filter(item => item !== null);

    await fs.writeFile('newArbitrumData.json', JSON.stringify(filteredData, null, 2));

    console.log("New data has been saved to newArbitrumData.json");
}

main().catch(console.error);