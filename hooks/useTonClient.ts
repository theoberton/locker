import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient } from 'ton';
import { useEffect, useState } from 'react';

function isTestnet() {
  return location.host.startsWith('testnet') || location.host.startsWith('localhost');
}

export function useTonClient() {
	const [tonClient, setTonClient] = useState<TonClient | undefined>();

	useEffect(() => {
		(async () => {
	    const network = isTestnet() ? 'testnet' : 'mainnet';
      const endpoint = await getHttpEndpoint({ network });

			setTonClient(new TonClient({ endpoint }));
		})();
	}, []);

  return tonClient;
}
