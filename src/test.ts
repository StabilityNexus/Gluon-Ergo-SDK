import { Config } from "./config";
import { Gluon } from "./gluon";
import { GluonBox } from "./gluonBox";
import {JSONBI, NodeService} from "./nodeService";
import {Address, ErgoBox, ErgoTree, NetworkPrefix, SecretKey, SecretKeys, Wallet} from "ergo-lib-wasm-nodejs";


const node = new NodeService("http://95.217.180.19:9053/")
async function testFission() {
    const userBoxJs = await node.getBoxById("1feca4a699de794d479e69d84a2ede9ee9bd7c933fea0655e5e88b7948b03cd2")
    const oracleBoxJs = await node.getBoxById("33e5146c8ba9faf70e049723995f1bb05a6d0472c67df3d78c913fa4b39f87c2")
    const gluonBoxJs = await node.getBoxById("8c73814efbfc8b41ef29228d8d6b5b3c90ab78e5bc7c83f3bcdbc1b4988ba4b4")

    // const oracleBoxJs = await node.getBoxById("1a559a9e37335a402995607077e500b7df0cbf547f657f348e99966e7a7ac9a7")
    // const gluonBoxJs = await node.getBoxById("1e034c1382e26fafed4f70191b6dfc5e5b0b6586427f9a6b665323057e8a830d")

    const gluon = new   Gluon()
    const ctx = await node.getCtx()
    // const tx = gluon.fission(gluonBox, [userBoxJs], oracleBoxJs, Number(500e9), ctx)
    const tx = gluon.fission(gluonBoxJs, [userBoxJs], oracleBoxJs, Number(5e9))
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

    const naut = gluon.fissionForNautilus(gluonBoxJs, [userBoxJs], oracleBoxJs, Number(5e9))
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

// testFission().then(() => console.log("done"))
testFusion().then(() => console.log("done"))
