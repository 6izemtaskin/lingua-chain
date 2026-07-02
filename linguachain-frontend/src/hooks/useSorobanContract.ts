import { useState, useCallback } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org:443';
const CONTRACT_ID = 'CCLPB37ANXYEHITID62U6QC7Q7GRAHTS7UQVTTH6YR5AIXYJJGW3NNOR';

// @ts-ignore
const server = new StellarSdk.SorobanRpc.Server(RPC_URL);

export const useSorobanContract = () => {
  const [certCount, setCertCount] = useState<number>(0);
  const [contractLoading, setContractLoading] = useState<boolean>(false);

  const fetchUserCertCount = useCallback(async (publicKey: string) => {
    setContractLoading(true);
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      // @ts-ignore
      const tx = contract.call("get_user_cert_count", new StellarSdk.Address(publicKey));
      
      // @ts-ignore
      const { result } = await server.simulateTransaction(tx as any);
      
      // @ts-ignore
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(result)) {
        // Sonucu parse et
      }
    } catch (err) {
      console.error("Sözleşme verisi çekilemedi:", err);
    } finally {
      setContractLoading(false);
    }
  }, []);

  return { certCount, contractLoading, fetchUserCertCount };
};