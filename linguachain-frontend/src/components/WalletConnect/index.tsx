import React from 'react';
import { useFreighter } from '../../hooks/useFreighter';
// @ts-ignore: CSS module import handled by build tooling
import './WalletConnect.css'; // Özel tipografi ve padding ayarları için

export const WalletConnect: React.FC = () => {
  const { publicKey, loading, error, connectWallet, disconnectWallet } = useFreighter();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <span className="text-sm text-gray-500 italic">Kimlik doğrulanıyor...</span>;
  }

  return (
    <div className="wallet-container flex flex-col items-end">
      {publicKey ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium tracking-wide">
            YAZAR KİMLİĞİ: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{formatAddress(publicKey)}</span>
          </span>
          <button 
            onClick={disconnectWallet}
            className="text-xs text-red-600 hover:text-red-800 underline decoration-1"
          >
            Çıkış Yap
          </button>
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          className="bg-black text-white px-6 py-2 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Cüzdanı Bağla
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
};