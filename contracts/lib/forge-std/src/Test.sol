// SPDX-License-Identifier: MIT
// Minimal local Test base compatible with the subset of forge-std used here.
pragma solidity >=0.8.0;

import {Vm} from "./Vm.sol";

abstract contract Test {
    Vm internal constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    function assertEq(uint256 a, uint256 b) internal pure {
        require(a == b, "assertEq(uint256) failed");
    }

    function assertEq(address a, address b) internal pure {
        require(a == b, "assertEq(address) failed");
    }

    function assertEq(bool a, bool b) internal pure {
        require(a == b, "assertEq(bool) failed");
    }

    function assertEq(bytes32 a, bytes32 b) internal pure {
        require(a == b, "assertEq(bytes32) failed");
    }

    function assertLe(uint256 a, uint256 b) internal pure {
        require(a <= b, "assertLe failed");
    }

    function assertGe(uint256 a, uint256 b) internal pure {
        require(a >= b, "assertGe failed");
    }

    function assertTrue(bool a) internal pure {
        require(a, "assertTrue failed");
    }

    function assertFalse(bool a) internal pure {
        require(!a, "assertFalse failed");
    }

    function bound(uint256 value, uint256 low, uint256 high) internal pure returns (uint256) {
        if (low > high) revert("bound: low > high");
        uint256 range = high - low + 1;
        return low + (value % range);
    }

    function targetContract(address target) internal {
        vm.targetContract(target);
    }
}
