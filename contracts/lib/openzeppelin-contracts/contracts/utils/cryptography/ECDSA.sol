// SPDX-License-Identifier: MIT
// Minimal local shim equivalent to OpenZeppelin v5.4.0 ECDSA (65-byte, low-s).
pragma solidity >=0.8.0;

library ECDSA {
    error ECDSAInvalidSignature();
    error ECDSAInvalidSignatureLength(uint256 length);
    error ECDSAInvalidSignatureS(bytes32 s);

    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, signature);
        if (error != RecoverError.NoError) {
            if (error == RecoverError.InvalidSignatureLength) revert ECDSAInvalidSignatureLength(uint256(errorArg));
            if (error == RecoverError.InvalidSignatureS) revert ECDSAInvalidSignatureS(errorArg);
            revert ECDSAInvalidSignature();
        }
        return recovered;
    }

    enum RecoverError {
        NoError,
        InvalidSignature,
        InvalidSignatureLength,
        InvalidSignatureS
    }

    function tryRecover(bytes32 hash, bytes memory signature)
        internal
        pure
        returns (address recovered, RecoverError err, bytes32 errorArg)
    {
        if (signature.length != 65) return (address(0), RecoverError.InvalidSignatureLength, bytes32(uint256(signature.length)));
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return (address(0), RecoverError.InvalidSignatureS, s);
        }
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) return (address(0), RecoverError.InvalidSignature, bytes32(0));
        return (signer, RecoverError.NoError, bytes32(0));
    }
}
