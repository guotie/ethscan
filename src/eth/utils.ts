import BigNumber from 'bignumber.js'

// 防止出现极大的数字, 转换为string时太长 无法入库
BigNumber.config({EXPONENTIAL_AT: 30})

const e1_18 = new BigNumber(10 ** 18)
const zero = new BigNumber(0)

// 0x0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6 => 0x9c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6
function convertAddressFromHex64(hex: string) {
    if (hex.startsWith('0x')) {
        hex = hex.slice(2)
    }
    return '0x' + hex.slice(24)
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

// BigNumber截断长度
function bnToString(bn: BigNumber, p = 32) {
    return bn.toPrecision(p).toString()
}

function toBn(n: string, decimals: number) {
    let bn = new BigNumber(n)
    for (let i = 0; i < decimals; i ++) {
        bn = bn.div(10)
    }
    return bn
}

function decodeDataArg(data: string, idx: number = 0) {
    if (data.startsWith('0x')) {
        data = data.slice(2)
    }
    return data.slice(64 * idx, 64 * (idx + 1))
}

function decodeDataAddress(data: string, idx: number = 0) {
    let arg = decodeDataArg(data, idx)
    return convertAddressFromHex64(arg)
}

;(async () => {
//     let addr = convertAddressFromHex64('0x0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6')
//     console.log(addr)
//     let addr2 = convertAddressFromHex64('0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6')
//     console.log(addr2)
    // let a = new BigNumber('15792089237316195423570985008687907853269984665640564039457584007913129635936')
    // BigNumber.set({EXPONENTIAL_AT: 32})
    
    // console.log(a.toPrecision(32).toString())
    // console.log(a.toString())
})()

export {
    zero,
    e1_18,
    sleep,
    toBn,
    bnToString,
    decodeDataAddress,
    convertAddressFromHex64,
}
