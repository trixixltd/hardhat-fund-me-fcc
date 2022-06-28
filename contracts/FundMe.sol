// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.8;

import "./PriceConverter.sol";

/*
In this contract we are going to accomplish three things
1. Get funds from users
2. Withdraw funds
3. Set a minimum funding value in USD
*/
error FundMe__NotOwner();

/** @title A contract for crowd funding
 *  @author Philip Goden
 *  @notice This contract is to demo a sample funding contracts
 *  @dev This implements price feeds as our library
 */
contract FundMe{
    using PriceConverter for uint256; // Allows us to attach/extend uint data type with the functions defined in PriceConversion library as if the data is an object with junctions.

    // Minimum fund abound required
    uint256 public constant MINIMUM_USD = 50 * 1e18; // 1*10**18
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner {
        //require(msg.sender == i_owner, "You are not the owner!. \nOnly the owner can withdraw fund.");
        if(msg.sender != i_owner) {revert FundMe__NotOwner();} // This is more gas efficient than using 'require' keyword.
        _; // this means continue with the rest of the codes
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    /*
    // What happens if someone send this contract ETH without calling the fund function?
    // 'receive' intercepts payments sent to the contract address without using a function, 'fund()' in this case.
    receive() external payable{
        fund();
    }

    // 'fallback' is triggered whenever a call is made to the contact to a non existing feature.
    fallback() external payable {
        fund();
    }
    */

    /**
 *  @notice This function funds this contract
 *  @dev This implements price feeds as our library
 */
    function fund() public payable {
        // How do I send ETH to this contract?
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "Didn't send enough!"); //1 ETH = 1e18 = 1*10^18 = 1000000000000000000 Wei
        // The 'require' keyword is a checker and essentialy means, 
        // if msg.value is not greater than msg.value (or its deriative), display the given message 
        // and roleback any changes.
        // Note: Any unused gas when the require failed is returned to the sender.
        // The unit of msg.value depends of the unit selected for the transaction value.
        // Note: msg.value is the value of the blockchen native token value. ETH in our case.

        // We want to keep track of all addresses from which we have been sent fund.
        s_funders.push(msg.sender); // msg.sender is the address of whoever calls the fund function.
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        
        for(uint idx = 0; idx < s_funders.length; idx++){
            address funder = s_funders[idx];
            s_addressToAmountFunded[funder] = 0;
        }

        // reset the array
        s_funders =  new address[](0);

        // actually withdraw the fund
        // // a. trasfer
        // payable(msg.sender).transfer(address(this).balance);
        // // b. send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // c. call: This is the recommended way for sending and receiving fund. Not gas limit.
        (bool callSuccess,) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        uint256 numberOfFunders = s_funders.length;
        address[] memory funders = s_funders;
        for(uint idx = 0; idx < numberOfFunders; idx++){
            address funder = funders[idx];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders =  new address[](0);

        (bool callSuccess,) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns(address){
        return i_owner;
    }

    function getFunder(uint256 index) public view returns(address){
        return s_funders[index];
    }

    function getAmountFundedByFunder(address funder) public view returns(uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }
}
