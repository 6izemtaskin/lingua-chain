import { Contract, Horizon, rpc, TransactionBuilder, xdr, Address } from "@stellar/stellar-sdk";
import { isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";

const CONTRACT_ID = "CCLPB37ANXYEHITID62U6QC7Q7GRAHTS7UQVTTH6YR5AIXYJJGW3NNOR";
const PASSPHRASE = "Test SDF Network ; September 2015";

const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org");
const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");

export const registerTranslationOnChain = async (translation: string) => {
  const connected = await isConnected();
  if (!connected) throw new Error("Freighter cüzdanına bağlanılamadı.");

  const accessResult = await requestAccess();
  if (accessResult.error || !accessResult.address) {
    throw new Error("Cüzdan erişim izni alınamadı.");
  }
  const publicKey = accessResult.address;
  
  const sourceAccount = await horizonServer.loadAccount(publicKey);

  const contract = new Contract(CONTRACT_ID);
  
  // Kontratın asıl fonksiyonu olan mint_certificate ve beklediği parametreler eklendi
  const operation = contract.call(
    "mint_certificate",
    new Address(publicKey).toScVal(),
    xdr.ScVal.scvU32(85),
    xdr.ScVal.scvString("Turkish")
  );

  let tx = new TransactionBuilder(sourceAccount, {
    fee: "1000",
    networkPassphrase: PASSPHRASE
  })
  .addOperation(operation)
  .setTimeout(30)
  .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);

  const freighterResult = await signTransaction(preparedTx.toXDR() as string, { 
    networkPassphrase: PASSPHRASE 
  });

  if (freighterResult.error) {
    throw new Error("İşlem cüzdan tarafından reddedildi.");
  }

  const signedTransaction = TransactionBuilder.fromXDR(freighterResult.signedTxXdr, PASSPHRASE);
  
  const response = await sorobanServer.sendTransaction(signedTransaction as any);

  return { hash: response.hash };
};