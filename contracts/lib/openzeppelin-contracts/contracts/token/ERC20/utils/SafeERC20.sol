// SPDX-License-Identifier: MIT
// Minimal local shim implementing the OpenZeppelin v5.4.0 SafeERC20 surface used here.
pragma solidity >=0.8.0;

import {IERC20} from "../IERC20.sol";

library SafeERC20 {
    error SafeERC20FailedOperation(address token);
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        callOptionalReturn(token, abi.encodeCall(IERC20.transfer, (to, value)));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        callOptionalReturn(token, abi.encodeCall(IERC20.transferFrom, (from, to, value)));
    }

    function callOptionalReturn(IERC20 token, bytes memory data) private {
        if (address(token).code.length == 0) revert SafeERC20FailedOperation(address(token));
        (bool success, bytes memory returndata) = address(token).call(data);
        if (!success) {
            if (returndata.length > 0) {
                assembly {
                    let size := mload(returndata)
                    revert(add(32, returndata), size)
                }
            }
            revert SafeERC20FailedOperation(address(token));
        }
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }
}
