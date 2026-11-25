// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FieldrailFactory } from "../src/FieldrailFactory.sol";
import { FieldrailProgramVault } from "../src/FieldrailProgramVault.sol";

/// Create and configure the synthetic "Northern Water Access" demo programme.
/// All values are test-only. Env:
/// DEPLOYER_PRIVATE_KEY, FACTORY_ADDRESS, TUSD8_ADDRESS, SUPPLIER_ADDRESS, AGENT_ADDRESS
contract SeedDemo is Script {
    bytes32 constant PROGRAMME_ID = keccak256("NORTHERN_WATER_ACCESS_DEMO");
    bytes32 constant WATER = keccak256("WATER_PROCUREMENT");
    bytes32 constant TRANSPORT = keccak256("TRANSPORT_LOGISTICS");
    bytes32 constant SUPPLIES = keccak256("FIELD_SUPPLIES");
    bytes32 constant NORTH = keccak256("NORTH_ZONE");
    bytes32 constant SOUTH = keccak256("SOUTH_ZONE");

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address tokenAddress = vm.envAddress("TUSD8_ADDRESS");
        address supplier = vm.envAddress("SUPPLIER_ADDRESS");
        address agent = vm.envAddress("AGENT_ADDRESS");
        uint256 duration = vm.envOr("PROGRAMME_DURATION_SECONDS", uint256(30 days));

        vm.startBroadcast(deployerKey);

        FieldrailFactory factory = FieldrailFactory(factoryAddress);
        address v = factory.createProgramme(
            PROGRAMME_ID,
            tokenAddress,
            keccak256("ipfs://fieldrail-demo-metadata"),
            block.timestamp,
            block.timestamp + duration
        );
        FieldrailProgramVault vault = FieldrailProgramVault(v);

        IERC20 token = IERC20(tokenAddress);
        token.approve(address(vault), 1000e6);
        vault.fund(1000e6);

        vault.configureCategory(WATER, 450e6);
        vault.configureCategory(TRANSPORT, 250e6);
        vault.configureCategory(SUPPLIES, 200e6);
        vault.registerTeam(NORTH, keccak256("north-zone"));
        vault.registerTeam(SOUTH, keccak256("south-zone"));
        vault.allocateTeam(NORTH, WATER, 300e6);
        vault.allocateTeam(SOUTH, WATER, 150e6);
        vault.allocateTeam(NORTH, TRANSPORT, 250e6);
        vault.allocateTeam(NORTH, SUPPLIES, 200e6);
        vault.registerSupplier(supplier, WATER, keccak256("supplier:demo-water-co"));
        vault.authoriseAgent(agent, NORTH, WATER, 100e6, 300e6, block.timestamp + duration);

        vm.stopBroadcast();

        console2.log("PROGRAMME_ID", vm.toString(PROGRAMME_ID));
        console2.log("VAULT_ADDRESS", address(vault));
        console2.log("FUNDED_BASE_UNITS", 1000e6);
    }
}
