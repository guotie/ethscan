import { assert } from 'console';
import Web3 from 'web3'
// import { ethers } from 'ethers'

const network = 'mainnet'
// const provider = ethers.getDefaultProvider(network, {
//     infura: ''
// })
// const provider = new ethers.providers.InfuraProvider(network, '')
// const endpoint = 'https://mainnet.infura.io/v3/' //
assert(process.env.ETH_RPC_ENDPOINT)
const endpoint = process.env.ETH_RPC_ENDPOINT || ''
const provider = new Web3(endpoint)

export function batchRequest() {
    return new provider.BatchRequest();
}

export default provider
