//SPDX-License-Identifier: mit
pragma solidity >=0.6.2 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CustomCoin is ERC20 {
    string private TOKEN_NAME = "Wrapped Finance";
    string private TOKEN_SYMBOL = "wFIN";

    uint8 private constant TOKEN_DECIMALS = 2;
    uint256 private constant TOTAL_SUPPLY = 1000000 * (10**TOKEN_DECIMALS);

    constructor() ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        _setupDecimals(TOKEN_DECIMALS);
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
