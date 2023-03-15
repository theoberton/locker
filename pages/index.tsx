import Head from 'next/head'
import { TonConnectButton, TonConnectUIProvider, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from 'ton-crypto';
import { beginCell, Cell, toNano, WalletContractV4 } from 'ton';
import { Dispatch, SetStateAction, useState } from 'react';

function ConnectStep() {
  const tonWallet = useTonWallet();

  return (
    <section className='flex items-center gap-6 h-12 mb-2'>
       <span>1.</span>
       {tonWallet ? <span>{tonWallet.account.address}</span> : <TonConnectButton />}
    </section>
  )
}

function InputAmountStep({ locker }: { locker: Locker | null }) {
  const [tonConnectUI] = useTonConnectUI();
  const [amount, setAmount] = useState('');

  async function sendTon() {
    if (!locker) {
      return alert('Generate locker first');
    }

    await tonConnectUI.sendTransaction({
      validUntil: Date.now() + 300000,
      messages: [{
        address: locker.wallet.address.toString(),
        amount: toNano(amount).toString(),
        stateInit: stateInitToBoc(locker.wallet.init).toString('base64')
      }]
    });
  }

  return (
    <section className='flex items-center gap-6 h-12 mb-2'>
      <span>3.</span>
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"/>
      <button onClick={sendTon}>Send TON</button>
    </section>
  )
}

function ShareLinkStep({ locker, setLocker }: { locker: Locker | null, setLocker: Dispatch<SetStateAction<Locker | null>> }) {
  async function generateLocker() {
    const mnemonic = await mnemonicNew();
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

    setLocker({ mnemonic, keyPair, wallet });
  }

  return (
    <section className='flex items-center gap-6 h-12 mb-2'>
      <span>3.</span>
      <button onClick={generateLocker}>Generate locker</button>
      {locker && <a href={location + '/claim?mnemonic=' + btoa(locker.mnemonic.join(','))}>claim link</a>}
    </section>
  )
}

// @todo: update manifestUrl
const manifestUrl = 'https://pi.oberton.io/tonconnect-manifest.json';

interface Locker {
  mnemonic: string[];
  keyPair: KeyPair;
  wallet: WalletContractV4;
}


function stateInitToBoc({
  code,
  data,
  library = null,
  splitDepth = null,
  ticktock = null
}: {
  code: Cell;
  data: Cell;
  library?: null;
  splitDepth?: null;
  ticktock?: null;
}): Buffer {
  if (library) throw 'Library in state init is not implemented';
  if (splitDepth) throw 'Split depth in state init is not implemented';
  if (ticktock) throw 'Ticktock in state init is not implemented';

  const stateInit = beginCell();

  stateInit.storeBit(Boolean(splitDepth));
  stateInit.storeBit(Boolean(ticktock));
  stateInit.storeBit(Boolean(code));
  stateInit.storeBit(Boolean(data));
  stateInit.storeBit(Boolean(library));

  if (code) stateInit.storeRef(code);
  if (data) stateInit.storeRef(data);
  if (library) stateInit.storeRef(library);

  return stateInit.endCell().toBoc();
}


export default function Home() {
  const [locker, setLocker] = useState<Locker | null>(null);

  return (
    <>
      <Head>
        <title>Locker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔒</text></svg>" />
      </Head>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <main className="flex flex-col max-w-[32rem] p-6 mx-auto h-screen">
          <p className="text-3xl font-bold mb-10">
            Share TON in 3 simple steps
          </p>
          <ConnectStep />
          <ShareLinkStep locker={locker} setLocker={setLocker} />
          <InputAmountStep locker={locker} />
        </main>
      </TonConnectUIProvider>
    </>
  )
}
