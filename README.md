## Gluon Gold SDK

This SDK is meant to facilitate the interaction with the Gluon protocol.

### Installation

```bash
git clone https://github.com/StabilityNexus/Gluon-Ergo-SDK
cd Gluon-Ergo-SDK
npm install
```

### Implemented Features
- [x] Get Gold oracle box
- [x] Get Gluon box
- [x] Calculate amount of Neutrons and Protons user will receive when input `x` amount of ERGs
- [x] Calculate amount of Neutrons and Protons user will need to input to receive `x` amount of ERGs
- [x] Fission transaction: input ERGs and receive Neutrons and Protons
- [x] Fusion transaction: input Neutrons and Protons and receive ERGs
- [x] Transmuting to Gold (The user sends Protons to the reactor and receives Neutrons)
- [x] Transmuting from Gold (The user sends Neutrons to the reactor and receives Protons)
- [x] Fusion Ratio
- [x] Volume
- [x] GAU Price
- [x] GAUC Price
- [x] Needed fee for all 4 kinds of transactions
- [x] Gold Oracle Price


### Usage

```javascript
// all values, including ERG, Neutron and Proton amounts, prices, etc. are without decimals applied

// the following example creates a fission transaction for 5 ERGs. Similar approach could be used for fusion transaction
const gluon = new Gluon()
const ergToFission = Number(5e9)
const userBoxesJs = [...]
const oracleBox = await gluon.getGoldOracleBox()
const gluonBox = await gluon.getGluonBox()

// Fission
// the following is an instance of UnsignedTransaction which could be used to get reduced tx or for any use cases
const unsignedTx = gluon.fission(gluonBox, oracleBox, userBoxesJs, ergToFission)
// the following is an unsigned transaction in JSON which could be used to sign using Nautilus or similar wallets without needing any chagnes
const eip12Tx = gluon.fissionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFission)

// Fusion
const ergToFusion = Number(5e9)
const unsignedTx = gluon.fusion(gluonBox, oracleBox, userBoxesJs, ergToFusion)
const eip12Tx = gluon.fusionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFusion)

// Transmuting to Gold
const height = ... // network height that can be gotten from a NodeService instance (see test.ts)
const oracleBuyBackJs = await gluon.getOracleBuyBackBoxJs()
const protonsToTransmute = 5000000
const eip12Tx = gluon.transmuteToGoldForEip12(gluonBox, oracleBox, userBoxesJs, oracleBuyBackJs, protonsToTransmute, height)

// Transmuting from Gold
const neutronsToTransmute = 5000000
const eip12Tx = gluon.transmuteFromGoldForEip12(gluonBox, oracleBox, userBoxesJs, oracleBuyBackJs, neutronsToTransmute, height)    


// Gold price
const goldPrice = await oracleBox.getPrice() // in kg
const goldPriceGram = await oracleBox.getPricePerGram() // in grams

// GAU price
const gauPrice = await gluon.neutronPrice(oracleBox) // in nanoErgs

// GAUC price
const gaucPrice = await gluon.protonPrice(oracleBox) // in nanoErgs

// 2 day volume of protons to neutrons
const volume = gluon.accumulateVolumeProtonsToNeutrons(2)

// 2 day volume of neutrons to protons
const volume = gluon.accumulateVolumeNeutronsToProtons(2)

// 10 day volume of protons to neutrons
const volume = gluon.accumulateVolumeProtonsToNeutrons(10)

// 10 day volume of neutrons to protons
const volume = gluon.accumulateVolumeNeutronsToProtons(10)

// 14 day volume of protons to neutrons
const volume = gluon.accumulateVolumeProtonsToNeutrons()

// 14 day volume of neutrons to protons
const volume = gluon.accumulateVolumeNeutronsToProtons()

// volume of protons to neutrons for the last 14 days
const volumeArray = gluon.get14DaysVolumeProtonsToNeutrons() // an array with 14 elements for 14 days

// volume of neutrons to protons for the last 14 days
const volumeArray = gluon.get14DaysVolumeNeutronsToProtons() // an array with 14 elements for 14 days

// fusion ratio
const fusionRatio = await gluon.fusionRatio(oracleBox)

// For each of the 4 operations (fission, fusion, transmute to gold, transmute from gold) there is a method to get the required fees
// In addition to that, there are methods to get the percentage of the fee for the total amount of ERG or Neutron/Proton that is sent/transmuted
const fees = gluon.getTotalFeeAmountFusion(gluonBox, ergToFusion)
const feesPercentage = gluon.getFeePercentageFusion(gluonBox, ergToFusion)
console.log(fees.devFee, fees.uiFee, fees.oracleFee, fees.totalFee)
console.log(feesPercentage.devFee, feesPercentage.uiFee, feesPercentage.oracleFee, feesPercentage.totalFee)

// similarly for transmute to gold
const fees = gluon.getTotalFeeAmountTransmuteToGold(gluonBox, oracleBox, protonsToTransmute)
const feesPercentage = gluon.getFeePercentageTransmuteToGold(gluonBox, oracleBox, protonsToTransmute)
console.log(fees.devFee, fees.uiFee, fees.oracleFee, fees.totalFee)
console.log(feesPercentage.devFee, feesPercentage.uiFee, feesPercentage.oracleFee, feesPercentage.totalFee)
