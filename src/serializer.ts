import {Address, Constant, ErgoTree, I64, NetworkPrefix} from 'ergo-lib-wasm-nodejs'
import { NETWORK } from './consts'

export class Serializer {
    networkPrefix = NETWORK === 'mainnet' ? NetworkPrefix.Testnet : NetworkPrefix.Mainnet
    constructor(
    ) { }

    decodeTree(encodedTree: string): ErgoTree {
        const byteArray = Constant.decode_from_base16(encodedTree).to_byte_array()
        return ErgoTree.from_bytes(byteArray)
    }


    treeToAddrs(tree: ErgoTree): string {
        return Address.recreate_from_ergo_tree(tree).to_base58(this.networkPrefix)
    }

    encodeNumber(num: number): string {
        const num64 = I64.from_str(num.toString())
        return Constant.from_i64(num64).encode_to_base16()
    }

    decodeCollLong(encodedColl: string): any {
        return Constant.decode_from_base16(encodedColl).to_js().map((x: any) => Number(x))
    }

    encodeCollLong(coll: number[]): string {
        const collStr = coll.map((x: number) => x.toString())
        return Constant.from_i64_str_array(collStr).encode_to_base16()
    }

    encodeTupleLong(a: number, b: number): string {
        const a64 = I64.from_str(a.toString())
        const b64 = I64.from_str(b.toString())
        return Constant.from_tuple_i64(a64, b64).encode_to_base16()
    }

    decodeCollByte(encodedColl: string): any {
        return Constant.decode_from_base16(encodedColl).to_js().map((x: any) => Buffer.from(x).toString('hex'))
    }

    decodeJs(encodedColl: string): any {
        return Constant.decode_from_base16(encodedColl).to_js()
    }

    decodeId(encodedId: string): string {
        const bytes = Constant.decode_from_base16(encodedId).to_byte_array()
        return Buffer.from(bytes).toString('hex')
    }

    encodeId(id: string): string {
        return Constant.from_byte_array(Buffer.from(id, 'hex')).encode_to_base16()
    }
}
