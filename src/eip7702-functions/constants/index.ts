import { constants as eip7702Constants } from '@trustvc/eip7702';

export const gaslessConstants = {
  // Sepolia
  GASLESS_FACTORY_ADDRESS_SEPOLIA: eip7702Constants.contractAddress.PlatformAccountFactory[
    eip7702Constants.ChainId.Sepolia
  ] as `0x${string}`,
  GASLESS_PAYMASTER_IMPL_ADDRESS_SEPOLIA: eip7702Constants.contractAddress.PaymasterImplementation[
    eip7702Constants.ChainId.Sepolia
  ] as `0x${string}`,
  GASLESS_EIP7702_IMPL_ADDRESS_SEPOLIA:
    '0xa46ec3920ac5fc54f4ba33185a91ae250adf59b8' as `0x${string}`,
  TDOC_DEPLOYER_ADDRESS_SEPOLIA: '0x64bc665056dc8be4092e569ed13a7f273be28cd2' as `0x${string}`,

  // Amoy
  GASLESS_FACTORY_ADDRESS_AMOY: eip7702Constants.contractAddress.PlatformAccountFactory[
    eip7702Constants.ChainId.Amoy
  ] as `0x${string}`,
  GASLESS_PAYMASTER_IMPL_ADDRESS_AMOY: eip7702Constants.contractAddress.PaymasterImplementation[
    eip7702Constants.ChainId.Amoy
  ] as `0x${string}`,
  GASLESS_EIP7702_IMPL_ADDRESS_AMOY: '0x044de1d4515a76ed9e431e8ec89e8d600405fd86' as `0x${string}`,
  GASLESS_TDOC_DEPLOYER_ADDRESS_AMOY: '0xfcafea839e576967b96ad1fbfb52b5ca26cd1d25' as `0x${string}`,

  // Shared
  GASLESS_ENTRY_POINT: '0x4337084d9e255ff0702461cf8895ce9e3b5ff108' as `0x${string}`,
} as const;
