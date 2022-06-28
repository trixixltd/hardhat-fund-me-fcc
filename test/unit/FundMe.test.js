const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async function () {
  let fundMe;
  let deploer;
  let mockV3Aggregator;
  const sendValue = "1000000000000000000"; // which is the same as ethers.utils.parseEther("1") // = 1 eth

  beforeEach(async function () {
    // deploy out fundMe contract using HardHat-deploy
    //const accounts = await ethers.getSigner(); // returns the "accounts" content of network configured in hardhat.config.js
    //const accountZero = accounts[0];
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]); // run all deploy scripts in the deploy folder that has a tag of "all"
    fundMe = await ethers.getContract("FundMe", deployer); // retrieve the most recently deployed named contract.
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", async function () {
    it("sets the aggratagor addresses correctly", async function () {
      const response = await fundMe.getPriceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", async function () {
    it("Fails if enough ETH is not sent", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough!");
    });

    it("Updated the 'amountFunded' data structure", async () => {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAmountFundedByFunder(deployer); // deployer is used because the funder is the deployer.
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Adds funde to array of funders", async () => {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.getFunder(0);
      assert.equal(funder, deployer);
    });
  });

  describe("withdraw", async function () {
    // Before we start the test, lets fund the account
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });

    it("Only allows the owner to withdraw", async () => {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
        "FundMe__NotOwner"
      );
    });

    it("Withdraw ETH from a single funder", async function () {
      // arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );

      // act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt; // get gasUsed and effectibeGasPrice from "transactionReceipt"
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalanc = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // assert
      assert.equal(endingFundMeBalanc, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it("Balance matches the amount funded", async () => {
      //await fundMe.fund({ value: sendValue });
      const fund = await fundMe.getAmountFundedByFunder(deployer);
      assert.equal(fund.toString(), sendValue.toString());
    });

    it("Withdraw with multiple funders", async function () {
      // Arrange
      const accounts = await ethers.getSigners();

      // we are going to fund the contract from subset of the accounts on the network
      // index 0 is the deployer so the loop will start from index 1.
      for (let idx = 1; idx < 6; idx++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[idx]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      // console.log(`  startingFundMeBalance = ${startingFundMeBalance}`);

      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      // console.log(`startingDeployerBalance = ${startingDeployerBalance}`);

      // Action
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      // Assert
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      // console.log(`                gasUsed = ${gasUsed}`);
      // console.log(`      effectiveGasPrice = ${effectiveGasPrice}`);
      const gasCost = gasUsed.mul(effectiveGasPrice);
      // console.log(`                gasCost = ${gasCost}`);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      // console.log(`    endingFundMeBalance = ${endingFundMeBalance}`);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      // console.log(`  endingDeployerBalance = ${endingDeployerBalance}`);

      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      // console.log(`      Starting Balances = ${startingFundMeBalance.add(startingDeployerBalance)}`);
      // console.log(`         Ending Balance = ${endingDeployerBalance.add(gasCost)}`);

      // Make sure that the funders are reset properly
      await expect(fundMe.getFunder(0)).to.be.reverted; // reading the 1st element should fail

      // Check that each funders' balance is zero
      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAmountFundedByFunder(accounts[i].address),
          0
        );
      }
    });

    it("cheaperWithdraw testing...", async function () {
      // Arrange
      const accounts = await ethers.getSigners();

      // we are going to fund the contract from subset of the accounts on the network
      // index 0 is the deployer so the loop will start from index 1.
      for (let idx = 1; idx < 6; idx++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[idx]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      // console.log(`  startingFundMeBalance = ${startingFundMeBalance}`);

      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      // console.log(`startingDeployerBalance = ${startingDeployerBalance}`);

      // Action
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      // Assert
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      // console.log(`                gasUsed = ${gasUsed}`);
      // console.log(`      effectiveGasPrice = ${effectiveGasPrice}`);
      const gasCost = gasUsed.mul(effectiveGasPrice);
      // console.log(`                gasCost = ${gasCost}`);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      // console.log(`    endingFundMeBalance = ${endingFundMeBalance}`);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      // console.log(`  endingDeployerBalance = ${endingDeployerBalance}`);

      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      // console.log(`      Starting Balances = ${startingFundMeBalance.add(startingDeployerBalance)}`);
      // console.log(`         Ending Balance = ${endingDeployerBalance.add(gasCost)}`);

      // Make sure that the funders are reset properly
      await expect(fundMe.getFunder(0)).to.be.reverted; // reading the 1st element should fail

      // Check that each funders' balance is zero
      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAmountFundedByFunder(accounts[i].address),
          0
        );
      }
    });
  });
});
