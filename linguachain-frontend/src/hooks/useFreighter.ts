import { useState, useEffect } from 'react';
// @ts-ignore
import { isConnected, isAllowed, setAllowed, getPublicKey } from '@stellar/freighter-api';

export const useFreighter = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (await isConnected() && await isAllowed()) {
        const key = await getPublicKey();
        setPublicKey(key);
      }
    } catch (err) {
      console.error("Freighter bağlantı kontrolü başarısız:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const connected = await isConnected();
      if (!connected) {
        throw new Error("Freighter cüzdanı bulunamadı. Lütfen eklentiyi yükleyin.");
      }
      
      await setAllowed();
      const key = await getPublicKey();
      setPublicKey(key);
    } catch (err: any) {
      setError(err.message || "Cüzdan bağlanırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setPublicKey(null);
  };

  return { publicKey, loading, error, connectWallet, disconnectWallet };
};