import { pushKafka, pushBatch } from '../kafka/push'

// 
// 3. 可以触发余额变动的包括:
//    a. 产块地址eth更新
//    b. eth转账交易(from, to)
//    c. 合约transfer(from, to), burn(from), mint(from), send(from, to), transferFrom()事件
//    d. 其他事件
//    e. todo: uncle reward
//
export const BalanceEventMine               = 'mine'
export const BalanceEventETHTx              = 'eth-tx'
export const BalanceEventTokenTransfer      = 'token-transfer'  // transfer, transferFrom, mint, burn
export const BalanceEventTokenDeposit       = 'token-deposit'   // deposit
export const BalanceEventTokenWithdraw      = 'token-withdraw'  // withdraw

export const TopicEthAccount                = 'eth-account'
export const TopicErcToken                  = 'eth-token'

// 推送的消息
interface IPushEvent {
    topic: string
}

class BalanceEvent implements IPushEvent {
    height?: number
    txHash?: string
    address: string
    token: string
    action: string
    topic:  string

    constructor(address: string, action: string, token = 'ETH', height?: number, txHash?: string) {
        this.height = height
        this.txHash = txHash
        this.address = address
        this.token = token
        this.action = action
        this.topic = TopicEthAccount
    }

    // 推送一条数据
    async push() {
        await pushKafka(this)
    }
}

// erc20 转账事件, 异步程序收到消息后, 判断是否需要更新该 token 的信息
class Erc20Event implements IPushEvent {
    height?: number
    txHash?: string
    from?: string     // 转账发起者
    address: string   // token 地址
    topic:   string

    constructor(address: string, height?: number, txHash?: string, from?: string) {
        this.address = address
        this.height = height
        this.txHash = txHash
        this.topic  = TopicErcToken
    }

    async push() {
        await pushKafka(this)
    }
}
 

// 批量推送
async function pushEvents(events: Array<IPushEvent>) {
    console.info('kafka balance events:', events.length)
    // events.forEach(evt => console.info('    evt: action: %s address: %s token: %s', evt.action, evt.address, evt.token))
    await pushBatch(events)
}

// 产块地址eth更新
function updaterMinerBalance(miner: string) {
    return new BalanceEvent(miner, BalanceEventMine)
}

// eth转账交易(from, to)
function updaterETHTransfer(from: string, to: string, height: number): Array<BalanceEvent> {
    return [new BalanceEvent(from, BalanceEventETHTx), new BalanceEvent(to, BalanceEventETHTx, 'ETH', height)]
}

// 合约事件
function updateContractEvent(from: string, to: string, token: string, action: string): Array<BalanceEvent> {
    return [new BalanceEvent(from, action, token), new BalanceEvent(to, action, token)]
}

export {
    pushEvents,
    IPushEvent,
    Erc20Event,
    BalanceEvent,
    updaterMinerBalance,
    updaterETHTransfer,
    updateContractEvent,
}
