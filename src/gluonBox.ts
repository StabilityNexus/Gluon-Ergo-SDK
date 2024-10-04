import {ErgoTree} from "ergo-lib-wasm-nodejs";
import {Serializer} from "./serializer";
import {NEUTRON_ID, PROTON_ID} from "./consts";
import {GoldOracleBox} from "./goldOracleBox";

export class GluonBox {
    boxJs: any;
    serializer: Serializer;
    qstar = BigInt(660000000)

    constructor(box: any) {
        this.boxJs = box;
        this.serializer = new Serializer();
    }

    private getRegisters = (): string[] => {
        return ['R4', 'R5', 'R6', 'R7', 'R8', 'R9'].map((reg) => {
            if (this.boxJs.additionalRegisters[reg]) {
                return this.boxJs.additionalRegisters[reg];
            }
            return '';
        }).filter((reg) => reg !== '');
    }

    /**
     * @returns {number[]} [volumePlus, volumeMinus]
     */
    getVolumePlus(): number[] {
        return this.serializer.decodeCollLong(this.getRegisters()[3])
    }

    /**
     * @returns {number[]} [volumePlus, volumeMinus]
     */
    getVolumeMinus(): number[] {
        return this.serializer.decodeCollLong(this.getRegisters()[4])
    }

    /**
     * @returns {number} last day of the epoch
     */
    getLastDay(): number {
        return Number(this.serializer.decodeJs(this.getRegisters()[5]));
    }

    /**
     * @returns {number[]} [devFee, maxFee]
     */
    getFees(): number[] {
        return this.serializer.decodeCollLong(this.getRegisters()[2]);
    }

    /**
     * @returns {ErgoTree} dev tree
     */
    getDevTree(): ErgoTree {
        return this.serializer.decodeTree(this.getRegisters()[1])
    }

    /**
     * @returns {bigint[]} [neutrons, protons]
     */
    getTotalSupply(): bigint[] {
        return this.serializer.decodeJs(this.getRegisters()[0]).map((x: any) => BigInt(x));
    }

    /**
     * @returns {bigint} neutrons in the box
     */
    getNeutrons(): bigint {
        return BigInt(this.boxJs.assets.filter((asset: any) => asset.tokenId === NEUTRON_ID)[0].amount)
    }

    /**
     * @returns {number} index of neutron in the assets array
     */
    neutronInd(): number {
        return this.boxJs.assets.findIndex((asset: any) => asset.tokenId === NEUTRON_ID)
    }

    /**
     * @returns {bigint} protons in the box
     */
    getProtons(): bigint {
        return BigInt(this.boxJs.assets.filter((asset: any) => asset.tokenId === PROTON_ID)[0].amount)
    }

    /**
     * @returns {number} index of proton in the assets array
     */
    protonInd(): number {
        return this.boxJs.assets.findIndex((asset: any) => asset.tokenId === PROTON_ID)
    }

    /**
     * @returns {bigint} neutrons circulating supply
     */
    getNeutronsCirculatingSupply(): bigint {
        return this.getTotalSupply()[0] - this.getNeutrons();
    }

    /**
     * @returns {bigint} protons circulating supply
     */
    getProtonsCirculatingSupply(): bigint {
        return this.getTotalSupply()[1] - this.getProtons();
    }

    /**
     * @returns {number} erg fissioned
     */
    getErgFissioned(): number {
        return this.boxJs.value - 1000000;
    }

    /**
     * returns the new register by adding the fee to the current fee
     * @param fee fee to add
     */
    newFeeRegister(fee: number): string {
        const current = this.getFees()
        current[0] += fee
        return this.serializer.encodeTupleLong(current[0], current[1])
    }

    /**
     * returns the new last day of the epoch
     * @param height current height of the blockchain
     */
    newLastDay(height: number): number {
        return Math.floor(height / 720) * 720;
    }

    newLastDayRegister(height: number): string {
        return this.serializer.encodeNumber(this.newLastDay(height))
    }

    fussionRatio(goldOracle: GoldOracleBox): bigint {
        const pricePerGram = goldOracle.getPricePerGram() // this is pt
        const fissionedErg = this.getErgFissioned()
        const neutronsInCirculation = this.getNeutronsCirculatingSupply()
        const rightHandMinVal = (neutronsInCirculation * BigInt(pricePerGram) / BigInt(fissionedErg))
        return rightHandMinVal < this.qstar ? rightHandMinVal : this.qstar
    }

    varPhiBeta(rErg: bigint, volumeToBeNegate: number[], volumeToMinus: number[]): bigint {
        const phi0 = BigInt(5000000)
        const phi1 = BigInt(500000000)
        const sumVolumeToBeNegate = volumeToBeNegate.reduce((acc, x) => acc + BigInt(x), BigInt(0))
        const sumVolumeToMinus = volumeToMinus.reduce((acc, x) => acc + BigInt(x), BigInt(0))
        const volume = sumVolumeToBeNegate < sumVolumeToMinus ? BigInt(0) : sumVolumeToBeNegate - sumVolumeToMinus
        return phi0 + (phi1 * volume) / rErg
    }

    protonPrice(goldOracle: GoldOracleBox): bigint {
        const protonsInCirculation = this.getProtonsCirculatingSupply()
        const fissonedErg = this.getErgFissioned()
        const fusionRatio = this.fussionRatio(goldOracle)
        const oneMinusFusionRatio = BigInt(1e9) - fusionRatio
        return (oneMinusFusionRatio * BigInt(fissonedErg)) / protonsInCirculation
    }

    private newVolume(height: number, curVolume: number[]): number[] {
        const lastDayHeight = this.getLastDay()
        const daysPassed = Math.min(Math.floor((height - lastDayHeight) / 720), 14)
        let newVol = Array.from({length: daysPassed}, () => 0).concat(curVolume)
        newVol = newVol.slice(0, 14)
        return newVol
    }

    newVolumeRegister(volume: number[]): string {
        return this.serializer.encodeCollLong(volume)
    }

    addVolume(height: number, toAdd: number): number[] {
        const curVolumePlus = this.getVolumePlus()
        const newVol = this.newVolume(height, curVolumePlus)
        newVol[0] += toAdd
        return newVol
    }

    subVolume(height: number, toDec: number): number[] {
        const curVolumeMinus = this.getVolumeMinus()
        const newVol = this.newVolume(height, curVolumeMinus)
        newVol[0] -= toDec
        return newVol
    }

}