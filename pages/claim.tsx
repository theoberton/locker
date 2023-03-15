import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { TonConnectButton, TonConnectUIProvider, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { internal, SendMode, WalletContractV4 } from 'ton';
import { useTonClient } from '@/hooks/useTonClient';

function ConnectStep() {
  const tonWallet = useTonWallet();

  return (
    <section className='flex items-center gap-6 h-12 mb-2'>
       <span>1.</span>
       {tonWallet ? <span>{tonWallet.account.address}</span> : <TonConnectButton />}
    </section>
  )
}

function ClaimStep() {
  const tonClient = useTonClient();
  const tonConnectAddress = useTonAddress();

  async function claim() {
    if (!tonClient) return alert('Ton client not initialized');

    const searchParams = new URLSearchParams(location.search);
    const mnemonicRaw = searchParams.get('mnemonic');

    if (!mnemonicRaw) {
      return alert('No mnemonic in URL');
    }

    const mnemonic = atob(mnemonicRaw).split(',');
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

    const walletContract = tonClient.open(wallet);
    const seqno = await walletContract.getSeqno();

    await walletContract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS,
      messages: [internal({
        to: tonConnectAddress,
        value: 0n,
        body: "Claimed!",
      })],
    })
  }

  return (
    <section className='flex items-center gap-6 h-12 mb-2'>
       <span>2.</span>
       <button onClick={claim}>Claim</button>
    </section>
  )
}

// @todo: update manifestUrl
const manifestUrl = 'https://pi.oberton.io/tonconnect-manifest.json';

export default function ClaimPage() {
  return (
    <>
      <Head>
        <title>Locker - Claim</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔒</text></svg>" />
      </Head>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <main className="flex flex-col max-w-[32rem] p-6 mx-auto h-screen">
          <p className="text-3xl font-bold mb-10">
            Congrats! Claim your TON in 2 simple steps
          </p>
          <ConnectStep />
          <ClaimStep />        
        </main>
      </TonConnectUIProvider>
    </>
  )
}
