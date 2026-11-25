// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { FieldrailFactory } from "../src/FieldrailFactory.sol";

/// Deploy the discovery factory. DEPLOYER_PRIVATE_KEY must be a dedicated
/// throwaway Aevum test key; never use a sponsor or sponsor-admin key here.
contract DeployFieldrail is Script {
    function run() external returns (FieldrailFactory factory) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        factory = new FieldrailFactory();
        vm.stopBroadcast();
        console2.log("FIELDRAIL_FACTORY", address(factory));
        console2.log("CHAIN_ID", block.chainid);
    }
}
