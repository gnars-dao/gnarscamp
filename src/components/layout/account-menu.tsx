import React from 'react';
import { Button } from '@/components/ui/button';
import {
  MenuContent,
  MenuItem,
  MenuItemCommand,
  MenuRoot,
  MenuTrigger,
} from '@/components/ui/menu';
import ConnectButton from './connect-button';
import {
  useAccount,
  useBalance,
  useConnect,
  useEnsAvatar,
  useEnsName,
} from 'wagmi';
import { useDisconnect } from 'wagmi';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { Avatar } from '../ui/avatar';
import { formatEthAddress } from '@/utils/helpers';
import { LuLogOut, LuSparkle } from 'react-icons/lu';
import { weiToSparks } from '@/utils/spark';
import { Text } from '@chakra-ui/react';
import { ColorModeIcon, useColorMode } from '../ui/color-mode';
import Link from 'next/link';
import { BsGithub } from 'react-icons/bs';
import { FormattedAddress } from '../utils/ethereum';
import { useRouter } from 'next/navigation';

export default function AccountMenu() {
  const { toggleColorMode, colorMode } = useColorMode();
  const { isConnected, address, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const { data: balance } = useBalance({
    address,
  });

  const { data: ensName } = useEnsName({
    address: address,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  if (!isConnected) {
    return <ConnectButton />;
  }

  return (
    <MenuRoot positioning={{ placement: 'bottom-end' }}>
      <MenuTrigger asChild>
        <Button size={'xs'} variant={'ghost'}>
          {ensAvatar ? (
            <Avatar variant={'subtle'} size='xs' w={5} h={5} src={ensAvatar} />
          ) : null}
          <FormattedAddress address={address} />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem
          value='wallet'
          gap={1}
          onClick={() => router.push(`/${address}`)}
        >
          <LuSparkle width={2} height={2} style={{ marginRight: '4px' }} />{' '}
          My Wallet
        </MenuItem>
        <MenuItem
          value='disconnect'
          color='fg.error'
          _hover={{ bg: 'bg.error', color: 'fg.error' }}
          onClick={() => disconnect()}
        >
          <LuLogOut width={2} height={2} />
          Disconnect
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
