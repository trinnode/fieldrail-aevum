// SPDX-License-Identifier: MIT
// Minimal local shim equivalent to OpenZeppelin v5.4.0 ReentrancyGuard.
pragma solidity >=0.8.0;

abstract contract ReentrancyGuard {
    uint256 private _status;
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = 1;
    }

    modifier nonReentrant() {
        if (_status == 2) revert ReentrancyGuardReentrantCall();
        _status = 2;
        _;
        _status = 1;
    }
}
