// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {

    function getPrice(AggregatorV3Interface _priceFeed) internal view returns(uint256) {
        (, int256 price,,,) = _priceFeed.latestRoundData();
        //ETH in terms of USD, to 18 decimal places (e.g. 3000000000000000000000 = 3000.000000000000000000 = 3000e18)
        // 300000000000 == 3000.00000000
        return uint256(price * 1e10); // (price ** 10) == (price * 10000000000); 
    }

    function getVersion() internal view returns(uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
        return priceFeed.version();
    }

    function getConversionRate(uint256 _ethAmount, AggregatorV3Interface _priceFeed) internal view returns(uint256) {
        uint256 ethPrice = getPrice(_priceFeed); // Get the price of ETH, in USD, with the last 18 numbers representing the decimal numbers.
        uint256 ethAmountInUSD = (ethPrice * _ethAmount) / 1e18;
        return ethAmountInUSD;
    }

}