import { useCallback, useEffect, useState } from "react";
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  getAddress as freighterGetAddress,
  getNetwork as freighterGetNetwork,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

export interface FreighterNetworkInfo {
  network: string;
  networkPassphrase: string;
}

export interface UseFreighterResult {
  publicKey: string | null;
  network: FreighterNetworkInfo | null;
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  signTx: (xdr: string, networkPassphrase: string) => Promise<string>;
}

/**
 * Hook for connecting to and interacting with the Freighter Stellar wallet
 * extension. Handles install detection, permission requests, address
 * retrieval, network detection, and transaction signing.
 */
export function useFreighter(): UseFreighterResult {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<FreighterNetworkInfo | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Detect whether the Freighter extension is present at all.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await freighterIsConnected();
        if (!cancelled) {
          setIsInstalled(!result.error && result.isConnected !== undefined);
        }
      } catch {
        if (!cancelled) setIsInstalled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // On mount, if the app was previously authorized, silently restore session.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const allowed = await freighterIsAllowed();
        if (allowed.error || !allowed.isAllowed) return;

        const addressRes = await freighterGetAddress();
        const networkRes = await freighterGetNetwork();

        if (!cancelled) {
          if (!addressRes.error) setPublicKey(addressRes.address);
          if (!networkRes.error) {
            setNetwork({
              network: networkRes.network,
              networkPassphrase: networkRes.networkPassphrase,
            });
          }
        }
      } catch {
        // Silent restore is best-effort; ignore failures here.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    setError(null);
    setIsConnecting(true);

    try {
      const connected = await freighterIsConnected();
      if (connected.error || !connected.isConnected) {
        setError(
          "Freighter extension not detected. Please install it from freighter.app."
        );
        return null;
      }

      const permission = await freighterSetAllowed();
      if (permission.error || !permission.isAllowed) {
        setError("Wallet connection request was denied.");
        return null;
      }

      const addressRes = await freighterGetAddress();
      if (addressRes.error) {
        setError(addressRes.error.message ?? "Could not retrieve wallet address.");
        return null;
      }

      const networkRes = await freighterGetNetwork();
      if (!networkRes.error) {
        setNetwork({
          network: networkRes.network,
          networkPassphrase: networkRes.networkPassphrase,
        });
      }

      setPublicKey(addressRes.address);
      return addressRes.address;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown wallet error.");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no explicit "revoke" call from the dApp side; we simply
    // clear local state so the app treats the session as ended.
    setPublicKey(null);
    setNetwork(null);
  }, []);

  const signTx = useCallback(
    async (xdr: string, networkPassphrase: string): Promise<string> => {
      if (!publicKey) {
        throw new Error("Wallet is not connected.");
      }

      const result = await freighterSignTransaction(xdr, {
        networkPassphrase,
        address: publicKey,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Transaction signing failed.");
      }

      return result.signedTxXdr;
    },
    [publicKey]
  );

  return {
    publicKey,
    network,
    isInstalled,
    isConnected: publicKey !== null,
    isConnecting,
    error,
    connect,
    disconnect,
    signTx,
  };
}
