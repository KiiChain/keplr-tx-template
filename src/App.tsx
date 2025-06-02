import { useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import {
  type Coin,
  type EncodeObject,
  type OfflineSigner,
} from "@cosmjs/proto-signing";
import { MsgSend } from "@kiichain/kiijs-proto/dist/cosmos/bank/v1beta1/tx";

import { fromBase64 } from "@cosmjs/encoding";
import { makeAuthInfoBytes, makeSignDoc } from "@cosmjs/proto-signing";

import { Any } from "cosmjs-types/google/protobuf/any";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { PubKey } from "@kiichain/kiijs-proto/dist/cosmos/evm/crypto/v1/ethsecp256k1/keys";

const chainId = "oro_1336-1";
const rpcEndpoint = "https://rpc.uno.sentry.testnet.v3.kiivalidator.com";

function App() {
  const [walletAddress, setWalletAddress] = useState<string>("");

  const fee: Coin = {
    denom: "akii",
    amount: "12000000000",
  };

  const amount: Coin[] = [
    {
      amount: "1000000000000000000",
      denom: "akii",
    },
  ];

  async function sendTokens(toAddress: string, amount: Coin[], fee: Coin) {
    await window.keplr.enable(chainId);
    const offlineSigner = await window.getOfflineSignerAuto(chainId);
    const accounts = await offlineSigner.getAccounts();

    const address = accounts[0].address;
    setWalletAddress(address);

    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      offlineSigner
    );

    const msgSend: EncodeObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.fromPartial({
        fromAddress: address,
        toAddress: toAddress,
        amount,
      }),
    };

    console.log("Client:", client);
    console.log("Offline:", offlineSigner);
    console.log("Signer address:", address);
    console.log("accounts:", await client.getAccount(address));

    const txRaw = await sign(
      client,
      offlineSigner,
      chainId,
      address,
      [msgSend],
      fee,
      "Test"
    );

    // Broadcast
    const receipt = await client.broadcastTx(txRaw);

    if (receipt.code !== 0) {
      console.error("Tx failed", receipt.rawLog);
    }

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
    console.log("Account data:", accountData);

    const accountFromSigner = (await signer.getAccounts()).find(
      (account) => account.address === signerAddress
    );
    if (!accountFromSigner)
      throw new Error("Failed to retrieve account from signer");

    const pubkeyBytes = accountFromSigner.pubkey;
    if (!pubkeyBytes || pubkeyBytes.length === 0)
      throw new Error("Public key not available from signer");

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
      <h2>Address: {walletAddress || "Not connected"}</h2>
      <button
        onClick={() =>
          sendTokens("kii1cstu4xay7asqar23nr78jcx5nmdx3n70rn0qfg", amount, fee)
        }
        style={{ padding: "10px 20px" }}
      >
        Send Tokens
      </button>
    </div>
  );
}

export default App;
