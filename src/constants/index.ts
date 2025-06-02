export const CHAIN_ID = "oro_1336-1";
export const RPC_ENDPOINT = "https://rpc.uno.sentry.testnet.v3.kiivalidator.com";
export const LCD_ENDPOINT = "https://lcd.uno.sentry.testnet.v3.kiivalidator.com";

// This is the chain info for the Kii Testnet Oro chain
// Source can be found at:
// https://github.com/chainapsis/keplr-chain-registry/blob/main/cosmos/oro_1336.json
export const KEPLR_CHAIN_INFO = {
    "rpc": "https://rpc.uno.sentry.testnet.v3.kiivalidator.com",
    "rest": "https://lcd.uno.sentry.testnet.v3.kiivalidator.com",
    "chainId": "oro_1336-1",
    "chainName": "Kii Testnet Oro",
    "evm": {
        "chainId": 1336,
        "rpc": "https://json-rpc.uno.sentry.testnet.v3.kiivalidator.com"
    },
    "chainSymbolImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/oro_1336/kii_oro_coin.png",
    "stakeCurrency": {
        "coinDenom": "Kii",
        "coinMinimalDenom": "akii",
        "coinDecimals": 18,
        "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/oro_1336/kii_oro_coin.png"
    },
    "bip44": {
        "coinType": 60
    },
    "bech32Config": {
        "bech32PrefixAccAddr": "kii",
        "bech32PrefixAccPub": "kiipub",
        "bech32PrefixValAddr": "kiivaloper",
        "bech32PrefixValPub": "kiivaloperpub",
        "bech32PrefixConsAddr": "kiivalcons",
        "bech32PrefixConsPub": "kiivalconspub"
    },
    "currencies": [
        {
            "coinDenom": "Kii",
            "coinMinimalDenom": "akii",
            "coinDecimals": 18,
            "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/oro_1336/kii_oro_coin.png"
        }
    ],
    "feeCurrencies": [
        {
            "coinDenom": "Kii",
            "coinMinimalDenom": "akii",
            "coinDecimals": 18,
            "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/oro_1336/kii_oro_coin.png",
            "gasPriceStep": {
                "low": 80000000000,
                "average": 80000000000,
                "high": 80000000000
            }
        }
    ],
    "features": [
        "eth-address-gen",
        "eth-key-sign",
        "eth-secp256k1-cosmos"
    ],
    "nodeProvider": {
        "name": "Kiichain Protocol",
        "email": "dev@kiichain.io",
        "website": "https://kiichain.io"
    }
}