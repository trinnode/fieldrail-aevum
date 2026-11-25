// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Vm } from "forge-std/Vm.sol";
import { FieldrailFactory } from "../src/FieldrailFactory.sol";
import { FieldrailProgramVault } from "../src/FieldrailProgramVault.sol";
import { FieldrailTypes } from "../src/libraries/FieldrailTypes.sol";
import { TestToken } from "./TestToken.sol";

/// Handler used by the invariant campaign. Every action is a bounded, realistic
/// attempt; expected policy failures are caught so the campaign keeps exploring.
contract VaultHandler {
    Vm constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    bytes32 constant WATER = keccak256("WATER_PROCUREMENT");
    bytes32 constant NORTH = keccak256("NORTH_ZONE");
    bytes32 constant PROGRAMME_ID = keccak256("INVARIANT_PROGRAMME");

    FieldrailProgramVault public vault;
    TestToken public token;
    address public sponsor;
    address public agent;
    address public supplier;
    uint256 public supplierKey;
    uint256 public nonceCounter;
    bool public revoked;

    constructor(
        FieldrailProgramVault v,
        TestToken t,
        address sponsor_,
        address agent_,
        uint256 key_
    ) {
        vault = v;
        token = t;
        sponsor = sponsor_;
        agent = agent_;
        supplierKey = key_;
        supplier = vm.addr(key_);
    }

    function pay(uint96 rawAmount, uint96 rawNonce) public {
        uint256 amount = 1e6 + (rawAmount % 60e6);
        nonceCounter++;
        uint256 nonce = nonceCounter;
        if (rawNonce % 7 == 0) nonce = nonce + 1_000_000; // occasionally jump nonces
        FieldrailTypes.Invoice memory inv = FieldrailTypes.Invoice({
            programmeId: PROGRAMME_ID,
            invoiceId: keccak256(abi.encode("INV", nonce, rawAmount)),
            teamId: NORTH,
            categoryId: WATER,
            supplier: supplier,
            token: address(token),
            amount: amount,
            evidenceHash: keccak256("evidence"),
            nonce: nonce,
            deadline: block.timestamp + 1000
        });
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(supplierKey, vault.hashInvoice(inv));
        vm.prank(agent);
        try vault.payInvoice(inv, abi.encodePacked(r, s, v)) { } catch { }
    }

    function tryRevokeAgent() public {
        if (revoked) return;
        revoked = true;
        vm.prank(sponsor);
        vault.revokeAgent(agent);
    }
}

contract FieldrailInvariantsTest is Test {
    bytes32 constant WATER = keccak256("WATER_PROCUREMENT");
    bytes32 constant TRANSPORT = keccak256("TRANSPORT_LOGISTICS");
    bytes32 constant NORTH = keccak256("NORTH_ZONE");
    bytes32 constant PROGRAMME_ID = keccak256("INVARIANT_PROGRAMME");

    address constant SPONSOR = address(0xA11CE);
    address constant AGENT = address(0xB0B);
    address constant UNAPPROVED = address(0xD00D);
    uint256 constant SUPPLIER_KEY =
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    TestToken token;
    FieldrailProgramVault vault;
    VaultHandler handler;

    function setUp() public {
        vm.warp(1_760_000_000);
        token = new TestToken();
        FieldrailFactory factory = new FieldrailFactory();
        token.mint(SPONSOR, 10_000_000e6);
        token.mint(UNAPPROVED, 5_000e6);

        vm.prank(SPONSOR);
        vault = FieldrailProgramVault(
            factory.createProgramme(
                PROGRAMME_ID, address(token), bytes32(0), block.timestamp, block.timestamp + 30 days
            )
        );

        vm.startPrank(SPONSOR);
        token.approve(address(vault), type(uint256).max);
        vault.fund(1000e6);
        vault.configureCategory(WATER, 450e6);
        vault.configureCategory(TRANSPORT, 250e6);
        vault.registerTeam(NORTH, bytes32(0));
        vault.allocateTeam(NORTH, WATER, 300e6);
        vault.registerSupplier(vm.addr(SUPPLIER_KEY), WATER, bytes32(0));
        vault.authoriseAgent(AGENT, NORTH, WATER, 60e6, 500e6, block.timestamp + 20 days);
        vm.stopPrank();

        handler = new VaultHandler(vault, token, SPONSOR, AGENT, SUPPLIER_KEY);
    }

    /// Long fuzz campaign: every step is followed by all invariants. Using an
    /// explicit loop keeps the campaign portable across Foundry versions that
    /// no longer expose the `targetContract` cheatcode.
    function testFuzz_InvariantsHoldAcrossManyPayments(uint256 seed) public {
        for (uint256 i = 0; i < 12; i++) {
            uint256 r = uint256(keccak256(abi.encode(seed, i)));
            // Truncation is intentional: bounded fuzz inputs, not money values.
            // forge-lint: disable-next-line(unsafe-typecast)
            handler.pay(uint96(r), uint96(r >> 32));
            if (i == 6) handler.tryRevokeAgent();
            _checkInvariants();
        }
    }

    function _checkInvariants() internal view {
        assertLe(vault.totalSpent(), vault.totalFunded());
        assertLe(vault.categorySpent(WATER), vault.categoryCap(WATER));
        assertLe(vault.teamCategorySpent(NORTH, WATER), vault.teamCategoryCap(NORTH, WATER));
        (,,,, uint256 cumulativeCap, uint256 spent,) = vault.mandates(AGENT);
        assertLe(spent, cumulativeCap);
        assertEq(token.balanceOf(UNAPPROVED), 5_000e6);
        assertGe(token.balanceOf(address(vault)), vault.getFundsRemaining());
    }
}
