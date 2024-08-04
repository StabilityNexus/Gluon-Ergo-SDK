import {GluonBox} from "./gluonBox";
import {getChangeBoxJs, getOutBoxJs, jsToUnsignedTx, signTxJs} from "./txUtils";
import {Config} from "./config";
import {ErgoBox, ErgoStateContext, Transaction, UnsignedTransaction} from "ergo-lib-wasm-nodejs";
import {JSONBI, NodeService} from "./nodeService";

export class Gluon {
    config: Config;
    nodeService: NodeService

    /**
     * creates Gluon instance to interact with the protocol
     * @param gluonConfig - configuration for the Gluon instance
     */
    constructor(gluonConfig: Config = new Config()) {
        this.config = gluonConfig;
        this.nodeService = new NodeService(this.config.NODE_URL)
    }

    private getDecayedDevFee(devFee: number, gluonBox: GluonBox): number {
        const fees = gluonBox.getFees()
        const maxFee = fees[1]
        const maxFeeMinusRepaid = BigInt(maxFee - fees[0])
        const devFeeMultiplyMaxFeeMinusRepaid = BigInt(devFee) * maxFeeMinusRepaid
        const decayed = devFeeMultiplyMaxFeeMinusRepaid / BigInt(maxFee)
        return Math.floor(Number(decayed))
    }

    /**
     * get dev fee for the transaction either fission or fusion
     * @param ergVal
     * @param gluonBox
     */
    getDevFee(ergVal: number, gluonBox: GluonBox): number {
        return this.getDecayedDevFee(Math.floor(Number(this.config.DEV_FEE * ergVal / 1e5)), gluonBox)
    }

    /**
     * get fee boxes for the transaction either fission or fusion
     * @param ergVal - erg value of the transaction
     * @param gluonBox - input gluon box
     */
    getFeeBoxes(ergVal: number, gluonBox: GluonBox): any[] {
        const devFee = this.getDevFee(ergVal, gluonBox)
        const fees = [getOutBoxJs(this.config.DEV_TREE, devFee + this.config.MIN_FEE)]
        if (this.config.UI_FEE > 0) fees.push(getOutBoxJs(this.config.UI_TREE, Math.floor(Number(this.config.UI_FEE * ergVal / 1e5)) + this.config.MIN_FEE))
        if (this.config.ORACLE_FEE > 0) fees.push(getOutBoxJs(this.config.ORACLE_FEE_TREE, Math.floor(Number(this.config.ORACLE_FEE * ergVal / 1e5)) + this.config.MIN_FEE))
        return fees
    }

    /**
     * get total fee amount required for the transaction either fission or fusion
     * @param ergVal - erg value of the transaction
     * @param gluonBox - input gluon box
     */
    getTotalFeeAmount(ergVal: number, gluonBox: GluonBox): number {
        return this.getFeeBoxes(ergVal, gluonBox).reduce((acc, i) => acc + i.value, 0)
    }

    /**
     * get amount of neutrons and protons that will be received after fission
     * @param gluonBox - input gluon box
     * @param ergToFission - erg value of the fission transaction (user request)
     */
    fissionWillGet(gluonBox: GluonBox, ergToFission: number): { neutrons: number, protons: number } {
        const sNeutrons = gluonBox.getNeutronsCirculatingSupply()
        const sProtons = gluonBox.getProtonsCirculatingSupply()
        const ergFissioned = gluonBox.getErgFissioned()
        const outNeutronsAmount = Number((BigInt(ergToFission) * BigInt(sNeutrons) * ((BigInt(1e9) - BigInt(1e6))) / BigInt(ergFissioned)) / BigInt(1e9))
        const outProtonsAmount = Number((BigInt(ergToFission) * BigInt(sProtons) * ((BigInt(1e9) - BigInt(1e6))) / BigInt(ergFissioned)) / BigInt(1e9))
        return {neutrons: outNeutronsAmount, protons: outProtonsAmount}
    }

    /**
     * returns fission transaction in the form of UnsignedTransaction
     * change will be sent to the first user box
     * @param gluonBoxJs - input gluon box
     * @param userBoxes - user boxes
     * @param oracle - oracle box
     * @param ergToFission - erg value of the fission transaction (user request)
     */
    fission(gluonBoxJs: any, userBoxes: any, oracle: any, ergToFission: number): UnsignedTransaction {
        const gluonBox = new GluonBox(gluonBoxJs)
        const willGet = this.fissionWillGet(gluonBox, ergToFission)
        const outNeutronsAmount = willGet.neutrons
        const outProtonsAmount = willGet.protons

        const fees = this.getFeeBoxes(ergToFission, gluonBox)

        const outGluonBoxJs = JSONBI.parse(JSONBI.stringify(gluonBox.boxJs))
        const neutInd = gluonBox.neutronInd()
        const protInd = gluonBox.protonInd()
        outGluonBoxJs.assets[neutInd].amount -= BigInt(outNeutronsAmount)
        outGluonBoxJs.assets[protInd].amount -= BigInt(outProtonsAmount)
        outGluonBoxJs.value += ergToFission
        outGluonBoxJs.additionalRegisters.R6 = gluonBox.newFeeRegister(this.getDevFee(ergToFission, gluonBox))

        const userOutBox = getChangeBoxJs((userBoxes.concat([gluonBox.boxJs])), fees.concat([outGluonBoxJs]), userBoxes[0].ergoTree, this.config.MINER_FEE)
        const outs = [outGluonBoxJs, userOutBox].concat(fees)
        const ins = [gluonBox.boxJs].concat(userBoxes)
        return jsToUnsignedTx(ins, outs, [oracle], this.config.MINER_FEE)
    }

    private unsignedToNautilusTx(tx: UnsignedTransaction, ins: any, oracle: any): any {
        const txJs = tx.to_js_eip12()
        for (let i = 0; i < txJs.inputs.length; i++) {
            txJs.inputs[i] = ErgoBox.from_json(JSONBI.stringify(ins[i])).to_js_eip12()
            txJs.inputs[i].extension = {}
        }
        for (let i = 0; i < txJs.outputs.length; i++)
            txJs.outputs[i].extension = {}

        txJs.dataInputs[0] = ErgoBox.from_json(JSONBI.stringify(oracle)).to_js_eip12()
        txJs.dataInputs[0].extension = {}

        return txJs

    }

    /**
     * returns fission transaction in the form of json which could be used in the Nautilus wallet without needing change
     * @param gluonBoxJs - input gluon box
     * @param userBoxes - user boxes
     * @param oracle - oracle box
     * @param ergToFission - erg value of the fission transaction (user request)
     */
    fissionForNautilus(gluonBoxJs: any, userBoxes: any, oracle: any, ergToFission: number): any {
        let tx = this.fission(gluonBoxJs, userBoxes, oracle, ergToFission)
        return this.unsignedToNautilusTx(tx, [gluonBoxJs].concat(userBoxes), oracle)
    }

    /**
     * get amount of neutrons and protons that will be needed for fusion of ergToRedeem amount
     * @param gluonBox - input gluon box
     * @param ergToRedeem - erg value of the fusion transaction (user request)
     */
    fusionWillNeed(gluonBox: GluonBox, ergToRedeem: number): { neutrons: number, protons: number } {
        const sNeutrons = gluonBox.getNeutronsCirculatingSupply()
        const sProtons = gluonBox.getProtonsCirculatingSupply()
        const ergFissioned = gluonBox.getErgFissioned()
        const inNeutronsNumerator = BigInt(ergToRedeem) * BigInt(sNeutrons) * BigInt(1e9)
        const inProtonsNumerator = BigInt(ergToRedeem) * BigInt(sProtons) * BigInt(1e9)
        const denominator = BigInt(ergFissioned) * (BigInt(1e9) - BigInt(5e6))
        const inNeutronsAmount = Number(inNeutronsNumerator / denominator)
        const inProtonsAmount = Number(inProtonsNumerator / denominator)
        return {neutrons: inNeutronsAmount, protons: inProtonsAmount}
    }

    /**
     * returns fusion transaction in the form of UnsignedTransaction
     * change will be sent to the first user box
     * @param gluonBoxJs - input gluon box
     * @param userBoxes - user boxes
     * @param oracle - oracle box
     * @param ergToRedeem - erg value of the fusion transaction (user request)
     */
    fusion(gluonBoxJs: any, userBoxes: any, oracle: any, ergToRedeem: number): UnsignedTransaction {
        const gluonBox = new GluonBox(gluonBoxJs)
        const willNeed = this.fusionWillNeed(gluonBox, ergToRedeem)
        const inNeutronsAmount = willNeed.neutrons
        const inProtonsAmount = willNeed.protons

        const fees = this.getFeeBoxes(ergToRedeem, gluonBox)

        const outGluonBoxJs = JSONBI.parse(JSONBI.stringify(gluonBox.boxJs))
        const neutInd = gluonBox.neutronInd()
        const protInd = gluonBox.protonInd()
        outGluonBoxJs.assets[neutInd].amount += BigInt(inNeutronsAmount)
        outGluonBoxJs.assets[protInd].amount += BigInt(inProtonsAmount)
        outGluonBoxJs.value -= ergToRedeem
        outGluonBoxJs.additionalRegisters.R6 = gluonBox.newFeeRegister(this.getDevFee(ergToRedeem, gluonBox))

        const userOutBox = getChangeBoxJs((userBoxes.concat([gluonBox.boxJs])), fees.concat([outGluonBoxJs]), userBoxes[0].ergoTree, this.config.MINER_FEE)
        const outs = [outGluonBoxJs, userOutBox].concat(fees)
        const ins = [gluonBox.boxJs].concat(userBoxes)
        return jsToUnsignedTx(ins, outs, [oracle], this.config.MINER_FEE)
    }

    /**
     * returns fusion transaction in the form of json which could be used in the Nautilus wallet without needing change
     * @param gluonBoxJs - input gluon box
     * @param userBoxes - user boxes
     * @param oracle - oracle box
     * @param ergToFusion - erg value of the fusion transaction (user request)
     */
    fusionForNautilus(gluonBoxJs: any, userBoxes: any, oracle: any, ergToFusion: number): any {
        let tx = this.fusion(gluonBoxJs, userBoxes, oracle, ergToFusion)
        return this.unsignedToNautilusTx(tx, [gluonBoxJs].concat(userBoxes), oracle)
    }

    /**
     * get the current unspent gold oracle box
     * works only if valid NODE_URL is set in the config
     */
    getGoldOracleBox(): Promise<any> {
        if (!this.config.NODE_URL) throw new Error('NODE_URL is not set')
        return this.nodeService.getUnspentBoxByTokenId(this.config.ORACLE_POOL_NFT)
    }

    /**
     * get the current unspent gluon box
     * works only if valid NODE_URL is set in the config
     */
    getGluonBox(): Promise<any> {
        if (!this.config.NODE_URL) throw new Error('NODE_URL is not set')
        return this.nodeService.getUnspentBoxByTokenId(this.config.GLUON_NFT)
    }
}