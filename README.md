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

### To Do
- [ ] BetaDecay+ (The user sends Protons to the reactor and receives Neutrons)
- [ ] BetaDecay- (The user sends Neutrons to the reactor and receives Protons)


### Usage

```javascript
// the following example creates a fission transaction for 5 ERGs. Similar approach could be used for fusion transaction
const gluon = new   Gluon()
const ergToFission = Number(5e9)
const userBoxesJs = [...]
const oracleBoxJs = await gluon.getGoldOracleBox()
const gluonBoxJs = await gluon.getGluonBox()

// the following is an instance of UnsignedTransaction which could be used to get reduced tx or for any use cases
const unsignedTx = gluon.fission(gluonBoxJs, userBoxesJs, oracleBoxJs, ergToFission)

// the following is an unsigned transaction in JSON which could be used to sign using Nautilus or similar wallets without needing any chagnes
const nautilusTx = gluon.fissionForNautilus(gluonBoxJs, userBoxesJs, oracleBoxJs, ergToFission)
```