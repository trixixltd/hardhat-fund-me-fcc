require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

// Initialise variables from environment
const RPC_URL = process.env.RPC_URL || "";
const KOVAN_RPC_URL = process.env.KOVAN_RPC_URL || "";
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "";
const ROPSTEN_RPC_URL = process.env.ROPSTEN_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      // gasPrice: 130000000000,
    },
    //kovan: {
    //  url: KOVAN_RPC_URL,
    //  accounts: [PRIVATE_KEY],
    //},
    //localhost: {
    //  url: RPC_URL,
    //  chainId: 31337,
    //},
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 4,
      blockConfirmations: 6,
    },
    //ropsten: {
    //  url: ROPSTEN_RPC_URL,
    //  accounts: [PRIVATE_KEY],
    //},
  },
  gasReporter: {
    enabled: true, // process.env.REPORT_GAS !== undefined,
    outputFile: "gas-reporter.txt",
    noColors: true,
    currency: "USD",
    // coinmarketcap: COINMARKETCAP_API_KEY,
    token: "MATIC",
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      //4: 1,
      //31337: 1,
    },
    user: {
      default: 1,
    },
  },
};
