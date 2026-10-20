import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CertiChainRegistryModule = buildModule(
  "CertiChainRegistryModule",
  (module) => {
    const certiChainRegistry = module.contract(
      "CertiChainRegistry"
    );

    return { certiChainRegistry };
  }
);

export default CertiChainRegistryModule;