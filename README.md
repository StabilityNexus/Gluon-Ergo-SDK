<!-- Don't delete it -->

<div name="readme-top"></div>



<!-- Organization Logo -->

<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">

  <img alt="Stability Nexus" src="public/stability.svg" width="175">

  <img src="public/logo.png" width="175" />

</div>



&nbsp;



<!-- Organization Name -->

<div align="center">



[![Static Badge](https://img.shields.io/badge/Stability_Nexus-/Gluon_Gold_SDK-228B22?style=for-the-badge&labelColor=FFC517)](https://gluon.stability.nexus/)



<!-- Correct deployed url to be added -->



</div>



<!-- Organization/Project Social Handles -->

<p align="center">
<!-- Telegram -->
<a href="https://t.me/StabilityNexus">
<img src="https://img.shields.io/badge/Telegram-black?style=flat&logo=telegram&logoColor=white&logoSize=auto&color=24A1DE" alt="Telegram Badge"/></a>
&nbsp;&nbsp;
<!-- X (formerly Twitter) -->
<a href="https://x.com/StabilityNexus">
<img src="https://img.shields.io/twitter/follow/StabilityNexus" alt="X (formerly Twitter) Badge"/></a>
&nbsp;&nbsp;
<!-- Discord -->
<a href="https://discord.gg/YzDKeEfWtS">
<img src="https://img.shields.io/discord/995968619034984528?style=flat&logo=discord&logoColor=white&logoSize=auto&label=Discord&labelColor=5865F2&color=57F287" alt="Discord Badge"/></a>
&nbsp;&nbsp;
<!-- Medium -->
<a href="https://news.stability.nexus/">
  <img src="https://img.shields.io/badge/Medium-black?style=flat&logo=medium&logoColor=black&logoSize=auto&color=white" alt="Medium Badge"></a>
&nbsp;&nbsp;
<!-- LinkedIn -->
<a href="https://linkedin.com/company/stability-nexus">
  <img src="https://img.shields.io/badge/LinkedIn-black?style=flat&logo=LinkedIn&logoColor=white&logoSize=auto&color=0A66C2" alt="LinkedIn Badge"></a>
&nbsp;&nbsp;
<!-- Youtube -->
<a href="https://www.youtube.com/@StabilityNexus">
  <img src="https://img.shields.io/youtube/channel/subscribers/UCZOG4YhFQdlGaLugr_e5BKw?style=flat&logo=youtube&logoColor=white&logoSize=auto&labelColor=FF0000&color=FF0000" alt="Youtube Badge"></a>
</p>



---



<div align="center">

<h1>Gluon Gold SDK</h1>

</div>



The Gluon Gold SDK provides ergonomic helpers to interact with the Gluon protocol: read oracle and protocol boxes, compute conversions, and build fission/fusion/transmutation transactions (including EIP-12 JSON for wallet signing). Values are returned without decimals applied so you can manage precision explicitly.



---



## Installation

```bash
npm install gluon-gold-sdk
```



## Features

- Get Gold Oracle and Gluon boxes
- Price helpers: Gold (kg/gram), GAU (Neutron), GAUC (Proton)
- Compute fission/fusion amounts ERG ↔ Neutron/Proton
- Build fission and fusion transactions (unsigned tx + EIP-12 JSON)
- Transmute to/from Gold (Protons ↔ Neutrons)
- Fees, fusion ratio, reserve ratio, TVL
- Volume aggregates (2/10/14-day windows)



--


---



## Additional Usage Highlights

- **Fusion**: `fusion` / `fusionForEip12`
- **Transmute to Gold**: `transmuteToGoldForEip12(gluonBox, oracleBox, userBoxes, oracleBuyBackJs, protons, height)`
- **Transmute from Gold**: `transmuteFromGoldForEip12(...)`
- **Fees**: `getTotalFeeAmountFusion`, `getFeePercentageFusion`, and similar helpers for fission/transmute
- **Volumes**: `accumulateVolume*` and `get14DaysVolume*` for Proton/Neutron flows
- **TVL / Reserve**: `getTVL`, `getReserveRatio`



---



## Full Usage (detailed examples)

```ts
// All values (ERG, Neutron, Proton, prices) are raw integers with no decimals applied.
import { Gluon } from "gluon-gold-sdk";

const gluon = new Gluon();
const userBoxesJs = [...]; // user's boxes

// Fetch boxes
const oracleBox = await gluon.getGoldOracleBox();
const gluonBox = await gluon.getGluonBox();

// Fission: input ERG, receive Neutrons & Protons
const ergToFission = Number(5e9);
const fissionUnsigned = await gluon.fission(gluonBox, oracleBox, userBoxesJs, ergToFission);
const fissionEip12 = await gluon.fissionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFission);

// Fusion: input Neutrons & Protons, receive ERG
const ergToFusion = Number(5e9);
const fusionUnsigned = await gluon.fusion(gluonBox, oracleBox, userBoxesJs, ergToFusion);
const fusionEip12 = await gluon.fusionForEip12(gluonBox, oracleBox, userBoxesJs, ergToFusion);

// Transmute to Gold: send Protons, receive Neutrons
const height = /* network height */;
const oracleBuyBackJs = await gluon.getOracleBuyBackBoxJs();
const protonsToTransmute = 5_000_000;
const toGoldEip12 = await gluon.transmuteToGoldForEip12(
  gluonBox,
  oracleBox,
  userBoxesJs,
  oracleBuyBackJs,
  protonsToTransmute,
  height
);

// Transmute from Gold: send Neutrons, receive Protons
const neutronsToTransmute = 5_000_000;
const fromGoldEip12 = await gluon.transmuteFromGoldForEip12(
  gluonBox,
  oracleBox,
  userBoxesJs,
  oracleBuyBackJs,
  neutronsToTransmute,
  height
);

// Prices
const goldPriceKg = await oracleBox.getPrice();
const goldPriceGram = await oracleBox.getPricePerGram();
const gauPrice = await gluon.neutronPrice(oracleBox);
const gaucPrice = await gluon.protonPrice(oracleBox);

// Volumes (2/10/14-day)
const volP2N2 = await gluon.accumulateVolumeProtonsToNeutrons(2);
const volN2P2 = await gluon.accumulateVolumeNeutronsToProtons(2);
const volP2N10 = await gluon.accumulateVolumeProtonsToNeutrons(10);
const volN2P10 = await gluon.accumulateVolumeNeutronsToProtons(10);
const volP2N14 = await gluon.accumulateVolumeProtonsToNeutrons();
const volN2P14 = await gluon.accumulateVolumeNeutronsToProtons();
const volArrayP2N = await gluon.get14DaysVolumeProtonsToNeutrons();   // 14-element array
const volArrayN2P = await gluon.get14DaysVolumeNeutronsToProtons();   // 14-element array

// Fusion ratio
const fusionRatio = await gluon.fusionRatio(oracleBox);

// Fees (total + percentage) for each operation
const fusionFees = await gluon.getTotalFeeAmountFusion(gluonBox, ergToFusion);
const fusionFeesPct = await gluon.getFeePercentageFusion(gluonBox, ergToFusion);
// Similar helpers exist for fission and transmute to/from gold:
// getTotalFeeAmountFission / getFeePercentageFission
// getTotalFeeAmountTransmuteToGold / getFeePercentageTransmuteToGold
// getTotalFeeAmountTransmuteFromGold / getFeePercentageTransmuteFromGold

// TVL and reserve ratio
const tvl = await gluon.getTVL(gluonBox, oracleBox);
const reserveRatio = await gluon.getReserveRatio(gluonBox, oracleBox);
```



---



## Contributing

We welcome contributions! To contribute:

1. Fork the repository and create your feature branch (`git checkout -b feature/AmazingFeature`).
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
3. Run quality checks before pushing:
   - `npm run lint` (or the repo’s lint task)
   - `npm run test` (if applicable)
4. Push your branch and open a Pull Request.

If you find issues or need help, please open an issue with details and steps to reproduce.



© 2025 The Stable Order. 
