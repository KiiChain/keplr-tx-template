# Keplr TX Template

This repository provides a sample project demonstrating how to handle `ethsecp256k1` signatures for the Kiichain blockchain. It serves as a reference for developers integrating Keplr wallet functionality with Kiichain.

## Features

- Example implementation of `ethsecp256k1` signature handling.
- Integration with Keplr wallet for signing transactions.
- Demonstrates interaction with Kiichain blockchain.

Signature can be found at:

- [cosmjs](./src/cosmjs/ethsecp256k1.ts)

## Signing Transactions with `ethsecp256k1`

This is what is needed to sign a transaction with `ethsecp256k1`.

1. Create the `SigningStargateClient` with the correct type

```typescript
// Start the client connection
// The stargate client must use the custom account parser
// This is necessary to handle the ethsecp256k1 PubKey format in queries
const client = await SigningStargateClient.connectWithSigner(
  RPC_ENDPOINT,
  offlineSigner,
  {
    accountParser: ethsecpAccountParser,
  }
);
```

The signing client must use a custom account parser to handle the `ethsecp256k1` public key format. This is crucial for correctly signing transactions.

2. Sign the transaction with a custom pubkey

```typescript
// This is the important bit
// This signs the transaction using the ethsecp256k1 signer
// It basically rewrite the Pubkey to the ethsecp256k1 format
const txRaw = await signWithEthsecpSigner(
  client,
  offlineSigner,
  CHAIN_ID,
  address,
  [msgSend],
  "This is a sample transaction memo",
  KEPLR_CHAIN_INFO.feeCurrencies[0].gasPriceStep.high,
  1.5
);
```

3. Broadcast the signed transaction

```typescript
const receipt = await client.broadcastTx(txRaw);
```

## Prerequisites

- Node.js (v16 or higher recommended)
- KiiJs library installed

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/keplr-tx-template.git
cd keplr-tx-template
```

2. Install dependencies:

```bash
npm install
```

## Usage

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and connect your Keplr wallet.

3. Follow the instructions in the app to sign and send transactions using `ethsecp256k1`.
