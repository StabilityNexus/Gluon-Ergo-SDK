import {
    NETWORK,
    MINER_FEE,
    MIN_BOX_VAL,
    DEV_TREE,
    ORACLE_FEE_TREE,
    ORACLE_BUYBACK_NFT,
    ORACLE_POOL_NFT,
    GLUON_NFT,
    NEUTRON_ID,
    PROTON_ID,
    GLUON_TREE,
    DEV_FEE,
    ORACLE_FEE,
    MIN_FEE,
    NODE_URL
} from './consts'

export class Config {
    NETWORK: string;
    MINER_FEE: number;
    MIN_BOX_VAL: number;
    DEV_TREE: string;
    ORACLE_FEE_TREE: string;
    ORACLE_BUYBACK_NFT: string;
    ORACLE_POOL_NFT: string;
    GLUON_NFT: string;
    NEUTRON_ID: string;
    PROTON_ID: string;
    GLUON_TREE: string;
    UI_TREE: string;
    DEV_FEE: number;
    UI_FEE: number;
    ORACLE_FEE: number;
    MIN_FEE: number;
    NODE_URL: string;

    constructor(network: string = NETWORK, minerFee: number = MINER_FEE,
                minBoxVal: number = MIN_BOX_VAL, devTree: string = DEV_TREE,
                oracleFeeTree: string = ORACLE_FEE_TREE, oracleBuybackNft: string = ORACLE_BUYBACK_NFT,
                oraclePoolNft: string = ORACLE_POOL_NFT, gluonNft: string = GLUON_NFT,
                neutronId: string = NEUTRON_ID, protonId: string = PROTON_ID, gluonTree: string = GLUON_TREE,
                devFee: number = DEV_FEE, uiFee: number = 0, oracleFee: number = ORACLE_FEE,
                uiTree: string = '', minFee: number = MIN_FEE, nodeUrl: string = NODE_URL) {

        this.NETWORK = network;
        this.MINER_FEE = minerFee;
        this.MIN_BOX_VAL = minBoxVal;
        this.DEV_TREE = devTree;
        this.ORACLE_FEE_TREE = oracleFeeTree;
        this.ORACLE_BUYBACK_NFT = oracleBuybackNft;
        this.ORACLE_POOL_NFT = oraclePoolNft;
        this.GLUON_NFT = gluonNft;
        this.NEUTRON_ID = neutronId;
        this.PROTON_ID = protonId;
        this.GLUON_TREE = gluonTree;
        this.DEV_FEE = devFee;
        this.UI_FEE = uiFee;
        this.ORACLE_FEE = oracleFee;
        this.UI_TREE = uiTree;
        this.MIN_FEE = minFee;
        this.NODE_URL = nodeUrl;
    }

}

/**
 * Maximum fusion ratio cap (q*) used in the Gluon protocol's fusionRatio
 * calculation. When the computed ratio exceeds this value it is clamped here.
 * Expressed in nano-ERG units (1e9 base).
 */
export const GLUON_QSTAR: bigint = BigInt(660000000);

/**
 * Base (minimum) fee coefficient (φ₀) in the varPhiBeta fee-curve formula.
 * This is the floor value of the dynamic fee regardless of trade volume.
 * Expressed in nano-ERG units (1e9 base).
 */
export const GLUON_PHI0: bigint = BigInt(5000000);

/**
 * Volume-scaled fee coefficient (φ₁) in the varPhiBeta fee-curve formula.
 * Multiplied by the net directional volume and divided by fissioned ERG to
 * produce the variable portion of the protocol fee.
 * Expressed in nano-ERG units (1e9 base).
 */
export const GLUON_PHI1: bigint = BigInt(500000000);