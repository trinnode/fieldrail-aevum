// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { FieldrailFactory } from "../src/FieldrailFactory.sol";
import { FieldrailProgramVault } from "../src/FieldrailProgramVault.sol";
import { FieldrailTypes } from "../src/libraries/FieldrailTypes.sol";
import { TestToken } from "./TestToken.sol";

contract FieldrailProgramVaultTest is Test {
    bytes32 constant WATER = keccak256("WATER_PROCUREMENT");
    bytes32 constant TRANSPORT = keccak256("TRANSPORT_LOGISTICS");
    bytes32 constant NORTH = keccak256("NORTH_ZONE");
    bytes32 constant SOUTH = keccak256("SOUTH_ZONE");
    bytes32 constant PROGRAMME_ID = keccak256("NORTHERN_WATER_ACCESS_DEMO");
    bytes32 constant EVIDENCE = keccak256("evidence: borehole-07 quote");

    address constant SPONSOR = address(0xA11CE);
    address constant AGENT = address(0xB0B);
    address constant OTHER = address(0xD00D);
    uint256 constant SUPPLIER_KEY =
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    TestToken token;
    FieldrailFactory factory;
    FieldrailProgramVault vault;
    address supplier;

    function setUp() public {
        vm.warp(1_760_000_000);
        token = new TestToken();
        factory = new FieldrailFactory();
        supplier = vm.addr(SUPPLIER_KEY);

        token.mint(SPONSOR, 10_000_000e6);
        token.mint(OTHER, 1_000_000e6);

        vm.prank(SPONSOR);
        address v = factory.createProgramme(
            PROGRAMME_ID,
            address(token),
            keccak256("ipfs://demo-metadata"),
            block.timestamp,
            block.timestamp + 30 days
        );
        vault = FieldrailProgramVault(v);
    }

    function _setupPolicy() internal {
        vm.startPrank(SPONSOR);
        token.approve(address(vault), type(uint256).max);
        vault.fund(1000e6);
        vault.configureCategory(WATER, 450e6);
        vault.configureCategory(TRANSPORT, 250e6);
        vault.registerTeam(NORTH, keccak256("north-zone"));
        vault.registerTeam(SOUTH, keccak256("south-zone"));
        vault.allocateTeam(NORTH, WATER, 300e6);
        vault.allocateTeam(SOUTH, WATER, 150e6);
        vault.allocateTeam(NORTH, TRANSPORT, 250e6);
        vault.registerSupplier(supplier, WATER, keccak256("supplier:water-co"));
        vault.authoriseAgent(AGENT, NORTH, WATER, 100e6, 500e6, block.timestamp + 20 days);
        vm.stopPrank();
    }

    function _invoice(uint256 amount, uint256 nonce, bytes32 invoiceId, uint256 deadline)
        internal
        view
        returns (FieldrailTypes.Invoice memory)
    {
        return FieldrailTypes.Invoice({
            programmeId: PROGRAMME_ID,
            invoiceId: invoiceId,
            teamId: NORTH,
            categoryId: WATER,
            supplier: supplier,
            token: address(token),
            amount: amount,
            evidenceHash: EVIDENCE,
            nonce: nonce,
            deadline: deadline
        });
    }

    function _defaultInvoice() internal view returns (FieldrailTypes.Invoice memory) {
        return _invoice(18e6, 1, keccak256("INV-001"), block.timestamp + 1 days);
    }

    /// Compute the EIP-712 digest locally so signing never consumes a one-shot prank.
    function _digest(FieldrailTypes.Invoice memory inv) internal view returns (bytes32) {
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
        return keccak256(abi.encodePacked("\x19\x01", domain, FieldrailTypes.hash(inv)));
    }

    function _sign(FieldrailTypes.Invoice memory inv) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SUPPLIER_KEY, _digest(inv));
        return abi.encodePacked(r, s, v);
    }

    function _pay(FieldrailTypes.Invoice memory inv) internal {
        vm.prank(AGENT);
        vault.payInvoice(inv, _sign(inv));
    }

    // ------------------------------------------------------------------
    // Factory / creation
    // ------------------------------------------------------------------

    function testFactoryCreatesProgramme() public view {
        assertEq(factory.programmeCount(), 1);
        assertEq(factory.vaultOfProgramme(PROGRAMME_ID), address(vault));
        assertEq(vault.sponsor(), SPONSOR);
        assertEq(address(vault.paymentToken()), address(token));
        assertEq(uint256(vault.status()), uint256(FieldrailProgramVault.ProgrammeStatus.Active));
    }

    function testFactoryRejectsDuplicateProgramme() public {
        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailFactory.DuplicateProgramme.selector);
        factory.createProgramme(
            PROGRAMME_ID, address(token), bytes32(0), block.timestamp, block.timestamp + 1 days
        );
    }

    function testProgrammeCannotBeCreatedAlreadyExpired() public {
        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailFactory.InvalidTimeWindow.selector);
        factory.createProgramme(keccak256("other"), address(token), bytes32(0), 0, block.timestamp);
    }

    // ------------------------------------------------------------------
    // Funding and configuration
    // ------------------------------------------------------------------

    function testFundUpdatesAccounting() public {
        _setupPolicy();
        assertEq(vault.totalFunded(), 1000e6);
        assertEq(token.balanceOf(address(vault)), 1000e6);
        assertEq(vault.getFundsRemaining(), 1000e6);
    }

    function testFundOnlySponsor() public {
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.NotSponsor.selector);
        vault.fund(1e6);
    }

    function testCategoryAndAllocationCaps() public {
        _setupPolicy();
        assertEq(vault.categoryCap(WATER), 450e6);
        assertEq(vault.getCategoryRemaining(WATER), 450e6);
        assertEq(vault.teamCategoryCap(NORTH, WATER), 300e6);
        assertEq(vault.getTeamCategoryRemaining(NORTH, WATER), 300e6);
    }

    function testAllocationCannotExceedCategory() public {
        _setupPolicy();
        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailProgramVault.TeamBudgetExceeded.selector);
        vault.allocateTeam(SOUTH, WATER, 400e6);
    }

    function testCannotReduceCategoryBelowSpent() public {
        _setupPolicy();
        _pay(_defaultInvoice());
        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailProgramVault.UnsafeReconfiguration.selector);
        vault.configureCategory(WATER, 10e6);
    }

    function testCannotReduceAllocationBelowSpent() public {
        _setupPolicy();
        _pay(_defaultInvoice());
        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailProgramVault.UnsafeReconfiguration.selector);
        vault.allocateTeam(NORTH, WATER, 10e6);
    }

    // ------------------------------------------------------------------
    // Successful payment
    // ------------------------------------------------------------------

    function testSuccessfulSignedPayment() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();

        _pay(inv);

        assertEq(token.balanceOf(supplier), 18e6);
        assertEq(vault.totalSpent(), 18e6);
        assertEq(vault.categorySpent(WATER), 18e6);
        assertEq(vault.teamCategorySpent(NORTH, WATER), 18e6);
        (,,,,, uint256 mandateSpent,) = vault.mandates(AGENT);
        assertEq(mandateSpent, 18e6);
        assertEq(vault.getFundsRemaining(), 982e6);
        assertTrue(vault.consumedInvoiceIds(keccak256("INV-001")));
        assertTrue(vault.isNonceConsumed(supplier, 1));
    }

    function testAuditorGettersAfterPayment() public {
        _setupPolicy();
        _pay(_defaultInvoice());
        assertEq(vault.getCategoryRemaining(WATER), 432e6);
        assertEq(vault.getTeamCategoryRemaining(NORTH, WATER), 282e6);
        (uint256 perInvoice, uint256 lifetime,, bool active) = vault.getAgentRemaining(AGENT);
        assertEq(perInvoice, 100e6);
        assertEq(lifetime, 482e6);
        assertTrue(active);
    }

    // ------------------------------------------------------------------
    // Signature, identity and scope failures
    // ------------------------------------------------------------------

    function testInvalidSupplierSignature() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80,
            vault.hashInvoice(inv)
        );
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvalidSupplierSignature.selector);
        vault.payInvoice(inv, abi.encodePacked(r, s, v));
    }

    function testWrongProgramme() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.programmeId = keccak256("other");
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.WrongProgramme.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testWrongToken() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.token = OTHER;
        vm.prank(AGENT);
        // Token check happens before signature recovery.
        vm.expectRevert(FieldrailProgramVault.WrongToken.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testWrongTeamScope() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.teamId = SOUTH;
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.AgentScopeMismatch.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testWrongCategoryScope() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.categoryId = TRANSPORT;
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.AgentScopeMismatch.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testUnapprovedSupplierForWater() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.supplier = OTHER;
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.SupplierNotApproved.selector);
        // Signed by an unrelated key; supplier check fires first regardless.
        vault.payInvoice(inv, _sign(inv));
    }

    function testRevokedSupplierCannotBePaid() public {
        _setupPolicy();
        vm.prank(SPONSOR);
        vault.revokeSupplier(supplier, WATER);
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.SupplierNotApproved.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testPayeeMismatchRejected() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.supplier = OTHER;
        // OTHER is not an approved water supplier, so the registry blocks it.
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.SupplierNotApproved.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testPayeeSignatureMustMatchRegisteredSupplier() public {
        _setupPolicy();
        // Approve OTHER for water as well, then sign with the wrong key.
        vm.prank(SPONSOR);
        vault.registerSupplier(OTHER, WATER, keccak256("other-supplier"));
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        inv.supplier = OTHER;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SUPPLIER_KEY, vault.hashInvoice(inv));
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvalidSupplierSignature.selector);
        vault.payInvoice(inv, abi.encodePacked(r, s, v));
    }

    // ------------------------------------------------------------------
    // Agent mandate failures
    // ------------------------------------------------------------------

    function testUnknownAgentCannotPay() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        vm.prank(OTHER);
        vm.expectRevert(FieldrailProgramVault.UnauthorisedAgent.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testRevokedAgentCannotPay() public {
        _setupPolicy();
        vm.prank(SPONSOR);
        vault.revokeAgent(AGENT);
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.AgentNotActive.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testExpiredAgentCannotPay() public {
        _setupPolicy();
        vm.warp(block.timestamp + 21 days);
        FieldrailTypes.Invoice memory inv =
            _invoice(18e6, 1, keccak256("INV-002"), block.timestamp + 1 days);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.AgentExpired.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testPerInvoiceCapBreach() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv =
            _invoice(101e6, 1, keccak256("INV-003"), block.timestamp + 1 days);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.PerInvoiceCapExceeded.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testCumulativeCapBreach() public {
        _setupPolicy();
        vm.prank(SPONSOR);
        vault.authoriseAgent(AGENT, NORTH, WATER, 30e6, 30e6, block.timestamp + 20 days);
        FieldrailTypes.Invoice memory first =
            _invoice(18e6, 1, keccak256("INV-004A"), block.timestamp + 1 days);
        _pay(first);
        FieldrailTypes.Invoice memory inv =
            _invoice(18e6, 2, keccak256("INV-004B"), block.timestamp + 1 days);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.AgentCumulativeCapExceeded.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    // ------------------------------------------------------------------
    // Budget failures
    // ------------------------------------------------------------------

    function testCategoryBudgetExhausted() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv =
            _invoice(100e6, 1, keccak256("INV-005"), block.timestamp + 1 days);
        vm.startPrank(SPONSOR);
        vault.configureCategory(WATER, 700e6);
        vault.allocateTeam(NORTH, WATER, 500e6);
        vault.authoriseAgent(AGENT, NORTH, WATER, 500e6, 1000e6, block.timestamp + 20 days);
        vm.stopPrank();
        for (uint256 i; i < 5; i++) {
            inv.nonce = i + 1;
            inv.invoiceId = keccak256(abi.encode("INV-005", i));
            _pay(inv);
        }
        inv.nonce = 99;
        inv.invoiceId = keccak256("INV-006");
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.TeamBudgetExceeded.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testProgrammeBudgetExhausted() public {
        _setupPolicy();
        vm.startPrank(SPONSOR);
        vault.configureCategory(WATER, 2500e6);
        vault.allocateTeam(NORTH, WATER, 2000e6);
        vault.authoriseAgent(AGENT, NORTH, WATER, 2000e6, 2000e6, block.timestamp + 20 days);
        vm.stopPrank();
        FieldrailTypes.Invoice memory inv =
            _invoice(1000e6, 1, keccak256("INV-007"), block.timestamp + 1 days);
        _pay(inv);
        inv.amount = 1e6;
        inv.nonce = 2;
        inv.invoiceId = keccak256("INV-008");
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.ProgrammeBudgetExceeded.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    // ------------------------------------------------------------------
    // Invoice validity / replay
    // ------------------------------------------------------------------

    function testZeroAmountRejected() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv =
            _invoice(0, 1, keccak256("INV-009"), block.timestamp + 1 days);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.AmountZero.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testExpiredInvoiceRejected() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv =
            _invoice(18e6, 1, keccak256("INV-010"), block.timestamp - 1);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvoiceExpired.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testExpiredProgrammeRejected() public {
        _setupPolicy();
        vm.warp(block.timestamp + 31 days);
        FieldrailTypes.Invoice memory inv =
            _invoice(18e6, 1, keccak256("INV-011"), block.timestamp + 1 days);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.ProgrammeExpired.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testInvoiceIdReplayRejected() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        _pay(inv);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvoiceAlreadyUsed.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testNonceReplayRejected() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        _pay(inv);
        inv.invoiceId = keccak256("INV-012");
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.NonceAlreadyUsed.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testSignatureCannotReplayAcrossVaults() public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        bytes memory sig = _sign(inv);

        // Deploy a second vault directly with the SAME programme id so the
        // domain-separated supplier signature is the only thing that can differ.
        vm.prank(SPONSOR);
        FieldrailProgramVault vault2 = new FieldrailProgramVault(
            PROGRAMME_ID,
            SPONSOR,
            address(token),
            bytes32(0),
            block.timestamp,
            block.timestamp + 30 days
        );
        vm.startPrank(SPONSOR);
        token.approve(address(vault2), type(uint256).max);
        vault2.fund(1000e6);
        vault2.configureCategory(WATER, 450e6);
        vault2.registerTeam(NORTH, bytes32(0));
        vault2.allocateTeam(NORTH, WATER, 300e6);
        vault2.registerSupplier(supplier, WATER, bytes32(0));
        vault2.authoriseAgent(AGENT, NORTH, WATER, 100e6, 500e6, block.timestamp + 20 days);
        vm.stopPrank();

        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvalidSupplierSignature.selector);
        vault2.payInvoice(inv, sig);
    }

    // ------------------------------------------------------------------
    // Lifecycle / no arbitrary agent transfer
    // ------------------------------------------------------------------

    function testPauseBlocksAndResumeRestores() public {
        _setupPolicy();
        vm.prank(SPONSOR);
        vault.pauseProgramme();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.ProgrammeNotActive.selector);
        vault.payInvoice(inv, _sign(inv));

        vm.prank(SPONSOR);
        vault.resumeProgramme();
        _pay(inv);
        assertEq(token.balanceOf(supplier), 18e6);
    }

    function testCloseBlocksPayments() public {
        _setupPolicy();
        vm.prank(SPONSOR);
        vault.closeProgramme();
        FieldrailTypes.Invoice memory inv = _defaultInvoice();
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.ProgrammeNotActive.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testRefundOnlyAfterCloseAndOnlySponsor() public {
        _setupPolicy();
        _pay(_defaultInvoice());

        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailProgramVault.ProgrammeNotActive.selector);
        vault.refundUnspent();

        vm.prank(SPONSOR);
        vault.closeProgramme();

        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.NotSponsor.selector);
        vault.refundUnspent();

        uint256 before = token.balanceOf(SPONSOR);
        vm.prank(SPONSOR);
        vault.refundUnspent();
        assertEq(token.balanceOf(SPONSOR) - before, 982e6);
        assertEq(vault.getFundsRemaining(), 0);

        vm.prank(SPONSOR);
        vm.expectRevert(FieldrailProgramVault.NothingToRefund.selector);
        vault.refundUnspent();
    }

    function testAgentHasNoArbitraryTransferPath() public {
        _setupPolicy();
        vm.prank(AGENT);
        (bool ok,) =
            address(vault).call(abi.encodeWithSignature("transfer(address,uint256)", OTHER, 1e6));
        assertFalse(ok);
        assertEq(token.balanceOf(OTHER), 1_000_000e6);
    }

    function testAgentCannotFundOrCloseOrRefund() public {
        _setupPolicy();
        vm.startPrank(AGENT);
        vm.expectRevert(FieldrailProgramVault.NotSponsor.selector);
        vault.fund(1e6);
        vm.expectRevert(FieldrailProgramVault.NotSponsor.selector);
        vault.closeProgramme();
        vm.expectRevert(FieldrailProgramVault.NotSponsor.selector);
        vault.refundUnspent();
        vm.stopPrank();
    }

    // ------------------------------------------------------------------
    // Fuzz tests
    // ------------------------------------------------------------------

    function testFuzz_PaymentWithinRemainingBudgets(uint96 rawAmount) public {
        _setupPolicy();
        uint256 amount = bound(rawAmount, 1e6, 100e6);
        FieldrailTypes.Invoice memory inv =
            _invoice(amount, 7, keccak256("FUZZ-INV"), block.timestamp + 1 days);
        _pay(inv);
        assertEq(token.balanceOf(supplier), amount);
        assertEq(vault.totalSpent(), amount);
        assertLe(vault.totalSpent(), vault.totalFunded());
        assertLe(vault.categorySpent(WATER), vault.categoryCap(WATER));
        assertLe(vault.teamCategorySpent(NORTH, WATER), vault.teamCategoryCap(NORTH, WATER));
    }

    function testFuzz_PerInvoiceCapAlwaysEnforced(uint96 rawAmount) public {
        _setupPolicy();
        uint256 amount = bound(rawAmount, 101e6, 10_000e6);
        FieldrailTypes.Invoice memory inv =
            _invoice(amount, 8, keccak256("FUZZ-CAP"), block.timestamp + 1 days);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.PerInvoiceCapExceeded.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testFuzz_DeadlineAlwaysEnforced(uint64 delta) public {
        _setupPolicy();
        uint256 deadline = block.timestamp - bound(delta, 1, 1000);
        FieldrailTypes.Invoice memory inv = _invoice(18e6, 9, keccak256("FUZZ-DEADLINE"), deadline);
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.InvoiceExpired.selector);
        vault.payInvoice(inv, _sign(inv));
    }

    function testFuzz_NonceReplayAlwaysRejected(uint256 nonce) public {
        _setupPolicy();
        FieldrailTypes.Invoice memory inv =
            _invoice(18e6, nonce, keccak256("FUZZ-NONCE"), block.timestamp + 1 days);
        _pay(inv);
        inv.invoiceId = keccak256("FUZZ-NONCE-2");
        vm.prank(AGENT);
        vm.expectRevert(FieldrailProgramVault.NonceAlreadyUsed.selector);
        vault.payInvoice(inv, _sign(inv));
    }
}
