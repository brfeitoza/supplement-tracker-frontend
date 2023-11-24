export const environment = {
  production: true,
  web3: {
    contracts: {
      supplementTracker:
        process.env['SUPPLEMENT_TRACKER_CONTRACT_ADDRESS'] || '0x0',
    },
    account: {
      metamaskPrivateKey: process.env['METAMASK_PRIVATE_KEY'] || '0x0',
    },
  },
};
