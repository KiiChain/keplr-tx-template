import { SigningStargateClient } from "@cosmjs/stargate";
import {
  type Coin,
  type EncodeObject,
  type OfflineDirectSigner,
} from "@cosmjs/proto-signing";

import { fromBase64 } from "@cosmjs/encoding";
import { makeAuthInfoBytes, makeSignDoc } from "@cosmjs/proto-signing";

import { Any } from "cosmjs-types/google/protobuf/any";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { PubKey } from "@kiichain/kiijs-proto/dist/cosmos/evm/crypto/v1/ethsecp256k1/keys";
import { LCD_ENDPOINT } from "../constants";

// This function retrieves the account info from the LCD endpoint
// This is necessary since CosmJs can't decode the ethsecp256k1 pubkey format
async function getAccountInfo(address: string) {
  const res = await fetch(`${LCD_ENDPOINT}/cosmos/auth/v1beta1/accounts/${address}`);
  const data = await res.json();

  const baseAccount = data.account;
  return {
    accountNumber: Number(baseAccount.account_number),
    sequence: Number(baseAccount.sequence),
  };
}

// This function signs a transaction using the ethsecp256k1 signer
// The most important part is that it rewrites the PubKey to the ethsecp256k1 format
export async function signWithEthsecpSigner(
  client: SigningStargateClient,
  signer: OfflineDirectSigner,
  chainId: string,
  signerAddress: string,
  messages: EncodeObject[],
  fee: Coin,
  gasLimit: number,
  memo: string
) {
  // Get the account data from the client
  const accountData = await getAccountInfo(signerAddress);

  console.log("Account Data:", accountData);

  // If the data is null the account does not exist
  if (!accountData) {
    throw new Error(
      `Account with address ${signerAddress} does not exist on chain ${chainId}`
    );
  }

  // From the Signer, retrieve the account data
  const accountFromSigner = (await signer.getAccounts()).find(
    (account) => account.address === signerAddress
  );
  if (!accountFromSigner)
    throw new Error("Failed to retrieve account from signer");

  // Get the pubkey bytes from the account
  const pubkeyBytes = accountFromSigner.pubkey;
  if (!pubkeyBytes || pubkeyBytes.length === 0)
    throw new Error("Public key not available from signer");

  // This is the important part
  // It rewrites the PubKey to the ethsecp256k1 format
  // The typeUrl is set to the ethsecp256k1 PubKey type
  // and the value is set to the encoded PubKey with the pubkeyBytes
  // This is necessary for the transaction to be signed correctly
  const pubk = Any.fromPartial({
    typeUrl: "/cosmos.evm.crypto.v1.ethsecp256k1.PubKey",
    value: PubKey.encode({
      key: pubkeyBytes,
    }).finish(),
  });

  // Create the TX body
  const txBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: messages,
      memo: memo,
    },
  };

  // Encode the tx and make the auth info bytes
  const txBodyBytes = client.registry.encode(txBodyEncodeObject);
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

  // Sign the transaction using the signer
  const { signature, signed } = await signer.signDirect(signerAddress, signDoc);

  // returns txBytes for broadcast
  return TxRaw.encode({
    bodyBytes: signed.bodyBytes,
    authInfoBytes: signed.authInfoBytes,
    signatures: [fromBase64(signature.signature)],
  }).finish();
}
