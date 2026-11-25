// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FieldrailFactory } from "../src/FieldrailFactory.sol";
import { FieldrailProgramVault } from "../src/FieldrailProgramVault.sol";
import { FieldrailTypes } from "../src/libraries/FieldrailTypes.sol";

/// Runs with `forge test --fork-url https://rpc-test.qday.info --hardfork shanghai`
/// against live Aevum state. It uses the REAL tUSD8 contract, moved from a
/// discovered holder onto a throwaway test sponsor via fork impersonation.
/// This is a fork simulation, NOT a live testnet transaction.
contract ForkJourneyTest is Test {
    IERC20 constant TUSD8 = IERC20(0x456569838f1d43009A91ebA4263147Afd7233483);
    address constant HOLDER = 0xc443F0f480AA802fA3EA1d883a5185a8382f87Ca;

    address constant SPONSOR = address(0xA11CE);
    address constant AGENT = address(0xB0B);
    uint256 constant SUPPLIER_KEY =
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    bytes32 constant PROGRAMME_ID = keccak256("NORTHERN_WATER_ACCESS_DEMO");
    bytes32 constant WATER = keccak256("WATER_PROCUREMENT");
    bytes32 constant NORTH = keccak256("NORTH_ZONE");

    function testRealTUSD8JourneyOnAevumFork() public {
        // No fork URL configured (plain local run): skip rather than fail.
        if (address(TUSD8).code.length == 0) return;
        require(TUSD8.decimals() == 6, "tUSD8 decimals are not 6");

        // Move real test tokens from a discovered holder onto the sponsor.
        console2.log("holder balance (fork):", TUSD8.balanceOf(HOLDER));
        vm.prank(HOLDER);
        TUSD8.transfer(SPONSOR, 20e6);
        assertGe(TUSD8.balanceOf(SPONSOR), 20e6);

        FieldrailFactory factory = new FieldrailFactory();
        vm.prank(SPONSOR);
        FieldrailProgramVault vault = FieldrailProgramVault(
            factory.createProgramme(
                PROGRAMME_ID,
                address(TUSD8),
                keccak256("ipfs://fork-demo"),
                0,
                block.timestamp + 30 days
            )
        );

        vm.startPrank(SPONSOR);
        TUSD8.approve(address(vault), type(uint256).max);
        vault.fund(20e6);
        vault.configureCategory(WATER, 10e6);
        vault.registerTeam(NORTH, bytes32(0));
        vault.allocateTeam(NORTH, WATER, 10e6);
        vault.registerSupplier(vm.addr(SUPPLIER_KEY), WATER, keccak256("supplier:fork-water"));
        vault.authoriseAgent(AGENT, NORTH, WATER, 5e6, 10e6, block.timestamp + 20 days);
        vm.stopPrank();

        FieldrailTypes.Invoice memory inv = FieldrailTypes.Invoice({
            programmeId: PROGRAMME_ID,
            invoiceId: keccak256("FORK-INV-001"),
            teamId: NORTH,
            categoryId: WATER,
            supplier: vm.addr(SUPPLIER_KEY),
            token: address(TUSD8),
            amount: 1e6,
            evidenceHash: keccak256("evidence:fork-quote"),
            nonce: 1,
            deadline: block.timestamp + 1 days
        });

        bytes32 domain = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256("FieldrailProgramVault"),
                keccak256("1"),
                block.chainid,
                address(vault)
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domain, FieldrailTypes.hash(inv)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SUPPLIER_KEY, digest);

        uint256 supplierBefore = TUSD8.balanceOf(vm.addr(SUPPLIER_KEY));
        vm.prank(AGENT);
        vault.payInvoice(inv, abi.encodePacked(r, s, v));

        assertEq(TUSD8.balanceOf(vm.addr(SUPPLIER_KEY)) - supplierBefore, 1e6);
        assertEq(vault.totalSpent(), 1e6);
        assertEq(TUSD8.balanceOf(address(vault)), 19e6);

        // A second attempt with the same invoice must be rejected by the contract.
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvoiceAlreadyUsed.selector);
        vault.payInvoice(inv, abi.encodePacked(r, s, v));
    }
}
