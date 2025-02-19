'use client';

import { Proposal } from '@/app/services/proposal';
import { Editor, PropDateInterface } from '@/utils/database/interfaces';
import { Text, VStack } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { useAccount } from 'wagmi';
import { PropdatesContentCardContent } from './contentCard';
import PropdatesEditor from './editor';
import { isAddressEqual, zeroAddress } from 'viem';
import { FaEdit } from 'react-icons/fa';

interface PropdatesTimelineProps {
  proposal: Proposal;
  propdates: PropDateInterface[];
  editors: Editor[];
  setPropdates: Dispatch<SetStateAction<PropDateInterface[]>>;
}

function PropdatesTimeline({
  proposal,
  propdates,
  setPropdates,
  editors,
}: PropdatesTimelineProps) {
  const { address } = useAccount();
  console.log({ proposal });
  const isEditor =
    editors.some((editor) => editor.user === address) ||
    isAddressEqual(proposal.proposer, address || zeroAddress);

  return (
    <VStack gap={4}>
      {isEditor && (
        <PropdatesEditor
          proposalId={proposal.proposalId}
          setPropdates={setPropdates}
          buttonProps={{ variant: 'surface', size: 'sm', w: 'full' }}
          buttonInnerChildren={
            <>
              <FaEdit />
              <Text>Create new Propdate</Text>
            </>
          }
        />
      )}
      {propdates.length ? (
        <VStack gap={2} w='full'>
          {propdates.map((propdate) => (
            <PropdatesContentCardContent
              key={propdate.id}
              propdate={propdate}
              setPropdates={setPropdates}
            />
          ))}
        </VStack>
      ) : (
        <Text mt={2} textAlign={'center'} w={'full'}>
          No propdates yet
        </Text>
      )}
    </VStack>
  );
}

export default PropdatesTimeline;
