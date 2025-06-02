import { useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { type Coin, type EncodeObject } from "@cosmjs/proto-signing";
import { MsgSend } from "@kiichain/kiijs-proto/dist/cosmos/bank/v1beta1/tx";
import { customAccountParser, signWithEthsecpSigner } from "./cosmjs/signer";
import { CHAIN_ID, KEPLR_CHAIN_INFO, RPC_ENDPOINT } from "./constants";

function App() {
  // State to hold the wallet address
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Hardcoded amount to send
  const amount: Coin[] = [
    {
      amount: "100000000000000000",
      denom: "akii",
    },
  ];

  // Connect wallet with Keplr
  async function connectWallet() {
    if (!window.keplr || !window.getOfflineSignerAuto) {
      alert("Keplr extension is not installed.");
      return;
    }

    try {
      await window.keplr.experimentalSuggestChain(KEPLR_CHAIN_INFO);
      const offlineSigner = await window.getOfflineSignerAuto(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      setWalletAddress(accounts[0].address);
      setConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  // Disconnect wallet (simply clear state)
  function disconnectWallet() {
    setWalletAddress("");
    setConnected(false);
  }

  // Send a amount of tokens using the Cosmos EVM ethsecp256k1 signer
  async function sendTokens(toAddress: string, amount: Coin[]) {
    setTxHash(null);
    setTxError(null);

    try {
      // Start the connection process
      await window.keplr.enable(CHAIN_ID);
      if (!window.getOfflineSignerAuto) {
        throw new Error(
          "getOfflineSignerAuto is not available on the window object."
        );
      }
      // Extract the offline signer from the window object
      const offlineSigner = await window.getOfflineSignerAuto(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();

      // Get and set the wallet address
      const address = accounts[0].address;
      setWalletAddress(address);

      // Start the client connection
      // The stargate client must use the custom account parser
      // This is necessary to handle the ethsecp256k1 PubKey format
      const client = await SigningStargateClient.connectWithSigner(
        RPC_ENDPOINT,
        offlineSigner,
        {
          accountParser: customAccountParser,
        },
      );

      // Encode the MsgSend transaction
      // This can be any transaction type, here we use MsgSend as an example
      const msgSend: EncodeObject = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.fromPartial({
          fromAddress: address,
          toAddress: toAddress,
          amount,
        }),
      };

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
        1.5,
      );

      // Broadcast
      const receipt = await client.broadcastTx(txRaw);

      // Check if the transaction was successful
      if (receipt.code !== 0) {
        console.error("Tx failed", receipt.rawLog);
        setTxError(receipt.transactionHash);
      } else {
        console.log("Tx successful", receipt.transactionHash);
        setTxHash(receipt.transactionHash);
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      setTxError(error.message || "An unknown error occurred");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        gap: "20px",
        textAlign: "center",
      }}
    >
      <h2>Address: {walletAddress || "Not connected"}</h2>
      <h3>This will send 0.1 Kii to a sample address</h3>

      {!connected ? (
        <button onClick={connectWallet} style={{ padding: "10px 20px" }}>
          Connect Keplr
        </button>
      ) : (
        <>
          <button
            onClick={() =>
              sendTokens(
                "kii1cstu4xay7asqar23nr78jcx5nmdx3n70rn0qfg",
                amount,
              )
            }
            style={{ padding: "10px 20px" }}
          >
            Send Tokens
          </button>
          <button onClick={disconnectWallet} style={{ padding: "10px 20px" }}>
            Disconnect
          </button>
        </>
      )}
      {txHash && <p style={{ color: "green" }}>Transaction Hash: {txHash}</p>}
      {txError && <p style={{ color: "red" }}>Error: {txError}</p>}
    </div>
  );
}

export default App;
