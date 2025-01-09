'use client';

import SENDIT_ABI from '@/components/proposal/transactions/utils/SENDIT_abi';
import { Button } from '@/components/ui/button';
import { SENDIT_CONTRACT_ADDRESS } from '@/utils/constants';
import { Box, HStack, Input, Text, VStack } from '@chakra-ui/react';
import React, { useState, useCallback } from 'react';
import {
  Address,
  BaseError,
  encodeFunctionData,
  formatUnits,
  zeroAddress,
} from 'viem';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { abi } from './sm_abi';

function ClaimPage() {
  const [smartWalletAddress, setSmartWalletAddress] = useState('');

  const { data: transactionHash, error, writeContract } = useWriteContract();
  const { address: userAddress } = useAccount();

  const { data: senditBalance } = useReadContract({
    address: SENDIT_CONTRACT_ADDRESS,
    abi: SENDIT_ABI,
    functionName: 'balanceOf',
    args: [(smartWalletAddress as Address) || zeroAddress],
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!smartWalletAddress || !userAddress || !senditBalance) {
        console.error('Missing smart wallet address, user address, or balance');
        return;
      }

      const encodedData = encodeFunctionData({
        abi: SENDIT_ABI,
        functionName: 'transfer',
        args: [userAddress, senditBalance],
      });

      writeContract({
        address: smartWalletAddress as Address,
        abi,
        functionName: 'execute',
        args: [SENDIT_CONTRACT_ADDRESS, 0n, encodedData],
      });
    },
    [smartWalletAddress, userAddress, senditBalance, writeContract]
  );

  return (
    <HStack w={'full'} minH={'80vh'} justify={'center'}>
      <VStack alignItems={'center'} gap={1}>
        <Box w={'full'} minW={'sm'} p={4} borderWidth={1} borderRadius={8}>
          <form onSubmit={handleSubmit}>
            <VStack alignItems={'start'} gap={2}>
              <VStack alignItems={'start'} gap={0}>
                <Text fontSize={'xl'} fontWeight={'bold'}>
                  Claim Sendit
                </Text>
                <Text color={'fg.muted'}>
                  Claim the tokens from a Smart Wallet
                </Text>
              </VStack>
              <Input
                type='text'
                placeholder='Smart Wallet Address'
                id='smartWallet'
                size={'lg'}
                value={smartWalletAddress}
                onChange={(e) => setSmartWalletAddress(e.target.value)}
              />
              <Button
                w={'full'}
                type='submit'
                variant={'surface'}
                disabled={
                  !smartWalletAddress || !senditBalance || senditBalance === 0n
                }
              >
                Claim
              </Button>
            </VStack>
          </form>
        </Box>
        {senditBalance && (
          <Text>Balance: {formatUnits(senditBalance, 18)}</Text>
        )}
        {transactionHash && <Text>Hash: {transactionHash}</Text>}
        {error && (
          <Text>
            Error: {(error as BaseError).shortMessage || error.message}
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

export default ClaimPage;
