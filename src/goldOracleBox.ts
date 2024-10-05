import {ErgoTree} from "ergo-lib-wasm-nodejs";
import {Serializer} from "./serializer";
import {NEUTRON_ID, PROTON_ID} from "./consts";

export class GoldOracleBox {
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
     * returns gold price for 1 kg
     */
    getPrice(): number {
        return Number(this.serializer.decodeJs(this.getRegisters()[0]));
    }

    /**
     * returns gold price for 1 gram
     */
    getPricePerGram(): number {
        return Math.floor(this.getPrice() / 1000);
    }


}