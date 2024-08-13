const fs = require('fs').promises;

async function main() {
  // Read and parse the JSON file with contract addresses
  const data = JSON.parse(await fs.readFile('input.json', 'utf8'));

  let output = '';

  for (const [chainId, versions] of Object.entries(data)) {
    output += `Chain ID: ${chainId}\n`;

    for (const [version, contracts] of Object.entries(versions)) {
      const optionFactoryAddress = contracts.TimeswapV2OptionFactory;
      if (optionFactoryAddress) {
        output += `Version: ${version}, Address: ${optionFactoryAddress}\n`;
      }
    }

    output += '\n';
  }

  // Write to file
  await fs.writeFile('option_factory_addresses.txt', output);
  console.log('File written: option_factory_addresses.txt');
}

main().catch(console.error);