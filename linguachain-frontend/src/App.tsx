import React, { useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Contract, nativeToScVal } from '@stellar/stellar-sdk';
import './App.css';

const CONTRACT_ID = 'CCLPB37ANXYEHITID62U6QC7Q7GRAHTS7UQVTTH6YR5AIXYJJGW3NNOR';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [error, setError] = useState('');
  const [hashResult, setHashResult] = useState(''); // Ekranda göstereceğimiz Hash için yeni state

  const connectWallet = async () => {
    try {
      if (!(await isConnected())) {
        setError("Freighter cüzdanı bulunamadı. Lütfen eklentiyi yükleyin.");
        return;
      }
      const accessResponse = await requestAccess();
      const key = typeof accessResponse === 'string' ? accessResponse : (accessResponse as any).address;
      if (key) {
        setPublicKey(key);
        setIsWalletConnected(true);
        setError('');
      }
    } catch (e: any) {
      setError("Cüzdan hatası: " + e.message);
    }
  };

  const mintCertificate = async () => {
    try {
      if (!publicKey) return;

      const contract = new Contract(CONTRACT_ID);
      
      const tx = contract.call(
        'mint_certificate', 
        nativeToScVal(publicKey, { type: 'address' }),
        nativeToScVal(90, { type: 'u32' }),
        nativeToScVal("Turkish", { type: 'string' })
      );

      const xdrData = tx.toXDR() as any;

      const signedTx = await signTransaction(xdrData, { 
        networkPassphrase: 'Test SDF Network ; September 2015' 
      });
      
      // Obje gelirse metne çevir, metinse direkt al
      const finalHash = typeof signedTx === 'object' ? JSON.stringify(signedTx) : signedTx;
      
      setHashResult(finalHash); // Ekrana yazdır
      setError(""); // Hata mesajını temizle
      alert("İşlem başarıyla imzalandı!");
      
    } catch (e: any) {
      console.error(e);
      setError("Mint hatası: İşlem iptal edildi veya Freighter reddetti.");
    }
  };

  return (
    <div className="App" style={{ padding: '50px', textAlign: 'center' }}>
      <h1>LinguaChain - Sertifika Portalı</h1>
      
      {!isWalletConnected ? (
        <button 
          onClick={connectWallet}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Freighter Cüzdanını Bağla
        </button>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <p style={{ color: 'green' }}>✅ Adres: {publicKey}</p>
          <button 
            onClick={mintCertificate} 
            style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Sertifika Bas (Mint)
          </button>
        </div>
      )}

      {/* HASH DEĞERİNİN GÖRÜNECEĞİ KUTU */}
      {hashResult && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', border: '2px dashed #28a745', borderRadius: '10px', wordBreak: 'break-all', maxWidth: '600px', margin: '30px auto' }}>
          <h3 style={{ color: '#28a745', marginTop: '0' }}>İşte Hash Değerin! 🎉</h3>
          <p style={{ fontSize: '14px', color: '#333' }}>{hashResult}</p>
          <small style={{ color: 'gray' }}>Bu karmaşık kodu kopyalayıp README dosyana yapıştırabilirsin.</small>
        </div>
      )}
      
      {error && <p style={{ color: 'blue', marginTop: '20px', fontSize: '14px', maxWidth: '500px', margin: '20px auto' }}>{error}</p>}
    </div>
  );
}

export default App;