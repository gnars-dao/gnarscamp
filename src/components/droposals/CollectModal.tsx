import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogRoot,
  DialogFooter,
  DialogCloseTrigger,
} from '@/components/ui/dialog';
import {
  Box,
  Flex,
  Text,
  VStack,
  Input,
  Textarea,
  Collapsible,
  Icon,
} from '@chakra-ui/react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import 'reactflow/dist/style.css';
import { governorAddress } from '@/hooks/wagmiGenerated';
import {
  http,
  createPublicClient,
  Address,
  TransactionReceipt,
  formatEther,
} from 'viem';
import { base } from 'viem/chains';
import MintButton from './MintButton';
import Image from 'next/image';
import { useProposal } from '@/contexts/ProposalContext';
import { useReadContract } from 'wagmi';
import zoraMintAbi from '@/utils/abis/zoraNftAbi';

// Define proper types for better type safety
type Transaction = {
  hash: string;
  blockNumber: string;
  [key: string]: any;
};

type CollectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  thumbnail?: string;
  name?: string;
  salesConfig?: {
    publicSalePrice: number;
    maxSalePurchasePerAddress: number;
    publicSaleStart: number;
    publicSaleEnd: number;
    presaleStart: number;
    presaleEnd: number;
    presaleMerkleRoot: string;
  };
};

// Move the client outside the component to avoid recreating it on each render
const etherscanClient = createPublicClient({
  chain: base,
  transport: http(),
});

const CollectModal = ({
  isOpen,
  onClose,
  thumbnail,
  name,
  salesConfig,
}: CollectModalProps) => {
  const {
    descriptionHash,
    blockNumber,
    tokenCreated,
    setTokenCreated,
    setTransactionReceipt,
    proposal,
  } = useProposal();
  const [numMints, setNumMints] = useState(1);
  const [comment, setComment] = useState('');
  const [matchedTransaction, setMatchedTransaction] =
    useState<Transaction | null>(null);
  const [matchedTransactionReceipt, setMatchedTransactionReceipt] =
    useState<TransactionReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fixed Zora protocol fee
  const zoraProtocolFee = 0.000777; // Zora protocol fee in ETH per token

  // Read contract sales configuration if token is created
  const contractSalesConfig = useReadContract({
    address: tokenCreated as Address,
    abi: zoraMintAbi,
    functionName: 'salesConfig',
    args: [],
  });

  // Determine mint price - prefer contract data if available
  const mintPricePerUnit = useMemo(() => {
    // If we have contract data, use that
    if (contractSalesConfig.data && contractSalesConfig.data.length > 0) {
      const pricePerTokenInWei = contractSalesConfig.data[0] as bigint;
      return Number(formatEther(pricePerTokenInWei));
    }

    // Otherwise fall back to prop data
    return salesConfig?.publicSalePrice
      ? typeof salesConfig.publicSalePrice === 'number'
        ? salesConfig.publicSalePrice
        : Number(salesConfig.publicSalePrice) / 1e18
      : 0;
  }, [contractSalesConfig.data, salesConfig]);

  // Calculate total price
  const totalMintPrice = mintPricePerUnit * numMints;
  const totalZoraFee = zoraProtocolFee * numMints;
  const totalPrice = totalMintPrice + totalZoraFee;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch transaction data from the API
  const fetchGovernorTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    // create a variable that will take proposal.descriptionHash if it exists and descriptionHash if it doesn't
    const descriptionHashToUse = proposal.descriptionHash
      ? proposal.descriptionHash
      : descriptionHash;
    try {
      const topic0 =
        '0x7b1bcf1ccf901a11589afff5504d59fd0a53780eed2a952adade0348985139e0';
      const response = await fetch(
        `/api/etherscan?contractAddress=${governorAddress}&blockNumber=${blockNumber}&topic0=${topic0}${descriptionHashToUse ? `&descriptionHash=${descriptionHashToUse}` : ''}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch governor transactions: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.matchedTransaction) {
        setMatchedTransaction(data.matchedTransaction);
        // Fetch receipt immediately after finding the matched transaction
        await fetchTransactionReceipt(data.matchedTransaction.hash);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, [descriptionHash, blockNumber, isOpen]);

  // Separate function to fetch transaction receipt
  const fetchTransactionReceipt = useCallback(
    async (txHash: string) => {
      if (!txHash) return;

      try {
        const hash = txHash.startsWith('0x')
          ? (txHash as Address)
          : (`0x${txHash}` as Address);

        const receipt = await etherscanClient.getTransactionReceipt({ hash });

        setMatchedTransactionReceipt(receipt);
        setTransactionReceipt(receipt);

        // Extract the created token address from the logs if available
        if (receipt.logs && receipt.logs.length > 0) {
          setTokenCreated(receipt.logs[0].address);
        }
      } catch (error) {
        setError('Failed to fetch transaction receipt');
      }
    },
    [setTokenCreated, setTransactionReceipt]
  );

  // Effect to fetch data only when modal is open and descriptionHash is available
  useEffect(() => {
    if ((isOpen && descriptionHash) || proposal.descriptionHash) {
      fetchGovernorTransactions();
    }
  }, [isOpen, descriptionHash, fetchGovernorTransactions]);

  return (
    <DialogRoot open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Collect {name ? `"${name}"` : proposal.title}
          </DialogTitle>
          <DialogCloseTrigger onClick={onClose} />
        </DialogHeader>
        <DialogBody>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <VStack align='start' w={{ base: '100%', md: '100%' }}>
              <Image
                src={thumbnail || '/images/logo.png'}
                alt='Thumbnail'
                width={500}
                height={100}
                style={{ borderRadius: '8px', width: '100%', height: 'auto' }}
              />
              <Text mt={4}>
                Token Created:{' '}
                {tokenCreated ? (
                  <a
                    href={`/droposal/${tokenCreated}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ color: 'grey', textDecoration: 'underline' }}
                  >
                    {tokenCreated}
                  </a>
                ) : (
                  'Waiting for data...'
                )}
              </Text>

              {/* Number of mints input */}
              <Flex mt={4} width='100%' align='center'>
                <Text>Number of Mints:</Text>
                <Input
                  type='number'
                  value={numMints}
                  onChange={(e) => setNumMints(Number(e.target.value))}
                  min='1'
                  style={{ marginLeft: '10px', width: '60px' }}
                />
              </Flex>

              {/* Price breakdown - estimated UI only */}
              <Box
                mt={3}
                p={3}
                borderRadius='md'
                bg='blackAlpha.100'
                width='100%'
              >
                <Flex justify='space-between'>
                  <Text>Mint Price:</Text>
                  <Text>{totalMintPrice.toFixed(4)} ETH</Text>
                </Flex>
                <Flex justify='space-between'>
                  <Text>Zora Protocol Fee:</Text>
                  <Text>{totalZoraFee.toFixed(4)} ETH</Text>
                </Flex>
                <Flex
                  justify='space-between'
                  mt={2}
                  pt={2}
                  borderTop='1px solid'
                  borderColor='gray.300'
                  fontWeight='bold'
                >
                  <Text>Total:</Text>
                  <Text>{totalPrice.toFixed(4)} ETH</Text>
                </Flex>
                {contractSalesConfig.isLoading && (
                  <Text fontSize='xs' mt={2} color='gray.500'>
                    Loading price data from contract...
                  </Text>
                )}
                {contractSalesConfig.error && (
                  <Text fontSize='xs' mt={2} color='red.400'>
                    Contract price data unavailable. Using estimated price.
                  </Text>
                )}
              </Box>

              {/* New comment input */}
              <Box mt={4} width='100%'>
                <Text mb={2}>Mint Comment:</Text>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder='Add an optional comment to your mint...'
                  size='sm'
                  maxLength={200}
                />
                <Text fontSize='xs' mt={1} textAlign='right'>
                  {comment.length}/200
                </Text>
              </Box>

              {/* 
                            keep commented for debugging 
                            {descriptionHash && (
                                <Text mt={4} fontSize="sm">Description Hash: {descriptionHash?.substring(0, 10)}...</Text>
                            )} */}
            </VStack>
          </Flex>
          {/* Transaction details collapsible section */}
          <Box mt={4}>
            <Collapsible.Root
              open={isDetailsOpen}
              onOpenChange={(details) => setIsDetailsOpen(details.open)}
            >
              <Collapsible.Trigger
                as={Flex}
                p={3}
                borderRadius='md'
                bg='bg'
                cursor='pointer'
                justifyContent='space-between'
                alignItems='center'
                borderWidth='1px'
                borderColor='gray.200'
                width='100%'
              >
                <Text fontWeight='bold'>Details</Text>
                {isDetailsOpen ? (
                  <IoIosArrowUp size={16} />
                ) : (
                  <IoIosArrowDown size={16} />
                )}
              </Collapsible.Trigger>

              <Collapsible.Content>
                <Box
                  p={4}
                  bg='bg'
                  borderWidth='1px'
                  borderTop='0'
                  borderBottomRadius='md'
                >
                  {loading && <Text>Loading transaction data...</Text>}
                  {error && <Text color='red.500'>Error: {error}</Text>}
                  {matchedTransaction && (
                    <Box p={3} borderRadius='md'>
                      <Text fontWeight='bold'>Matched Transaction</Text>
                      <Text>
                        Hash:{' '}
                        <a
                          href={`https://basescan.org/tx/${matchedTransaction.hash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {matchedTransaction.hash}
                        </a>
                      </Text>
                      <Text>Block: {matchedTransaction.blockNumber}</Text>
                      {/* keep commented for debugging 
                                            
                                            {matchedTransactionReceipt && (
                                                <>
                                                    <Text>Gas Used: {matchedTransactionReceipt.gasUsed.toString()}</Text>
                                                    <Text>Log Events: {matchedTransactionReceipt.logs.length}</Text>
                                                </>
                                            )} */}
                    </Box>
                  )}
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        </DialogBody>
        <DialogFooter>
          <Flex justify='flex-end' mt={4} gap={2}>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Close
            </Button>
            <MintButton
              quantity={numMints}
              comment={comment}
              salesConfig={salesConfig}
            />
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default CollectModal;
