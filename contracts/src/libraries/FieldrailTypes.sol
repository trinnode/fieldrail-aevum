// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title FieldrailTypes
/// @notice Canonical invoice structure and EIP-712 type hash shared by the vault,
///         the contracts client and the MCP server. Never edit the field order:
///         the type hash is part of the signed wire format.
library FieldrailTypes {
    struct Invoice {
        bytes32 programmeId;
        bytes32 invoiceId;
        bytes32 teamId;
        bytes32 categoryId;
        address supplier;
        address token;
        uint256 amount;
        bytes32 evidenceHash;
        uint256 nonce;
        uint256 deadline;
    }

    /// keccak256 of the canonical EIP-712 Invoice type string.
    bytes32 internal constant INVOICE_TYPEHASH = keccak256(
        "Invoice(bytes32 programmeId,bytes32 invoiceId,bytes32 teamId,bytes32 categoryId,address supplier,address token,uint256 amount,bytes32 evidenceHash,uint256 nonce,uint256 deadline)"
    );

    function hash(Invoice memory invoice) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                INVOICE_TYPEHASH,
                invoice.programmeId,
                invoice.invoiceId,
                invoice.teamId,
                invoice.categoryId,
                invoice.supplier,
                invoice.token,
                invoice.amount,
                invoice.evidenceHash,
                invoice.nonce,
                invoice.deadline
            )
        );
    }
}
