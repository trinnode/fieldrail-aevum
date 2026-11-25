// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { FieldrailProgramVault } from "./FieldrailProgramVault.sol";

/// @title FieldrailFactory
/// @notice Discovery registry. It deploys programme vaults but never owns,
///         custodies or controls programme funds.
contract FieldrailFactory {
    address[] private _programmes;
    mapping(bytes32 => address) public vaultOfProgramme;

    event ProgramCreated(
        bytes32 indexed programmeId,
        address indexed vault,
        address indexed sponsor,
        address token,
        bytes32 metadataHash
    );

    error InvalidProgrammeId();
    error DuplicateProgramme();
    error InvalidTimeWindow();

    function createProgramme(
        bytes32 programmeId,
        address token,
        bytes32 metadataHash,
        uint256 startAt,
        uint256 expiresAt
    ) external returns (address vault) {
        if (programmeId == bytes32(0)) revert InvalidProgrammeId();
        if (vaultOfProgramme[programmeId] != address(0)) revert DuplicateProgramme();
        if (expiresAt <= block.timestamp || (startAt > 0 && startAt >= expiresAt)) {
            revert InvalidTimeWindow();
        }

        vault = address(
            new FieldrailProgramVault(
                programmeId, msg.sender, token, metadataHash, startAt, expiresAt
            )
        );
        _programmes.push(vault);
        vaultOfProgramme[programmeId] = vault;

        emit ProgramCreated(programmeId, vault, msg.sender, token, metadataHash);
    }

    function getProgrammes() external view returns (address[] memory) {
        return _programmes;
    }

    function programmeCount() external view returns (uint256) {
        return _programmes.length;
    }
}
