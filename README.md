## Gluon Gold SDK

This SDK is meant to facilitate the interction with the Gluon protocol.

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
const eip12Tx = gluon.fissionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFusion)

// Transmuting to Gold
const height = ... // network height that can be gotten from and NodeService instance (see test.ts)
const oracleBuyBackJs = await gluon.getOracleBuyBackBoxJs()
const protonsToTransmute = 5000000
const eip12Tx = gluon.transmuteToGoldForEip12(gluonBox, oracleBox, userBoxesJs, oracleBuyBackJs, protonsToTransmute, height)

// Transmuting from Gold
const neutronsToDecay = 5000000
const eip12Tx = gluon.transmuteFromGoldForEip12(gluonBox, oracleBox, userBoxesJs, oracleBuyBackJs, neutronsToDecay, height)    


// Gold price
const goldPrice = await oracleBox.getPrice() // in kg
const goldPriceGram = await oracleBox.getPricePerGram() // in grams

// GAU price
const gauPrice = await gluon.neutronPrice(oracleBox) // in nanoErgs

// GAUC price
const gaucPrice = await gluon.protonPrice(oracleBox) // in nanoErgs

// 1 day volume
const volume = await gluon.accumulatePlusVolume(1)
// 5 day volume
const volume = await gluon.accumulatePlusVolume(5)
// 14 day volume
const volume = await gluon.accumulatePlusVolume(14)

// fusion ratio
const fusionRatio = await gluon.fusionRatio(oracleBox)

// total needed fee for fusion
const fee = getTotalFeeAmountFusion(gluonBox, ergtoFusion)

// total needed fee for fission
const fee = getTotalFeeAmountFission(gluonBox, ergtoFission)

// total needed fee for transmuting to gold
const fee = getTotalFeeAmountTransmuteToGold(gluonBox, oracleBox, protonsToTransmute)

// total needed fee for transmuting from gold
const fee = getTotalFeeAmountTransmuteFromGold(gluonBox, oracleBox, neutronsToDecay)
```