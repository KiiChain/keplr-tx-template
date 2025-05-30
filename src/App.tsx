import { useState } from "react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningStargateClient } from "@cosmjs/stargate";
import {
  Registry,
  type Coin,
  type EncodeObject,
  type GeneratedType,
  type OfflineSigner,
} from "@cosmjs/proto-signing";
import { MsgSend } from "@kiichain/kiijs-proto/dist/cosmos/bank/v1beta1/tx";

import { fromBase64 } from "@cosmjs/encoding";
import { makeAuthInfoBytes, makeSignDoc } from "@cosmjs/proto-signing";

import { Any } from "cosmjs-types/google/protobuf/any";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { PubKey } from "@kiichain/kiijs-proto/dist/cosmos/evm/crypto/v1/ethsecp256k1/keys";

const chainInfo = {
  chainId: "oro_1336-1",
  chainName: "Oro Chain",
  rpc: "https://rpc.uno.sentry.testnet.v3.kiivalidator.com",
  rest: "https://lcd.uno.sentry.testnet.v3.kiivalidator.com",
  bip44: {
    coinType: 60,
  },
  bech32Config: {
    bech32PrefixAccAddr: "kii",
    bech32PrefixAccPub: "kiipub",
    bech32PrefixValAddr: "kiivaloper",
    bech32PrefixValPub: "kiivaloperpub",
    bech32PrefixConsAddr: "kiivalcons",
    bech32PrefixConsPub: "kiivalconspub",
  },
  currencies: [
    {
      coinDenom: "AKII",
      coinMinimalDenom: "akii",
      coinDecimals: 18,
      coinGeckoId: "kiichain",
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "AKII",
      coinMinimalDenom: "akii",
      coinDecimals: 18,
      coinGeckoId: "kiichain",
    },
  ],
  stakeCurrency: {
    coinDenom: "AKII",
    coinMinimalDenom: "akii",
    coinDecimals: 18,
    coinGeckoId: "kiichain",
  },
  features: ["ethsecp256k1", "stargate", "ibc-transfer", "ibc-go"],
  gasPriceStep: {
    low: 0.01,
    average: 0.025,
    high: 0.04,
  },
};

async function registerAndConnect() {
  if (!window.keplr) {
    alert("Keplr not installed");
    return null;
  }

  try {
    // Registramos la chain personalizada en Keplr (solo local, no en el chain registry global)
    await window.keplr.experimentalSuggestChain(chainInfo);

    // Habilitamos la chain para usarla
    await window.keplr.enable(chainInfo.chainId);

    // Obtenemos el offline signer con la configuración nueva
    const offlineSigner = await window.getOfflineSignerAuto(chainInfo.chainId);

    // Obtenemos las cuentas del signer
    const accounts = await offlineSigner.getAccounts();

    console.log(
      "Conectado a chain personalizada con address:",
      accounts[0].address
    );
    console.log("Algoritmo clave:", accounts[0].algo);

    return { offlineSigner, address: accounts[0].address };
  } catch (error) {
    console.error("Error al registrar o conectar a la chain:", error);
    return null;
  }
}

const chainId = "oro_1336-1";
const rpcEndpoint = "https://rpc.uno.sentry.testnet.v3.kiivalidator.com";
const contractAddress =
  "kii1afxj87jjd4usd80gsprtq76uykv02egaydwvj62ldhngzj2zdamqnxmadv";

function App() {
  const [walletAddress, setWalletAddress] = useState<string>("");

  // ************************** TX GENERATION

  const connectWallet = async () => {
    const ethPubKeyTypeUrl = "/cosmos.evm.crypto.v1.ethsecp256k1.PubKey";
    const registry = new Registry([
      [ethPubKeyTypeUrl, PubKey as GeneratedType],
      ["/cosmos.bank.v1beta1.MsgSend", MsgSend as unknown as GeneratedType],
    ]);

    const sendCustomMsg = async () => {
      const wallet = await registerAndConnect();
      if (!wallet) return;

      const { offlineSigner, address } = wallet;

      const client = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        offlineSigner,
        { registry }
      );

      const msg = {
        fromAddress: address,
        toAddress: "kii174hsj0ax02rvuf2fw52vu0080epdx6844c79xj",
        amount: [
          {
            denom: "akii",
            amount: "100000000000",
          },
        ],
      };

      const fee = {
        amount: [{ denom: "akii", amount: "12000000000" }],
        gas: "300000",
      };

      const codedMsg = MsgSend.encode(msg).finish();

      const result = await client.signAndBroadcast(address, [codedMsg], fee);

      if (result.code !== 0) {
        throw new Error(`Tx failed with code ${result.code}: ${result.rawLog}`);
      }
      console.log("Tx enviada correctamente:", result.transactionHash);
    };

    try {
      await window.keplr.experimentalSuggestChain(chainInfo);
      await window.keplr.enable(chainInfo.chainId);

      const offlineSigner = await window.getOfflineSignerAuto(
        chainInfo.chainId
      );
      const accounts = await offlineSigner.getAccounts();

      setWalletAddress(accounts[0].address);

      return await sendCustomMsg();
    } catch (offlineSignererr) {
      console.error("Error al conectar:", offlineSignererr);
      return null;
    }
  };

  // *****************************
  async function testSign() {
    const wallet = await registerAndConnect();
    if (!wallet) return;

    const { offlineSigner } = wallet;

    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      offlineSigner
    );

    const msgSend: EncodeObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.fromPartial({
        fromAddress: wallet.address,
        toAddress: "kii1qvulcqneyp2r2pf2xcxgj8l0cv6gu2mjkan37c", // Replace with actual recipient address
        amount: [
          {
            amount: "1000000000000000000",
            denom: "akii",
          },
        ],
      }),
    };

    const fee = {
      denom: "akii",
      amount: "12000000000",
    };

    const txRaw = await sign(
      client,
      offlineSigner,
      chainId,
      wallet.address,
      [msgSend],
      fee,
      "Test"
    );

    // Broadcast
    const receipt = await client.broadcastTx(txRaw);
    console.log("Receipt:", receipt);
  }

  async function sign(
    client: SigningStargateClient,
    signer: OfflineSigner,
    chainId: string,
    signerAddress: string,
    messages: EncodeObject[],
    fee: Coin,
    memo: string
  ) {
    const accountData = await client.getAccount(signerAddress);
    const accountFromSigner = (await signer.getAccounts()).find(
      (account) => account.address === signerAddress
    );
    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }
    const pubkeyBytes = accountFromSigner.pubkey;

    const pubk = Any.fromPartial({
      typeUrl: "/cosmos.evm.crypto.v1.ethsecp256k1.PubKey",
      value: PubKey.encode({
        key: pubkeyBytes,
      }).finish(),
    });

    const txBodyEncodeObject = {
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: {
        messages: messages,
        memo: memo,
      },
    };
    const txBodyBytes = client.registry.encode(txBodyEncodeObject);
    const gasLimit = 10000000;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey: pubk, sequence: accountData!.sequence }],
      [fee],
      gasLimit,
      undefined,
      signerAddress
    );
    const signDoc = makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountData!.accountNumber
    );
    const { signature, signed } = await signer.signDirect(
      signerAddress,
      signDoc
    );

    // returns txBytes for broadcast
    return TxRaw.encode({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    }).finish();
  }

  const executeContract = async () => {
    try {
      const { offlineSigner, address } = await connectWallet();
      const client = await SigningCosmWasmClient.connectWithSigner(
        rpcEndpoint,
        offlineSigner
      );

      const msg = "inc";
      const fee = {
        amount: [{ denom: "akii", amount: "12000000000000000" }],
        gas: "300000",
      };

      const result = await client.execute(address, contractAddress, msg, fee);
      console.log("Contract executed:", result);
    } catch (err) {
      console.error("Error executing contract", err);
    }
  };

  // ****************************************

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "20px",
      }}
    >
      <h2>Dirección: {walletAddress || "Not connected"}</h2>
      <button onClick={testSign} style={{ padding: "10px 20px" }}>
        Enviar Tokens
      </button>
      <button onClick={executeContract} style={{ padding: "10px 20px" }}>
        Ejecutar Smart Contract
      </button>
    </div>
  );
}

export default App;
