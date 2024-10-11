import { GluonBox } from "./gluonBox";
import { getChangeBoxJs, getOutBoxJs, jsToUnsignedTx, signTxJs, unsignedToEip12Tx } from "./txUtils";
import { Config } from "./config";
import { Constant, ErgoBox, ErgoStateContext, Transaction, UnsignedTransaction } from "ergo-lib-wasm-nodejs";
import { JSONBI, NodeService } from "./nodeService";
import { GoldOracleBox } from "./goldOracleBox";

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

    private getDecayedDevFee(gluonBox: GluonBox, devFee: number): number {
        const fees = gluonBox.getFees()
        const maxFee = fees[1]
        const maxFeeMinusRepaid = BigInt(maxFee - fees[0])
        const devFeeMultiplyMaxFeeMinusRepaid = BigInt(devFee) * maxFeeMinusRepaid
        const decayed = devFeeMultiplyMaxFeeMinusRepaid / BigInt(maxFee)
        return Math.floor(Number(decayed))
    }

    /**
     * get dev fee for the transaction either fission or fusion
     * @param gluonBox
     * @param ergVal
     */
    getDevFee(gluonBox: GluonBox, ergVal: number): number {
        return this.getDecayedDevFee(gluonBox, Math.floor(Number(this.config.DEV_FEE * ergVal / 1e5)))
    }


    /**
     * get fee boxes for the transaction either fission or fusion
     * @param gluonBox - input gluon box
     * @param ergVal - erg value of the transaction
     * @param withOracleFee whether to include oracle fee or not
     */
    getFeeBoxes(gluonBox: GluonBox, ergVal: number, withOracleFee: boolean = true): { devFee?: any, uiFee?: any, oracleFee?: any } {
        const fees: { devFee?: any, uiFee?: any, oracleFee?: any } = {}
        const devFee = this.getDevFee(gluonBox, ergVal)
        fees.devFee = getOutBoxJs(this.config.DEV_TREE, devFee + this.config.MIN_FEE)
        if (this.config.UI_FEE > 0) fees.uiFee = getOutBoxJs(this.config.UI_TREE, Math.floor(Number(this.config.UI_FEE * ergVal / 1e5)) + this.config.MIN_FEE)
        if (this.config.ORACLE_FEE > 0 && withOracleFee) fees.oracleFee = getOutBoxJs(this.config.ORACLE_FEE_TREE, Math.floor(Number(this.config.ORACLE_FEE * ergVal / 1e5)) + this.config.MIN_FEE)
        return fees
    }

    /**
     * Get total fee amounts required for the Fission transaction
     * @param gluonBox - input gluon box
     * @param ergToFission - erg value for fission
     * @returns An object containing the following fee amounts:
     * - devFee: The fee for the developer
     * - uiFee: The fee for the UI (if applicable)
     * - oracleFee: The fee for the oracle (always 0 for fission)
     * - totalFee: The sum of all fees
     */
    getTotalFeeAmountFission(gluonBox: GluonBox, ergToFission: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const feeBoxes = this.getFeeBoxes(gluonBox, ergToFission, false);
        const devFee = feeBoxes.devFee?.value || 0;
        const uiFee = feeBoxes.uiFee?.value || 0;
        const oracleFee = 0;
        const totalFee = devFee + uiFee + oracleFee;
        return { devFee, uiFee, oracleFee, totalFee };
    }

    /**
     * Get fee percentages for the Fission transaction
     * @param gluonBox - input gluon box
     * @param ergToFission - erg value for fission
     * @returns An object containing the following fee percentages:
     * - devFee: The fee percentage for the developer
     * - uiFee: The fee percentage for the UI (if applicable)
     * - oracleFee: The fee percentage for the oracle (always 0 for fission)
     * - totalFee: The total fee percentage
    */
    getFeePercentageFission(gluonBox: GluonBox, ergToFission: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const fees = this.getTotalFeeAmountFission(gluonBox, ergToFission)
        return {
            devFee: fees.devFee / ergToFission,
            uiFee: fees.uiFee / ergToFission,
            oracleFee: fees.oracleFee / ergToFission,
            totalFee: fees.totalFee / ergToFission
        }
    }

    /**
     * Get total fee amounts required for the Fusion transaction
     * @param ergToFusion - erg value for fusion
     * @param gluonBox - input gluon box
     * @returns An object containing the following fee amounts:
     * - devFee: The fee for the developer
     * - uiFee: The fee for the UI (if applicable)
     * - oracleFee: The fee for the oracle (always 0 for fusion)
     * - totalFee: The sum of all fees
     */
    getTotalFeeAmountFusion(gluonBox: GluonBox, ergToFusion: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const feeBoxes = this.getFeeBoxes(gluonBox, ergToFusion, false);
        const devFee = feeBoxes.devFee?.value || 0;
        const uiFee = feeBoxes.uiFee?.value || 0;
        const oracleFee = 0;
        const totalFee = devFee + uiFee + oracleFee;
        return { devFee, uiFee, oracleFee, totalFee };
    }

    /**
     * Get fee percentages for the Fusion transaction
     * @param gluonBox - input gluon box
     * @param ergToFusion - erg value for fusion
     * @returns An object containing the following fee percentages:
     * - devFee: The fee percentage for the developer
     * - uiFee: The fee percentage for the UI (if applicable)
     * - oracleFee: The fee percentage for the oracle (always 0 for fusion)
     * - totalFee: The total fee percentage
    */
    getFeePercentageFusion(gluonBox: GluonBox, ergToFusion: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const fees = this.getTotalFeeAmountFusion(gluonBox, ergToFusion)
        return {
            devFee: fees.devFee / ergToFusion,
            uiFee: fees.uiFee / ergToFusion,
            oracleFee: fees.oracleFee / ergToFusion,
            totalFee: fees.totalFee / ergToFusion
        }
    }

    /**
     * Get total fee amounts required for the Transmute to Gold transaction
     * @param gluonBox - input gluon box
     * @param goldOracleBox - gold oracle box
     * @param protonsToTransmute - number of protons to transmute
     * @returns An object containing the following fee amounts:
     * - devFee: The fee for the developer
     * - uiFee: The fee for the UI (if applicable)
     * - oracleFee: The fee for the oracle
     * - totalFee: The sum of all fees
     */
    getTotalFeeAmountTransmuteToGold(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, protonsToTransmute: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const protonVol = (gluonBox.protonPrice(goldOracleBox) * BigInt(protonsToTransmute)) / BigInt(1e9);
        const feeBoxes = this.getFeeBoxes(gluonBox, Number(protonVol), true);
        const devFee = feeBoxes.devFee?.value || 0;
        const uiFee = feeBoxes.uiFee?.value || 0;
        const oracleFee = feeBoxes.oracleFee?.value || 0;
        const totalFee = devFee + uiFee + oracleFee;
        return { devFee, uiFee, oracleFee, totalFee };
    }

    /**
     * Get fee percentages for the Transmute to Gold transaction
     * @param gluonBox - input gluon box
     * @param goldOracleBox - gold oracle box
     * @param protonsToTransmute - number of protons to transmute
     * @returns An object containing the following fee percentages:
     * - devFee: The fee percentage for the developer
     * - uiFee: The fee percentage for the UI (if applicable)
     * - oracleFee: The fee percentage for the oracle
     * - totalFee: The total fee percentage
    */
    getFeePercentageTransmuteToGold(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, protonsToTransmute: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const fees = this.getTotalFeeAmountTransmuteToGold(gluonBox, goldOracleBox, protonsToTransmute)
        const protonVol = (gluonBox.protonPrice(goldOracleBox) * BigInt(protonsToTransmute)) / BigInt(1e9);
        return {
            devFee: fees.devFee / Number(protonVol),
            uiFee: fees.uiFee / Number(protonVol),
            oracleFee: fees.oracleFee / Number(protonVol),
            totalFee: fees.totalFee / Number(protonVol)
        }
    }

    /**
     * Get total fee amounts required for the Transmute from Gold transaction
     * @param gluonBox - input gluon box
     * @param goldOracleBox - gold oracle box
     * @param neutronsToDecay - number of neutrons to decay
     * @returns An object containing the following fee amounts:
     * - devFee: The fee for the developer
     * - uiFee: The fee for the UI (if applicable)
     * - oracleFee: The fee for the oracle
     * - totalFee: The sum of all fees
     */
    getTotalFeeAmountTransmuteFromGold(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, neutronsToDecay: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const neutronVol = (gluonBox.neutronPrice(goldOracleBox) * BigInt(neutronsToDecay)) / BigInt(1e9);
        const feeBoxes = this.getFeeBoxes(gluonBox, Number(neutronVol), true);
        const devFee = feeBoxes.devFee?.value || 0;
        const uiFee = feeBoxes.uiFee?.value || 0;
        const oracleFee = feeBoxes.oracleFee?.value || 0;
        const totalFee = devFee + uiFee + oracleFee;
        return { devFee, uiFee, oracleFee, totalFee };
    }

    /**
     * Get fee percentages for the Transmute from Gold transaction
     * @param gluonBox - input gluon box
    //  * @param goldOracleBox - gold oracle box
     * @param neutronsToDecay - number of neutrons to decay
     * @returns An object containing the following fee percentages:
     * - devFee: The fee percentage for the developer
     * - uiFee: The fee percentage for the UI (if applicable)
     * - oracleFee: The fee percentage for the oracle
    */
    getFeePercentageTransmuteFromGold(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, neutronsToDecay: number): { devFee: number, uiFee: number, oracleFee: number, totalFee: number } {
        const fees = this.getTotalFeeAmountTransmuteFromGold(gluonBox, goldOracleBox, neutronsToDecay)
        const neutronVol = (gluonBox.neutronPrice(goldOracleBox) * BigInt(neutronsToDecay)) / BigInt(1e9);
        return {
            devFee: fees.devFee / Number(neutronVol),
            uiFee: fees.uiFee / Number(neutronVol),
            oracleFee: fees.oracleFee / Number(neutronVol),
            totalFee: fees.totalFee / Number(neutronVol)
        }
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
        return { neutrons: outNeutronsAmount, protons: outProtonsAmount }
    }

    /**
     * returns fission transaction in the form of UnsignedTransaction
     * change will be sent to the first user box
     * @param gluonBox - gluon box
     * @param userBoxes - user boxes
     * @param oracle - oracle box
     * @param ergToFission - erg value of the fission transaction (user request)
     */
    fission(gluonBox: GluonBox, oracle: GoldOracleBox, userBoxes: any, ergToFission: number): UnsignedTransaction {
        const willGet = this.fissionWillGet(gluonBox, ergToFission)
        const outNeutronsAmount = willGet.neutrons
        const outProtonsAmount = willGet.protons

        const fees = this.getFeeBoxes(gluonBox, ergToFission, false)

        const outGluonBoxJs = JSONBI.parse(JSONBI.stringify(gluonBox.boxJs))
        const neutInd = gluonBox.neutronInd()
        const protInd = gluonBox.protonInd()
        outGluonBoxJs.assets[neutInd].amount -= BigInt(outNeutronsAmount)
        outGluonBoxJs.assets[protInd].amount -= BigInt(outProtonsAmount)
        outGluonBoxJs.value += ergToFission
        outGluonBoxJs.additionalRegisters.R6 = gluonBox.newFeeRegister(this.getDevFee(gluonBox, ergToFission))

        const feeBoxesArray = Object.values(fees).filter(Boolean)
        const userOutBox = getChangeBoxJs((userBoxes.concat([gluonBox.boxJs])), feeBoxesArray.concat([outGluonBoxJs]), userBoxes[0].ergoTree, this.config.MINER_FEE)
        const outs = [outGluonBoxJs, userOutBox].concat(feeBoxesArray)
        const ins = [gluonBox.boxJs].concat(userBoxes)
        return jsToUnsignedTx(ins, outs, [oracle.boxJs], this.config.MINER_FEE)
    }

    /**
     * returns fission transaction in the form of json which could be used in the Eip12 wallet without needing change
     * @param gluonBox - gluon box
     * @param oracle - oracle box
     * @param userBoxes - user boxes
     * @param ergToFission - erg value of the fission transaction (user request)
     */
    fissionForEip12(gluonBox: GluonBox, oracle: GoldOracleBox, userBoxes: any, ergToFission: number): any {
        let tx = this.fission(gluonBox, oracle, userBoxes, ergToFission)
        return unsignedToEip12Tx(tx, [gluonBox.boxJs].concat(userBoxes), oracle.boxJs)
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
        return { neutrons: inNeutronsAmount, protons: inProtonsAmount }
    }

    /**
     * returns fusion transaction in the form of UnsignedTransaction
     * change will be sent to the first user box
     * @param gluonBox - input gluon box
     * @param oracle - oracle box
     * @param userBoxes - user boxes
     * @param ergToRedeem - erg value of the fusion transaction (user request)
     */
    fusion(gluonBox: GluonBox, oracle: GoldOracleBox, userBoxes: any, ergToRedeem: number): UnsignedTransaction {
        const willNeed = this.fusionWillNeed(gluonBox, ergToRedeem)
        const inNeutronsAmount = willNeed.neutrons
        const inProtonsAmount = willNeed.protons

        const fees = this.getFeeBoxes(gluonBox, ergToRedeem, false)

        const outGluonBoxJs = JSONBI.parse(JSONBI.stringify(gluonBox.boxJs))
        const neutInd = gluonBox.neutronInd()
        const protInd = gluonBox.protonInd()
        outGluonBoxJs.assets[neutInd].amount += BigInt(inNeutronsAmount)
        outGluonBoxJs.assets[protInd].amount += BigInt(inProtonsAmount)
        outGluonBoxJs.value -= ergToRedeem
        outGluonBoxJs.additionalRegisters.R6 = gluonBox.newFeeRegister(this.getDevFee(gluonBox, ergToRedeem))

        const feeBoxesArray = Object.values(fees).filter(Boolean)
        const userOutBox = getChangeBoxJs((userBoxes.concat([gluonBox.boxJs])), feeBoxesArray.concat([outGluonBoxJs]), userBoxes[0].ergoTree, this.config.MINER_FEE)
        const outs = [outGluonBoxJs, userOutBox].concat(feeBoxesArray)
        const ins = [gluonBox.boxJs].concat(userBoxes)
        return jsToUnsignedTx(ins, outs, [oracle.boxJs], this.config.MINER_FEE)
    }

    /**
     * returns fusion transaction in the form of json which could be used in the Eip12 wallet without needing change
     * @param gluonBox - gluon box
     * @param oracle - oracle box
     * @param userBoxes - user boxes
     * @param ergToFusion - erg value of the fusion transaction (user request)
     */
    fusionForEip12(gluonBox: GluonBox, oracle: GoldOracleBox, userBoxes: any, ergToFusion: number): any {
        let tx = this.fusion(gluonBox, oracle, userBoxes, ergToFusion)
        return unsignedToEip12Tx(tx, [gluonBox.boxJs].concat(userBoxes), oracle.boxJs)
    }

    /**
     * returns the amount of Neutrons that will be received by transmuting protons
     * @param gluonBox - input gluon box
     * @param goldOracleBox - oracle box
     * @param protonsToTransmute - number of protons to transmute
     * @param height - current height
     */
    transmuteToGoldWillGet(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, protonsToTransmute: number, height: number): number {
        const protonVol = (gluonBox.protonPrice(goldOracleBox) * BigInt(protonsToTransmute)) / BigInt(1e9)
        const volPlus = gluonBox.addVolume(height, Number(protonVol))
        const volMinus = gluonBox.subVolume(height, 0)
        const circProtons = gluonBox.getProtonsCirculatingSupply()
        const circNeutrons = gluonBox.getNeutronsCirculatingSupply()

        const fusionRatio = gluonBox.fusionRatio(goldOracleBox)
        const fusionRatioMin = BigInt(1e9) - fusionRatio
        const phiBetaMin = BigInt(1e9) - gluonBox.varPhiBeta(BigInt(gluonBox.getErgFissioned()), volPlus, volMinus)

        const ratio1 = (BigInt(protonsToTransmute) * phiBetaMin) / circProtons
        const ratio2 = (fusionRatioMin * circNeutrons) / BigInt(1e9)
        return Number((ratio1 * ratio2) / fusionRatio)
    }

    /**
     * returns the transaction in the form of UnsignedTransaction for transmuting protons to neutrons
     * @param gluonBox - input gluon box
     * @param goldOracleBox - oracle box
     * @param userBoxes - user boxes
     * @param buybackBoxJs - buyback box
     * @param protonsToTransmute - number of protons to transmute
     * @param height - current height of the network
     */
    transmuteToGold(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, userBoxes: any, buybackBoxJs: any, protonsToTransmute: number, height: number): UnsignedTransaction {
        const outNeutronsAmount = this.transmuteToGoldWillGet(gluonBox, goldOracleBox, protonsToTransmute, height)

        const protonErgs = (gluonBox.protonPrice(goldOracleBox) * BigInt(protonsToTransmute)) / BigInt(1e9)
        const volPlus = gluonBox.addVolume(height, Number(protonErgs))
        const volMinus = gluonBox.subVolume(height, 0)

        const fees = this.getFeeBoxes(gluonBox, Number(protonErgs))
        const buyBackFee = fees.oracleFee || {}
        buyBackFee.value = (buyBackFee.value || 0) + buybackBoxJs.value
        buyBackFee.assets = buybackBoxJs.assets

        const outGluonBoxJs = JSONBI.parse(JSONBI.stringify(gluonBox.boxJs))
        outGluonBoxJs.assets[gluonBox.neutronInd()].amount -= BigInt(outNeutronsAmount)
        outGluonBoxJs.assets[gluonBox.protonInd()].amount += BigInt(protonsToTransmute)
        outGluonBoxJs.additionalRegisters.R6 = gluonBox.newFeeRegister(this.getDevFee(gluonBox, Number(protonErgs)))
        outGluonBoxJs.additionalRegisters.R7 = gluonBox.newVolumeRegister(volPlus)
        outGluonBoxJs.additionalRegisters.R8 = gluonBox.newVolumeRegister(volMinus)
        outGluonBoxJs.additionalRegisters.R9 = gluonBox.newLastDayRegister(height)

        const feeBoxesArray = Object.values(fees).filter(Boolean)
        const userOutBox = getChangeBoxJs((userBoxes.concat([gluonBox.boxJs, buybackBoxJs])), feeBoxesArray.concat([outGluonBoxJs]), userBoxes[0].ergoTree, this.config.MINER_FEE)
        const outs = [outGluonBoxJs, userOutBox, buyBackFee].concat(feeBoxesArray.filter(box => box !== fees.oracleFee))
        const ins = [gluonBox.boxJs].concat(userBoxes).concat([buybackBoxJs])
        const tx = jsToUnsignedTx(ins, outs, [goldOracleBox.boxJs], this.config.MINER_FEE, height)
        const txJs = tx.to_js_eip12()
        txJs.inputs[txJs.inputs.length - 1].extension = {
            "0": "0402"
        }
        return UnsignedTransaction.from_json(JSON.stringify(txJs))
    }

    /**
     * returns the transaction in Eip12 (for use in for example Nautilus) format for transmuting protons to neutrons
     * @param gluonBox - input gluon box
     * @param oracle - oracle box
     * @param userBoxes - user boxes
     * @param buybackBoxJs - buyback box
     * @param protonsToTransmute - number of protons to transmute
     * @param height - current height of the blockchain
     */
    transmuteToGoldForEip12(gluonBox: GluonBox, oracle: GoldOracleBox, userBoxes: any, buybackBoxJs: any, protonsToTransmute: number, height: number): any {
        let tx = this.transmuteToGold(gluonBox, oracle, userBoxes, buybackBoxJs, protonsToTransmute, height)
        return unsignedToEip12Tx(tx, [gluonBox.boxJs].concat(userBoxes).concat([buybackBoxJs]), oracle.boxJs)
    }

    /**
     * returns the amount of protons that will be received by decaying neutrons
     * @param gluonBox - input gluon box
     * @param goldOracleBox - oracle box
     * @param neutronsToDecay - number of neutrons to decay
     * @param height - current height of the blockchain
     */
    transmuteFromGoldWillGet(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, neutronsToDecay: number, height: number): number {
        const neutronVol = (gluonBox.neutronPrice(goldOracleBox) * BigInt(neutronsToDecay)) / BigInt(1e9)
        const volPlus = gluonBox.addVolume(height, 0)
        const volMinus = gluonBox.subVolume(height, Number(neutronVol))
        const circProtons = gluonBox.getProtonsCirculatingSupply()
        const circNeutrons = gluonBox.getNeutronsCirculatingSupply()

        const fusionRatio = gluonBox.fusionRatio(goldOracleBox)
        const fusionRatioMin = BigInt(1e9) - fusionRatio
        const phiBetaMin = BigInt(1e9) - gluonBox.varPhiBeta(BigInt(gluonBox.getErgFissioned()), volMinus, volPlus)

        const ratio1 = (BigInt(neutronsToDecay) * phiBetaMin) / circNeutrons
        const ratio2 = (fusionRatio * circProtons) / BigInt(1e9)
        return Number((ratio1 * ratio2) / fusionRatioMin)
    }

    /**
     * returns the transaction in the form of UnsignedTransaction for decaying neutrons to protons
     * @param gluonBox - input gluon box
     * @param goldOracleBox - oracle box
     * @param userBoxes - user boxes
     * @param buybackBoxJs - buyback box
     * @param neutronsToDecay - number of neutrons to decay
     * @param height - current height of the blockchain
     */
    transmuteFromGold(gluonBox: GluonBox, goldOracleBox: GoldOracleBox, userBoxes: any, buybackBoxJs: any, neutronsToDecay: number, height: number): UnsignedTransaction {
        const outProtonAmount = this.transmuteFromGoldWillGet(gluonBox, goldOracleBox, neutronsToDecay, height)

        const neutronsErgs = (gluonBox.neutronPrice(goldOracleBox) * BigInt(neutronsToDecay)) / BigInt(1e9)
        const volPlus = gluonBox.addVolume(height, 0)
        const volMinus = gluonBox.subVolume(height, Number(neutronsErgs))

        const feesJs = this.getFeeBoxes(gluonBox, Number(neutronsErgs))
        const fees = Object.values(feesJs).filter(Boolean)
        const buyBackFee = fees[fees.length - 1]
        buyBackFee.value += buybackBoxJs.value
        buyBackFee.assets = buybackBoxJs.assets

        const outGluonBoxJs = JSONBI.parse(JSONBI.stringify(gluonBox.boxJs))
        outGluonBoxJs.assets[gluonBox.neutronInd()].amount += BigInt(neutronsToDecay)
        outGluonBoxJs.assets[gluonBox.protonInd()].amount -= BigInt(outProtonAmount)
        outGluonBoxJs.additionalRegisters.R6 = gluonBox.newFeeRegister(this.getDevFee(gluonBox, Number(neutronsErgs)))
        outGluonBoxJs.additionalRegisters.R7 = gluonBox.newVolumeRegister(volPlus)
        outGluonBoxJs.additionalRegisters.R8 = gluonBox.newVolumeRegister(volMinus)
        outGluonBoxJs.additionalRegisters.R9 = gluonBox.newLastDayRegister(height)

        const userOutBox = getChangeBoxJs((userBoxes.concat([gluonBox.boxJs, buybackBoxJs])), fees.concat([outGluonBoxJs]), userBoxes[0].ergoTree, this.config.MINER_FEE)
        const outs = [outGluonBoxJs, userOutBox, buyBackFee].concat(fees.slice(0, fees.length - 1))
        const ins = [gluonBox.boxJs].concat(userBoxes).concat([buybackBoxJs])
        const tx = jsToUnsignedTx(ins, outs, [goldOracleBox.boxJs], this.config.MINER_FEE, height)
        const txJs = tx.to_js_eip12()
        txJs.inputs[txJs.inputs.length - 1].extension = {
            "0": "0402"
        }
        return UnsignedTransaction.from_json(JSON.stringify(txJs))
    }

    /**
     * returns the transaction in Eip12 (for use in for example Nautilus) format for decaying neutrons to protons
     * @param gluonBox - gluon box
     * @param oracle - oracle box
     * @param userBoxes - user boxes
     * @param buybackBoxJs - buyback box
     * @param neutronsToDecay - number of neutrons to decay
     * @param height - current height of the blockchain
     */
    transmuteFromGoldForEip12(gluonBox: GluonBox, oracle: GoldOracleBox, userBoxes: any, buybackBoxJs: any, neutronsToDecay: number, height: number): any {
        let tx = this.transmuteFromGold(gluonBox, oracle, userBoxes, buybackBoxJs, neutronsToDecay, height)
        return unsignedToEip12Tx(tx, [gluonBox.boxJs].concat(userBoxes).concat([buybackBoxJs]), oracle.boxJs)
    }

    /**
     * get the current unspent gold oracle box
     * works only if valid NODE_URL is set in the config
     */
    async getGoldOracleBox(): Promise<GoldOracleBox> {
        if (!this.config.NODE_URL) throw new Error('NODE_URL is not set')
        const oracleJs = await this.nodeService.getUnspentBoxByTokenId(this.config.ORACLE_POOL_NFT)
        return new GoldOracleBox(oracleJs[0])
    }

    /**
     * get the current unspent gluon box
     * works only if valid NODE_URL is set in the config
     */
    async getGluonBox(): Promise<GluonBox> {
        if (!this.config.NODE_URL) throw new Error('NODE_URL is not set')
        const gluonJs = await this.nodeService.getUnspentBoxByTokenId(this.config.GLUON_NFT)
        return new GluonBox(gluonJs[0])
    }

    async getOracleBuyBackBoxJs(): Promise<any> {
        if (!this.config.NODE_URL) throw new Error('NODE_URL is not set')
        const buybackJs = await this.nodeService.getUnspentBoxByTokenId(this.config.ORACLE_BUYBACK_NFT)
        return buybackJs[0]
    }
}