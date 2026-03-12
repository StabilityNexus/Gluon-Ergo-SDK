## Gluon Protocol SDK

This SDK is designed to facilitate interaction with Gluon protocols on the Ergo blockchain. It provides a generic interface that supports both Gluon W (Gluon Gold) and Gluon Y (Gluon Dollar), using algorithmic stablecoin terminology (neutrons and protons) instead of hardcoded asset-specific names.

### Installation

```bash
npm install gluon-ergo-sdk
```

### Implemented Features
- [x] Get Peg oracle box
- [x] Get Gluon box
- [x] Calculate amount of Neutrons and Protons user will receive when input `x` amount of ERGs
- [x] Calculate amount of Neutrons and Protons user will need to input to receive `x` amount of ERGs
- [x] Fission transaction: input ERGs and receive Neutrons and Protons
- [x] Fusion transaction: input Neutrons and Protons and receive ERGs
- [x] Transmute to Neutron (The user sends Protons to the reactor and receives Neutrons)
- [x] Transmute to Proton (The user sends Neutrons to the reactor and receives Protons)
- [x] Fusion Ratio
- [x] Volume tracking
- [x] Neutron Price
- [x] Proton Price
- [x] Needed fee calculation for all 4 kinds of transactions
- [x] Oracle Peg Price


### Usage

```javascript
// all values, including ERG, Neutron and Proton amounts, prices, etc. are without decimals applied

// the following example creates a fission transaction for 5 ERGs. Similar approach could be used for fusion transaction
const gluon = new Gluon()
const ergToFission = Number(5e9)
const userBoxesJs = [...]
const oracleBox = await gluon.getOracleBox()
const gluonBox = await gluon.getGluonBox()

// Fission
// the following is an instance of UnsignedTransaction which could be used to get reduced tx or for any use cases
const unsignedTx = await gluon.fission(gluonBox, oracleBox, userBoxesJs, ergToFission)
// the following is an unsigned transaction in JSON which could be used to sign using Nautilus or similar wallets without needing any changes
const eip12Tx = await gluon.fissionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFission)

// Fusion
const ergToFusion = Number(5e9)
const unsignedTx = await gluon.fusion(gluonBox, oracleBox, userBoxesJs, ergToFusion)
const eip12Tx = await gluon.fusionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFusion)

// Transmuting to Neutron
const height = ... // network height that can be gotten from a NodeService instance (see test.ts)
const oracleBuyBackJs = await gluon.getOracleBuyBackBoxJs()
const protonsToTransmute = 5000000
const eip12Tx = await gluon.transmuteToNeutronForEip12(gluonBox, oracleBox, userBoxesJs, oracleBuyBackJs, protonsToTransmute, height)

// Transmuting to Proton
const neutronsToTransmute = 5000000
const eip12Tx = await gluon.transmuteToProtonForEip12(gluonBox, oracleBox, userBoxesJs, oracleBuyBackJs, neutronsToTransmute, height)


// Oracle peg price
const pegPrice = await oracleBox.getPrice() // in kg (for gold-backed protocols)
const pegPriceGram = await oracleBox.getPricePerGram() // in grams (for gold-backed protocols)

// Neutron price
const neutronPrice = await gluonBox.neutronPrice(oracleBox) // in nanoErgs

// Proton price
const protonPrice = await gluonBox.protonPrice(oracleBox) // in nanoErgs

// 2 day volume of protons to neutrons
const volume = await gluonBox.accumulateVolumeProtonsToNeutrons(2)

// 2 day volume of neutrons to protons
const volume = await gluonBox.accumulateVolumeNeutronsToProtons(2)

// 10 day volume of protons to neutrons
const volume = await gluonBox.accumulateVolumeProtonsToNeutrons(10)

// 10 day volume of neutrons to protons
const volume = await gluonBox.accumulateVolumeNeutronsToProtons(10)

// 14 day volume of protons to neutrons
const volume = await gluonBox.accumulateVolumeProtonsToNeutrons()

// 14 day volume of neutrons to protons
const volume = await gluonBox.accumulateVolumeNeutronsToProtons()

// volume of protons to neutrons for the last 14 days
const volumeArray = await gluonBox.getVolumeProtonsToNeutronsArray() // an array with 14 elements for 14 days

// volume of neutrons to protons for the last 14 days
const volumeArray = await gluonBox.getVolumeNeutronsToProtonsArray() // an array with 14 elements for 14 days

// fusion ratio
const fusionRatio = await gluonBox.fusionRatio(oracleBox)

// For each of the 4 operations (fission, fusion, transmute to neutron, transmute to proton) there is a method to get the required fees
// In addition to that, there are methods to get the percentage of the fee for the total amount of ERG or Neutron/Proton that is sent/transmuted
const fees = await gluon.getTotalFeeAmountFusion(gluonBox, ergToFusion)
const feesPercentage = await gluon.getFeePercentageFusion(gluonBox, ergToFusion)
console.log(fees.devFee, fees.uiFee, fees.oracleFee, fees.totalFee)
console.log(feesPercentage.devFee, feesPercentage.uiFee, feesPercentage.oracleFee, feesPercentage.totalFee)
// fission is similar

// similarly for transmute to neutron
const fees = await gluon.getTotalFeeAmountTransmuteToNeutron(gluonBox, oracleBox, protonsToTransmute)
const feesPercentage = await gluon.getFeePercentageTransmuteToNeutron(gluonBox, oracleBox, protonsToTransmute)
console.log(fees.devFee, fees.uiFee, fees.oracleFee, fees.totalFee)
console.log(feesPercentage.devFee, feesPercentage.uiFee, feesPercentage.oracleFee, feesPercentage.totalFee)
// transmute to proton is similar

// TVL (total value locked) in nanoERG
const tvl = await gluon.getTVL(gluonBox, oracleBox)

// Reserve ratio in percentage
const reserveRatio = await gluon.getReserveRatio(gluonBox, oracleBox)
```

### Generic Design

This SDK uses generic terminology to support any Gluon protocol variant:
- **Neutrons**: The stablecoin token (e.g., GAU for Gluon Gold, GUSD for Gluon Dollar)
- **Protons**: The reserve/collateral token (e.g., GAUC for Gluon Gold)
- **Oracle Box**: Provides peg price information (gold price, USD price, etc.)
- **Transmutation**: Converting between neutrons and protons

This design allows the same SDK to work with different Gluon protocol implementations without code changes.
