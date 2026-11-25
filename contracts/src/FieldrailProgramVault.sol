// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { FieldrailTypes } from "./libraries/FieldrailTypes.sol";

/// @title FieldrailProgramVault
/// @notice One restricted programme. Sponsor-controlled configuration; the only
///         ordinary payment path is a supplier-signed invoice submitted by a
///         narrowly scoped agent mandate. There is deliberately no generic
///         transfer method for agents.
contract FieldrailProgramVault is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum ProgrammeStatus {
        Active,
        Paused,
        Closed
    }

    struct SupplierInfo {
        bool active;
        bytes32 metadataHash;
        uint256 registeredAt;
    }

    struct AgentMandate {
        bool active;
        bytes32 teamId;
        bytes32 categoryId;
        uint256 perInvoiceCap;
        uint256 cumulativeCap;
        uint256 spent;
        uint256 expiresAt;
    }

    // ---------------------------------------------------------------------
    // Immutable programme identity
    // ---------------------------------------------------------------------
    bytes32 public immutable programmeId;
    address public immutable sponsor;
    IERC20 public immutable paymentToken;
    bytes32 public immutable programmeMetadataHash;
    uint256 public immutable startAt;
    uint256 public immutable expiresAt;

    // ---------------------------------------------------------------------
    // Mutable accounting / policy state
    // ---------------------------------------------------------------------
    ProgrammeStatus public status;
    uint256 public totalFunded;
    uint256 public totalSpent;
    uint256 public refunded;
    uint256 public closedAt;

    uint256 public totalCategoryCaps;

    mapping(bytes32 => uint256) public categoryCap;
    mapping(bytes32 => uint256) public categorySpent;
    mapping(bytes32 => uint256) public categoryAllocated;

    mapping(bytes32 => bool) public teamRegistered;
    mapping(bytes32 => bytes32) public teamMetadataHash;
    mapping(bytes32 => mapping(bytes32 => uint256)) public teamCategoryCap;
    mapping(bytes32 => mapping(bytes32 => uint256)) public teamCategorySpent;

    mapping(address => mapping(bytes32 => SupplierInfo)) public suppliers;

    mapping(address => AgentMandate) public mandates;

    mapping(bytes32 => bool) public consumedInvoiceIds;
    mapping(address => mapping(uint256 => bool)) public consumedNonces;

    // ---------------------------------------------------------------------
    // Events — the immutable audit trail
    // ---------------------------------------------------------------------
    event ProgramFunded(
        bytes32 indexed programmeId, address indexed sponsor, uint256 amount, uint256 totalFunded
    );
    event CategoryConfigured(bytes32 indexed categoryId, uint256 cap);
    event TeamRegistered(bytes32 indexed teamId, bytes32 metadataHash);
    event TeamAllocationConfigured(bytes32 indexed teamId, bytes32 indexed categoryId, uint256 cap);
    event SupplierRegistered(
        address indexed supplier, bytes32 indexed categoryId, bytes32 metadataHash
    );
    event SupplierRevoked(address indexed supplier, bytes32 indexed categoryId);
    event AgentAuthorised(
        address indexed agent,
        bytes32 indexed teamId,
        bytes32 indexed categoryId,
        uint256 perInvoiceCap,
        uint256 cumulativeCap,
        uint256 expiresAt
    );
    event AgentRevoked(address indexed agent);
    event InvoicePaid(
        bytes32 indexed invoiceId,
        bytes32 indexed programmeId,
        bytes32 indexed teamId,
        bytes32 categoryId,
        address supplier,
        address agent,
        uint256 amount,
        bytes32 evidenceHash,
        uint256 nonce
    );
    event ProgrammePaused(bytes32 indexed programmeId, address indexed sponsor);
    event ProgrammeResumed(bytes32 indexed programmeId, address indexed sponsor);
    event ProgrammeClosed(bytes32 indexed programmeId, uint256 closedAt, uint256 unspent);
    event Refunded(bytes32 indexed programmeId, address indexed sponsor, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors — machine readable, mapped to plain language by the UI/MCP
    // ---------------------------------------------------------------------
    error NotSponsor();
    error ProgrammeNotActive();
    error ProgrammeNotStarted();
    error ProgrammeExpired();
    error InvoiceExpired();
    error UnauthorisedAgent();
    error AgentNotActive();
    error AgentExpired();
    error AgentScopeMismatch();
    error PerInvoiceCapExceeded();
    error AgentCumulativeCapExceeded();
    error SupplierNotApproved();
    error SupplierMismatch();
    error WrongProgramme();
    error WrongToken();
    error InvalidSupplierSignature();
    error AmountZero();
    error InvoiceAlreadyUsed();
    error NonceAlreadyUsed();
    error CategoryBudgetExceeded();
    error TeamBudgetExceeded();
    error ProgrammeBudgetExceeded();
    error InsufficientTokenBalance();
    error CategoryUnknown();
    error TeamUnknown();
    error InvalidCap();
    error InvalidAddress();
    error InvalidTimeWindow();
    error UnsafeReconfiguration();
    error AlreadyClosed();
    error NothingToRefund();

    modifier onlySponsor() {
        _onlySponsor();
        _;
    }

    modifier notClosed() {
        _notClosed();
        _;
    }

    function _onlySponsor() internal view {
        if (msg.sender != sponsor) revert NotSponsor();
    }

    function _notClosed() internal view {
        if (status == ProgrammeStatus.Closed) revert AlreadyClosed();
    }

    constructor(
        bytes32 programmeId_,
        address sponsor_,
        address token_,
        bytes32 metadataHash_,
        uint256 startAt_,
        uint256 expiresAt_
    ) EIP712("FieldrailProgramVault", "1") {
        if (programmeId_ == bytes32(0) || sponsor_ == address(0) || token_ == address(0)) revert InvalidAddress();
        if (expiresAt_ <= block.timestamp || (startAt_ > 0 && startAt_ >= expiresAt_)) {
            revert InvalidTimeWindow();
        }
        programmeId = programmeId_;
        sponsor = sponsor_;
        paymentToken = IERC20(token_);
        programmeMetadataHash = metadataHash_;
        startAt = startAt_;
        expiresAt = expiresAt_;
        status = ProgrammeStatus.Active;
    }

    /// Deterministic domain, overridden so clients never depend on library defaults.
    function eip712Domain()
        public
        view
        override
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        )
    {
        return (
            hex"0f",
            "FieldrailProgramVault",
            "1",
            block.chainid,
            address(this),
            bytes32(0),
            new uint256[](0)
        );
    }

    /// Digest a client must ask the supplier to sign. Includes chain ID and this
    /// vault address, so a signature cannot replay on another vault or chain.
    function hashInvoice(FieldrailTypes.Invoice calldata invoice) public view returns (bytes32) {
        return _hashTypedDataV4(FieldrailTypes.hash(invoice));
    }

    // ---------------------------------------------------------------------
    // Sponsor configuration
    // ---------------------------------------------------------------------

    function fund(uint256 amount) external nonReentrant onlySponsor notClosed {
        if (amount == 0) revert AmountZero();
        uint256 beforeBalance = paymentToken.balanceOf(address(this));
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = paymentToken.balanceOf(address(this)) - beforeBalance;
        if (received == 0) revert AmountZero();
        totalFunded += received;
        emit ProgramFunded(programmeId, sponsor, received, totalFunded);
    }

    function configureCategory(bytes32 categoryId, uint256 cap) external onlySponsor notClosed {
        if (categoryId == bytes32(0)) revert InvalidCap();
        uint256 oldCap = categoryCap[categoryId];
        uint256 spent = categorySpent[categoryId];
        // A live category may only be raised, never cut below what is already
        // committed or spent. This is the explicit safe reconfiguration rule.
        if (spent > 0 && cap < oldCap) revert UnsafeReconfiguration();
        if (cap < spent || cap < categoryAllocated[categoryId]) revert InvalidCap();
        totalCategoryCaps = totalCategoryCaps - oldCap + cap;
        categoryCap[categoryId] = cap;
        emit CategoryConfigured(categoryId, cap);
    }

    function registerTeam(bytes32 teamId, bytes32 metadataHash) external onlySponsor notClosed {
        if (teamId == bytes32(0)) revert TeamUnknown();
        teamRegistered[teamId] = true;
        teamMetadataHash[teamId] = metadataHash;
        emit TeamRegistered(teamId, metadataHash);
    }

    function allocateTeam(bytes32 teamId, bytes32 categoryId, uint256 cap)
        external
        onlySponsor
        notClosed
    {
        if (!teamRegistered[teamId]) revert TeamUnknown();
        if (categoryCap[categoryId] == 0) revert CategoryUnknown();
        uint256 oldCap = teamCategoryCap[teamId][categoryId];
        uint256 spent = teamCategorySpent[teamId][categoryId];
        uint256 newAllocated = categoryAllocated[categoryId] - oldCap + cap;
        if (newAllocated > categoryCap[categoryId]) revert TeamBudgetExceeded();
        if (cap < spent || (spent > 0 && cap < oldCap)) revert UnsafeReconfiguration();
        teamCategoryCap[teamId][categoryId] = cap;
        categoryAllocated[categoryId] = newAllocated;
        emit TeamAllocationConfigured(teamId, categoryId, cap);
    }

    function registerSupplier(address supplier, bytes32 categoryId, bytes32 metadataHash)
        external
        onlySponsor
        notClosed
    {
        if (supplier == address(0)) revert InvalidAddress();
        if (categoryCap[categoryId] == 0) revert CategoryUnknown();
        suppliers[supplier][categoryId] = SupplierInfo({
            active: true, metadataHash: metadataHash, registeredAt: block.timestamp
        });
        emit SupplierRegistered(supplier, categoryId, metadataHash);
    }

    function revokeSupplier(address supplier, bytes32 categoryId) external onlySponsor {
        if (suppliers[supplier][categoryId].registeredAt == 0) revert SupplierNotApproved();
        suppliers[supplier][categoryId].active = false;
        emit SupplierRevoked(supplier, categoryId);
    }

    function authoriseAgent(
        address agent,
        bytes32 teamId,
        bytes32 categoryId,
        uint256 perInvoiceCap,
        uint256 cumulativeCap,
        uint256 expiresAt_
    ) external onlySponsor notClosed {
        if (agent == address(0)) revert InvalidAddress();
        if (!teamRegistered[teamId]) revert TeamUnknown();
        if (teamCategoryCap[teamId][categoryId] == 0) revert TeamBudgetExceeded();
        if (perInvoiceCap == 0 || cumulativeCap == 0 || perInvoiceCap > cumulativeCap) {
            revert InvalidCap();
        }
        if (expiresAt_ <= block.timestamp) revert InvalidTimeWindow();
        mandates[agent] = AgentMandate({
            active: true,
            teamId: teamId,
            categoryId: categoryId,
            perInvoiceCap: perInvoiceCap,
            cumulativeCap: cumulativeCap,
            spent: 0,
            expiresAt: expiresAt_
        });
        emit AgentAuthorised(agent, teamId, categoryId, perInvoiceCap, cumulativeCap, expiresAt_);
    }

    function revokeAgent(address agent) external onlySponsor {
        if (mandates[agent].expiresAt == 0) revert UnauthorisedAgent();
        mandates[agent].active = false;
        emit AgentRevoked(agent);
    }

    // ---------------------------------------------------------------------
    // The single constrained payment path
    // ---------------------------------------------------------------------

    function payInvoice(FieldrailTypes.Invoice calldata invoice, bytes calldata supplierSignature)
        external
        nonReentrant
    {
        if (status != ProgrammeStatus.Active) revert ProgrammeNotActive();
        if (startAt > 0 && block.timestamp < startAt) revert ProgrammeNotStarted();
        if (block.timestamp >= expiresAt) revert ProgrammeExpired();

        AgentMandate storage mandate = mandates[msg.sender];
        if (!mandate.active) {
            if (mandate.expiresAt == 0) revert UnauthorisedAgent();
            revert AgentNotActive();
        }
        if (block.timestamp >= mandate.expiresAt) revert AgentExpired();
        if (mandate.teamId != invoice.teamId || mandate.categoryId != invoice.categoryId) {
            revert AgentScopeMismatch();
        }

        if (invoice.amount == 0) revert AmountZero();
        if (invoice.amount > mandate.perInvoiceCap) revert PerInvoiceCapExceeded();
        if (mandate.spent + invoice.amount > mandate.cumulativeCap) {
            revert AgentCumulativeCapExceeded();
        }

        SupplierInfo storage supplier = suppliers[invoice.supplier][invoice.categoryId];
        if (supplier.registeredAt == 0 || !supplier.active) revert SupplierNotApproved();
        if (invoice.supplier == address(0)) revert SupplierMismatch();
        if (invoice.programmeId != programmeId) revert WrongProgramme();
        if (invoice.token != address(paymentToken)) revert WrongToken();
        if (invoice.deadline < block.timestamp) revert InvoiceExpired();

        if (consumedInvoiceIds[invoice.invoiceId]) revert InvoiceAlreadyUsed();
        if (consumedNonces[invoice.supplier][invoice.nonce]) revert NonceAlreadyUsed();

        if (categorySpent[invoice.categoryId] + invoice.amount > categoryCap[invoice.categoryId]) {
            revert CategoryBudgetExceeded();
        }
        if (
            teamCategorySpent[invoice.teamId][invoice.categoryId] + invoice.amount
                > teamCategoryCap[invoice.teamId][invoice.categoryId]
        ) {
            revert TeamBudgetExceeded();
        }
        if (totalSpent + invoice.amount > totalFunded) revert ProgrammeBudgetExceeded();
        if (paymentToken.balanceOf(address(this)) < invoice.amount) {
            revert InsufficientTokenBalance();
        }

        bytes32 digest = _hashTypedDataV4(FieldrailTypes.hash(invoice));
        address recovered = ECDSA.recover(digest, supplierSignature);
        if (recovered != invoice.supplier) revert InvalidSupplierSignature();

        // Effects before interaction.
        consumedInvoiceIds[invoice.invoiceId] = true;
        consumedNonces[invoice.supplier][invoice.nonce] = true;
        mandate.spent += invoice.amount;
        categorySpent[invoice.categoryId] += invoice.amount;
        teamCategorySpent[invoice.teamId][invoice.categoryId] += invoice.amount;
        totalSpent += invoice.amount;

        emit InvoicePaid(
            invoice.invoiceId,
            programmeId,
            invoice.teamId,
            invoice.categoryId,
            invoice.supplier,
            msg.sender,
            invoice.amount,
            invoice.evidenceHash,
            invoice.nonce
        );

        paymentToken.safeTransfer(invoice.supplier, invoice.amount);
    }

    // ---------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------

    function pauseProgramme() external onlySponsor notClosed {
        status = ProgrammeStatus.Paused;
        emit ProgrammePaused(programmeId, sponsor);
    }

    function resumeProgramme() external onlySponsor notClosed {
        // Resume never changes expiry, caps or any allocation.
        status = ProgrammeStatus.Active;
        emit ProgrammeResumed(programmeId, sponsor);
    }

    function closeProgramme() external onlySponsor notClosed {
        status = ProgrammeStatus.Closed;
        closedAt = block.timestamp;
        emit ProgrammeClosed(programmeId, closedAt, totalFunded - totalSpent - refunded);
    }

    function refundUnspent() external nonReentrant onlySponsor {
        if (status != ProgrammeStatus.Closed) revert ProgrammeNotActive();
        uint256 amount = totalFunded - totalSpent - refunded;
        if (amount == 0) revert NothingToRefund();
        refunded += amount;
        paymentToken.safeTransfer(sponsor, amount);
        emit Refunded(programmeId, sponsor, amount);
    }

    // ---------------------------------------------------------------------
    // Read helpers for UI, MCP and indexers
    // ---------------------------------------------------------------------

    function getCategoryRemaining(bytes32 categoryId) external view returns (uint256) {
        return categoryCap[categoryId] - categorySpent[categoryId];
    }

    function getTeamCategoryRemaining(bytes32 teamId, bytes32 categoryId)
        external
        view
        returns (uint256)
    {
        return teamCategoryCap[teamId][categoryId] - teamCategorySpent[teamId][categoryId];
    }

    function getFundsRemaining() external view returns (uint256) {
        return totalFunded - totalSpent - refunded;
    }

    function getAgentRemaining(address agent)
        external
        view
        returns (uint256 perInvoiceCap, uint256 lifetimeRemaining, uint256 expiry_, bool active)
    {
        AgentMandate memory m = mandates[agent];
        perInvoiceCap = m.perInvoiceCap;
        lifetimeRemaining = m.cumulativeCap > m.spent ? m.cumulativeCap - m.spent : 0;
        expiry_ = m.expiresAt;
        active = m.active;
    }

    function isSupplierApproved(address supplier, bytes32 categoryId) external view returns (bool) {
        SupplierInfo memory s = suppliers[supplier][categoryId];
        return s.registeredAt != 0 && s.active;
    }

    function isInvoiceConsumed(bytes32 invoiceId) external view returns (bool) {
        return consumedInvoiceIds[invoiceId];
    }

    function isNonceConsumed(address supplier, uint256 nonce) external view returns (bool) {
        return consumedNonces[supplier][nonce];
    }
}
