import { Config } from "./config";
import { Gluon } from "./gluon";
import { GluonBox } from "./gluonBox";
import {JSONBI, NodeService} from "./nodeService";
import {Address, ErgoBox, ErgoTree, NetworkPrefix, SecretKey, SecretKeys, Wallet} from "ergo-lib-wasm-nodejs";


const node = new NodeService("http://95.217.180.19:9053/")
async function testFission() {
    // const userBoxJs = await node.getBoxById("227e5c293e9e3e95bd28f8af7c49127132a78baa90bcf7a67bb46dc6b52cae61")
    const userBoxJs = await node.getBoxById("cb0237c893a7a9bc568b40f35a076ba49fe06cc2104dc641fc340b40fd5dc2a6")
    const oracleBoxJs = (await node.getUnspentBoxByTokenId("3c45f29a5165b030fdb5eaf5d81f8108f9d8f507b31487dd51f4ae08fe07cf4a"))[0]
    const gluonBoxJs = (await node.getUnspentBoxByTokenId("797e331df22c5cfd0aae654703ebc12dcbcba99b80d32e2b7e151eac2d27b6fa"))[0]

    // const oracleBoxJs = await node.getBoxById("1a559a9e37335a402995607077e500b7df0cbf547f657f348e99966e7a7ac9a7")
    // const gluonBoxJs = await node.getBoxById("1e034c1382e26fafed4f70191b6dfc5e5b0b6586427f9a6b665323057e8a830d")

    const gluon = new   Gluon()
    const ctx = await node.getCtx()
    // const tx = gluon.fission(gluonBox, [userBoxJs], oracleBoxJs, Number(500e9), ctx)
    const tx = gluon.fission(gluonBoxJs, [userBoxJs], oracleBoxJs, Number(1e9))
    const txJs = tx.to_js_eip12()
    txJs.inputs[0] = ErgoBox.from_json(JSONBI.stringify(gluonBoxJs)).to_js_eip12()
    txJs.inputs[1] = ErgoBox.from_json(JSONBI.stringify(userBoxJs)).to_js_eip12()
    txJs.dataInputs[0] = ErgoBox.from_json(JSONBI.stringify(oracleBoxJs)).to_js_eip12()
    txJs.inputs[0].extension = {}
    txJs.inputs[1].extension = {}
    txJs.dataInputs[0].extension = {}
    for (let i = 0; i < txJs.outputs.length; i++)
        txJs.outputs[i].extension = {}
    // console.log(JSONBI.stringify(txJs))

    const naut = gluon.fissionForNautilus(gluonBoxJs, [userBoxJs], oracleBoxJs, Number(1e9))
    console.log(JSONBI.stringify(naut))

}

async function testFusion() {
    const userBoxJs = await node.getBoxById("28634f708595dc428cf57e32875579cfc2639ec730066b3a8bc4106a77fe922e")
    const oracleBoxJs = await node.getBoxById("6132a96c056b7a0455fb87c4fa48dfe410c298448d182d52177b6c66e4fba967")
    const gluonBoxJs = await node.getBoxById("3e255fc7c32931f924400e3f93f17af87e7374fb92dbffa33c766df4165eb546")

    // const oracleBoxJs = await node.getBoxById("1a559a9e37335a402995607077e500b7df0cbf547f657f348e99966e7a7ac9a7")
    // const gluonBoxJs = await node.getBoxById("1e034c1382e26fafed4f70191b6dfc5e5b0b6586427f9a6b665323057e8a830d")

    const gluon = new   Gluon()
    const ctx = await node.getCtx()
    // const tx = gluon.fission(gluonBox, [userBoxJs], oracleBoxJs, Number(500e9), ctx)
    const tx = gluon.fusion(gluonBoxJs, [userBoxJs], oracleBoxJs, Number(3e9))
    const txJs = tx.to_js_eip12()
    txJs.inputs[0] = ErgoBox.from_json(JSONBI.stringify(gluonBoxJs)).to_js_eip12()
    txJs.inputs[1] = ErgoBox.from_json(JSONBI.stringify(userBoxJs)).to_js_eip12()
    txJs.dataInputs[0] = ErgoBox.from_json(JSONBI.stringify(oracleBoxJs)).to_js_eip12()
    txJs.inputs[0].extension = {}
    txJs.inputs[1].extension = {}
    txJs.dataInputs[0].extension = {}
    for (let i = 0; i < txJs.outputs.length; i++)
        txJs.outputs[i].extension = {}
    // console.log(JSONBI.stringify(txJs))
    const naut = gluon.fusionForNautilus(gluonBoxJs, [userBoxJs], oracleBoxJs, Number(3e9))
    console.log(JSONBI.stringify(naut))

}

async function testBetaPlus() {
    const conf = new Config()
    const userBoxJs = await node.getBoxById("cb0237c893a7a9bc568b40f35a076ba49fe06cc2104dc641fc340b40fd5dc2a6")
    const userBoxJs2 = await node.getBoxById("684319337c3a3e3dc9de69e28feb75bec29eec3ee9bf50aecfc3a23a58911ca7")
    const oracleBuyBackJs = (await node.getUnspentBoxByTokenId(conf.ORACLE_BUYBACK_NFT))[0]
    const oracleBoxJs = (await node.getUnspentBoxByTokenId(conf.ORACLE_POOL_NFT))[0]
    const gluonBoxJs = (await node.getUnspentBoxByTokenId(conf.GLUON_NFT))[0]

    const gluon = new Gluon()
    const height = await node.getNetworkHeight()

    const protonsToTransmute = 5000000

    // const tx = gluon.betaDecayPlus(gluonBoxJs, oracleBuyBackJs, [userBoxJs], oracleBoxJs, protonsToTransmute, height)
    // const txJs = tx.to_js_eip12()
    // txJs.inputs[0] = ErgoBox.from_json(JSONBI.stringify(gluonBoxJs)).to_js_eip12()
    // txJs.inputs[1] = ErgoBox.from_json(JSONBI.stringify(userBoxJs)).to_js_eip12()
    // txJs.dataInputs[0] = ErgoBox.from_json(JSONBI.stringify(oracleBoxJs)).to_js_eip12()
    // txJs.inputs[0].extension = {}
    // txJs.inputs[1].extension = {}
    // txJs.dataInputs[0].extension = {}
    // for (let i = 0; i < txJs.outputs.length; i++)
    //     txJs.outputs[i].extension = {}
    // console.log(JSONBI.stringify(txJs))

    const naut = gluon.betaDecayPlusForNautilus(gluonBoxJs, oracleBuyBackJs, [userBoxJs], oracleBoxJs, protonsToTransmute, height)
    console.log(JSONBI.stringify(naut))

}

// testFission().then(() => console.log("done"))
// testFusion().then(() => console.log("done"))
testBetaPlus().then(() => console.log("done"))