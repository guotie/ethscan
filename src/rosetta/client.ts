let gs = function(a: any) {
    JSON.stringify(Object.keys(a).reduce((o, i) =>  {return {...o,[i.replace(/([A-Z])/g,"_$1").toLowerCase()]:a[i]}},{}))
}

class Client {
    endpoint: string
    blockchain: string
    network: string

    constructor(endpoint: string) {
        this.endpoint = endpoint
        this.blockchain = ''
        this.network = ''
    }

    getNetworkList(metadata?: Object | null | undefined) {

    }
    
    getBlock(height: number) {

    }

    getAccountBalance() {

    }
    getAccountCoins() {

    }
}