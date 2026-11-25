// SPDX-License-Identifier: MIT
// Minimal local cheatcode interface. Signatures match Foundry's cheatcode selectors.
pragma solidity >=0.8.0;

interface Vm {
    function warp(uint256) external;
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function addr(uint256 privateKey) external pure returns (address);
    function sign(uint256 privateKey, bytes32 digest) external pure returns (uint8 v, bytes32 r, bytes32 s);
    function expectRevert() external;
    function expectRevert(bytes4 revertData) external;
    function expectEmit() external;
    function expectEmit(bool, bool, bool, bool) external;
    function expectEmit(bool, bool, bool, bool, address) external;
    function assume(bool) external;
    function targetContract(address) external;
    function envUint(string calldata) external returns (uint256);
    function envAddress(string calldata) external returns (address);
    function envOr(string calldata, uint256) external returns (uint256);
    function toString(bytes32) external pure returns (string memory);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}
