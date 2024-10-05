import {
    Address,
    BoxId,
    BoxValue,
    Constant,
    Contract,
    DataInput,
    DataInputs,
    ErgoBox,
    ErgoBoxCandidate,
    ErgoBoxCandidateBuilder,
    ErgoBoxCandidates,
    ErgoBoxes,
    ErgoStateContext,
    ErgoTree,
    I64,
    NetworkPrefix,
    ReducedTransaction,
    SecretKeys,
    TokenAmount,
    TokenId,
    Tokens,
    Transaction,
    UnsignedInput,
    UnsignedInputs,
    UnsignedTransaction,
    Wallet
} from 'ergo-lib-wasm-nodejs'
import {JSONBI} from "./nodeService";

function getBoxValue(val: any) {
    return BoxValue.from_i64(I64.from_str(val.toString()))
}

function addressToContract(address: string) {
    return Contract.pay_to_address(Address.from_mainnet_str(address));
}

function jsToCandidate(out: any, height: number) {
    const tree = ErgoTree.from_base16_bytes(out.ergoTree)
    const address = Address.recreate_from_ergo_tree(tree).to_base58(NetworkPrefix.Mainnet)
    const myOut = new ErgoBoxCandidateBuilder(getBoxValue(out.value), addressToContract(address), height)

    if (out.assets === undefined) out.assets = []
    out.assets.forEach((i: any) => {
        const tokAm = TokenAmount.from_i64(I64.from_str(i.amount.toString()))
        myOut.add_token(TokenId.from_str(i.tokenId), tokAm)
    })
    if (out.additionalRegisters === undefined)
        out.additionalRegisters = {}

    const vals: any = Object.values(out.additionalRegisters)
    for (let i = 0; i < vals.length; i++) {
        myOut.set_register_value(i + 4, Constant.decode_from_base16(vals[i].toString()))
    }
    return myOut.build()
}

function idToBoxId(id: string) {
    return BoxId.from_str(id)
}


/**
 * get outbox from tree and value
 * @param tree ergo tree
 * @param ergVal value
 */
export function getOutBoxJs(tree: string, ergVal: number) {
    return {
        value: ergVal,
        ergoTree: tree,
        extension: {},
        additionalRegisters: {}
    }
}

function getTokens(assets: any) {
    const inTokens: any = {}
    assets.forEach((asset: any) => {
        const tid = asset.tokenId
        if (!(tid in inTokens)) {
            inTokens[tid] = BigInt(0)
        }
        inTokens[tid] += BigInt(asset.amount)
    })
    return inTokens
}

/**
 * get unsigned tx from inputs, outputs, dInputs and fee
 * @param inputs inputs to the tx
 * @param outputs outputs to the tx
 * @param dInputs data inputs to the tx
 * @param fee miner fee
 * @param realHeight current height of the blockchain
 */
export function jsToUnsignedTx(inputs: any, outputs: any, dInputs: any, fee: Number, realHeight: number = 0) {
    var height = Math.max(...inputs.map((i: any) => i.creationHeight))
    const unsignedInputs = new UnsignedInputs()
    for (const box of inputs) {
        const unsignedInput = UnsignedInput.from_box_id(idToBoxId(box.boxId))
        unsignedInputs.add(unsignedInput)
    }

    const dataInputs = new DataInputs()
    for (const d of dInputs)
        dataInputs.add(new DataInput(idToBoxId(d.boxId)))

    const unsignedOutputs = ErgoBoxCandidates.empty()
    outputs.forEach((i: any) => {
        const box = jsToCandidate(i, height)
        unsignedOutputs.add(box)
    })
    const feeBox = ErgoBoxCandidate.new_miner_fee_box(getBoxValue(fee), height)
    unsignedOutputs.add(feeBox)

    const unsignedTx = new UnsignedTransaction(unsignedInputs, dataInputs, unsignedOutputs)
    return unsignedTx
}

/**
 * get change box from inputs, outputs, changeTree and fee
 * @param ins inputs to the tx except the change box
 * @param outs outputs to the tx except the change box
 * @param changeTree ergo tree of the change box
 * @param fee miner fee
 */
export function getChangeBoxJs(ins: any, outs: any, changeTree: string, fee: number) {
    const inVal = ins.reduce((acc: number, i: any) => acc + Number(i.value), 0)
    const outVal = outs.reduce((acc: number, i: any) => acc + Number(i.value), 0)
    const inTokens = getTokens(ins.map((i: any) => i.assets).flat().filter(((assets: any) => assets !== undefined)))
    const outTokens = getTokens(outs.map((i: any) => i.assets).flat().filter(((assets: any) => assets !== undefined)))

    const keys = new Set(Object.keys(inTokens).concat(Object.keys(outTokens)))

    keys.forEach((tokenId) => {
        if (!(tokenId in inTokens)) {
            inTokens[tokenId] = BigInt(0)
        }
        if (tokenId in outTokens) {
            inTokens[tokenId] -= outTokens[tokenId]
        }
    })
    let assets = Object.keys(inTokens).map((tokenId) => {
        return {tokenId, amount: inTokens[tokenId]}
    }).filter((i: any) => i.amount > 0)

    if (inVal - outVal - fee < 0 || Object.values(inTokens).filter((i: any) => i < 0).length > 0) {
        throw new Error('Not enough funds')
    }


    assets = assets.filter((i: any) => i.amount > 0)
    return {
        value: inVal - outVal - fee,
        ergoTree: changeTree,
        assets: assets
    }

}

/**
 * signs the tx if no secrets are needed; useful for combining contracts that require only satisfying some conditions
 * @param unsignedTx unsigned tx
 * @param boxes boxes to sign
 * @param dataInptus data inputs
 * @param ctx ErgoStateContext
 */
export function signTx(unsignedTx: UnsignedTransaction, boxes: ErgoBoxes, dataInptus: ErgoBoxes, ctx: ErgoStateContext): Transaction {
    const wallet = Wallet.from_secrets(new SecretKeys())
    return wallet.sign_transaction(ctx, unsignedTx, boxes, dataInptus)
}

/**
 * signs the tx if secrets are needed; useful for combining contracts that require satisfying all conditions
 * @param inputsJs inputs to the tx
 * @param outsJs outputs to the tx
 * @param dataInptusJs data inputs to the tx
 * @param ctx ErgoStateContext
 */
export function signTxJs(inputsJs: any, outsJs: any, dataInptusJs: any, ctx: ErgoStateContext): Transaction {
    const inVal = inputsJs.reduce((acc: number, i: any) => acc + Number(i.value), 0)
    const outVal = outsJs.reduce((acc: number, i: any) => acc + Number(i.value), 0)
    const rFee = inVal - outVal


    const unsignedTx = jsToUnsignedTx(inputsJs, outsJs, dataInptusJs, rFee)
    const boxes = ErgoBoxes.empty()
    inputsJs.forEach((i: any) => {
        const box = ErgoBox.from_json(JSONBI.stringify(i))
        boxes.add(box)
    })
    const dataInputs = ErgoBoxes.from_boxes_json(dataInptusJs)
    return signTx(unsignedTx, boxes, dataInputs, ctx)
}

export function unsignedToEip12Tx(tx: UnsignedTransaction, ins: any, dataInput: any): any {
    const txJs = tx.to_js_eip12()
    for (let i = 0; i < txJs.inputs.length; i++) {
        const prevExtension = txJs.inputs[i].extension
        txJs.inputs[i] = ErgoBox.from_json(JSONBI.stringify(ins[i])).to_js_eip12()
        if (prevExtension !== undefined)
            txJs.inputs[i].extension = prevExtension
    }
    for (let i = 0; i < txJs.outputs.length; i++)
        if (txJs.outputs[i].extension === undefined)
            txJs.outputs[i].extension = {}

    txJs.dataInputs[0] = ErgoBox.from_json(JSONBI.stringify(dataInput)).to_js_eip12()
    txJs.dataInputs[0].extension = {}

    return txJs
}

