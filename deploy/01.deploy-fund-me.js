//function deployFunc() {
//  console.log("Hi!");
//}
//
//module.exports.default = deployFunc;

const { network } = require("hardhat");
const { modules } = require("web3");
const { networkConfig, developmentChain } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

// module.exports = async (hre) => {
//   hre.getNamedAccounts;
//   hre.deployments;
//   ...
// };

// // The above is equivalant to the following:
// module.exports = async (hre) => {
//   const { getNamedAccounts, deployments } = hre;
//   ...
// };

// The above is also equivalent to the following:
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // if chainId is X use address Y
  // if chainId is Z use address A
  let ethUSDPriseFeedAddress;
  // If we are on one of the predefind chains (localhost or hardhat), we want to use a mock
  if (developmentChain.includes(network.name)) {
    const ethUSDAggregator = await deployments.get("MockV3Aggregator");
    ethUSDPriseFeedAddress = ethUSDAggregator.address; // get the address of a deployed mock contract address
  }
  // Otherwise
  else {
    ethUSDPriseFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"]; // get a predefined address
  }

  // if a contract doesn't exist, we deploy a minimal version
  // of it for out local testing

  // Well, what happens when we want to change chains?
  // When going for localhost or hardhat network we want to use a mock
  const args = [ethUSDPriseFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUSDPriseFeedAddress], // put price feed address here
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChain.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log("---------------------------------------------");
};
module.exports.tags = ["all", "fundme"];
