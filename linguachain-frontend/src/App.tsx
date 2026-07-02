import React, { useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Contract, nativeToScVal } from '@stellar/stellar-sdk';
import './App.css';

const CONTRACT_ID = 'CCLPB37ANXYEHITID62U6QC7Q7GRAHTS7UQVTTH6YR5AIXYJJGW3NNOR';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [error, setError] = useState('');
  const [mintStatus, setMintStatus] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const connectWallet = async () => {
    try {
      if (!(await isConnected())) {
        setError("Freighter wallet not found.");
        return;
      }
      const accessResponse = await requestAccess();
      const address = typeof accessResponse === 'object' && accessResponse !== null
        ? (accessResponse as any).address 
        : accessResponse;

      setPublicKey(address as string);
      setIsWalletConnected(true);
      setError('');
    } catch (e) {
      setError("Failed to connect wallet.");
    }
  };

  const mint = async () => {
    try {
      setMintStatus('');
      setError('');
      const contract = new Contract(CONTRACT_ID);
      const txCall = contract.call(
        'record_event',
        nativeToScVal(publicKey, { type: 'address' }),
        nativeToScVal(1, { type: 'u32' })
      );

      const xdr = txCall.toXDR() as unknown as string;
      const signed = await signTransaction(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015'
      });

      console.log("Transaction Success:", signed);
      setMintStatus("Mint successful! Transaction recorded on blockchain.");
      alert("Mint successful!"); // Başarı pop-up'ı
    } catch (e) {
      setError("Minting failed. Check console (F12).");
    }
  };

  const sendSuggestion = () => {
    if (suggestion) {
      console.log("ADMIN VIEW ONLY - New Suggestion Received:", suggestion);
      alert("Thank you! Your suggestion has been received."); // Öneri pop-up'ı
      setSuggestion("");
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>LinguaChain Portal</h1>
      
      {!isWalletConnected ? (
        <button onClick={connectWallet} style={{ padding: '10px 20px', cursor: 'pointer' }}>Connect Wallet</button>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <p>Connected: {publicKey}</p>
          <button onClick={mint} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', cursor: 'pointer' }}>Mint Certificate</button>
          
          {mintStatus && <p style={{ color: 'green', marginTop: '20px' }}>{mintStatus}</p>}
          {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

          <div style={{ marginTop: '80px', borderTop: '1px solid #ccc', paddingTop: '40px' }}>
            <p>You can control your transactions by pasting your hash into the search bar on the official explorer:</p>
            <a href="https://testnet.stellarchain.io/" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>
              StellarChain Explorer
            </a>

            {/* Öneri Kutusu aşağıya taşındı ve daha düzenli */}
            <div style={{ marginTop: '100px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3>Write to us!</h3>
              <textarea 
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Share your suggestions with us..."
                style={{ width: '300px', height: '100px', display: 'block', margin: '10px auto' }}
              />
              <button onClick={sendSuggestion} style={{ padding: '5px 15px', cursor: 'pointer' }}>Submit Suggestion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;