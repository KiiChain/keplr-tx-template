export {};

declare global {
  interface Window {
    keplr?: any;
    getOfflineSigner?: (chainId: string) => any;
    getOfflineSignerAuto?: (chainId: string) => any;
    getEnigmaUtils?: (chainId: string) => any;
  }
}
