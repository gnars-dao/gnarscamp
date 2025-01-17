import { getConfig } from '@/utils/wagmi';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { type ReactNode } from 'react';
import { cookieToInitialState } from 'wagmi';
import { Providers } from '@/components/layout/providers';
import { Box, Container } from '@chakra-ui/react';
import Navbar from '@/components/layout/navbar';
import { Toaster } from '@/components/ui/toaster';
import Head from 'next/head';
import { Analytics } from "@vercel/analytics/react"
const inter = Inter({ subsets: ['latin'] });

// Update the metadata without themeColor
export const metadata: Metadata = {
  title: 'Gnars Dao',
  description: 'Gnarly Ecosystem',
  metadataBase: new URL('https://gnars.pro'), // Replace with your domain
  openGraph: {
    images: [
      {
        url: '/images/shredquarters.png',
        width: 800,
        height: 600,
        alt: 'Gnars Pro',
      },
    ],
  },
};

// Add viewport configuration for themeColor
export const viewport = {
  themeColor: '#FFD700', // Replace with your desired color
};

export default function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    headers().get('cookie') // Fetch cookie headers dynamically
  );

  return (
    <html lang='en' suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className={inter.className} style={{ minHeight: '100vh' }}>
        <Providers initialState={initialState}>
          <Navbar />
          <Box
            minH={'full'}
            bg={'bg.panel'}
            colorPalette={'yellow'}
            color={{ base: 'black', _dark: 'white' }}
            paddingBlock={{ base: 2, md: 4 }}
          >
            <Container maxW={'breakpoint-2xl'}>{props.children}</Container>
          </Box>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
