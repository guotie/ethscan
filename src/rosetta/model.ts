interface SubNetworkIdentifier {
    network: string
    metadata: { producer: string}
}

interface NetworkIdentifier {
    blockchain: string
    network: string
    subNetworkIdentifier?: SubNetworkIdentifier
}