import {ErgoTree} from "ergo-lib-wasm-nodejs";
import {Serializer} from "./serializer";
import {NEUTRON_ID, PROTON_ID} from "./consts";

export class GluonBox {
    boxJs: any;
    serializer: Serializer;

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
    newLastDay(height: number): string {
        const h = Number(1322477 / 720) * 720
        return this.serializer.encodeNumber(h)
    }
}