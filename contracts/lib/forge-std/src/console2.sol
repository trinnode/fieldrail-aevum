// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

library console2 {
    address private constant CONSOLE = 0x000000000000000000636F6e736F6c652e6c6f67;

    function log(string memory p0, address p1) internal view {
        _call(abi.encodeWithSignature("log(string,address)", p0, p1));
    }

    function log(string memory p0, uint256 p1) internal view {
        _call(abi.encodeWithSignature("log(string,uint256)", p0, p1));
    }

    function log(string memory p0) internal view {
        _call(abi.encodeWithSignature("log(string)", p0));
    }

    function log(string memory p0, string memory p1) internal view {
        _call(abi.encodeWithSignature("log(string,string)", p0, p1));
    }

    function _call(bytes memory data) private view {
        assembly {
            let success := staticcall(gas(), CONSOLE, add(data, 0x20), mload(data), 0, 0)
            success := success
        }
    }
}
