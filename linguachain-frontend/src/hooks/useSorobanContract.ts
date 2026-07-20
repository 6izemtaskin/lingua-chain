import { useCallback, useMemo, useState } from "react";
import {
  Contract,
  TransactionBuilder,
  rpc,
  nativeToScVal,
  scValToNative,
  Address,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { useFreighter } from "./useFreighter";

// Create React App ortam değişkenleri
const CONTRACT_ID = process.env.REACT_APP_SOROBAN_CONTRACT_ID ?? "REPLACE_WITH_CONTRACT_ID";
const SOROBAN_RPC_URL = process.env.REACT_APP_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.REACT_APP_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export interface Certificate {
  id: number;
  owner: string;
  score: number;
  issuedAt: number;
}

export interface UseSorobanContractResult {
  isLoading: boolean;
  error: string | null;
  submitScore: (user: string, textId: number, score: number) => Promise<string | null>;
  getCertificate: (userAddress: string, certId: number) => Promise<Certificate | null>;
  getUserCertCount: (userAddress: string) => Promise<number | null>;
}

export function useSorobanContract(): UseSorobanContractResult {
  const { publicKey, signTx } = useFreighter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const server = useMemo(() => new rpc.Server(SOROBAN_RPC_URL, { allowHttp: false }), []);
  const contract = useMemo(() => new Contract(CONTRACT_ID), []);

  const invoke = useCallback(
    async (method: string, args: ReturnType<typeof nativeToScVal>[]) => {
      if (!publicKey) throw new Error("Connect your wallet before submitting a transaction.");
      const account = await server.getAccount(publicKey);
      let tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const simulated = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulated)) throw new Error(`Simulation failed: ${simulated.error}`);
      tx = rpc.assembleTransaction(tx, simulated).build();
      const signedXdr = await signTx(tx.toXDR(), NETWORK_PASSPHRASE);
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResult = await server.sendTransaction(signedTx);
      if (sendResult.status === "ERROR") throw new Error("Transaction submission was rejected by the network.");
      let getResult = await server.getTransaction(sendResult.hash);
      while (getResult.status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResult = await server.getTransaction(sendResult.hash);
      }
      if (getResult.status !== "SUCCESS") throw new Error("Transaction did not complete successfully.");
      return sendResult.hash;
    },
    [contract, publicKey, server, signTx]
  );

  const view = useCallback(
    async (method: string, args: ReturnType<typeof nativeToScVal>[]) => {
      const sourceAccount = await server.getAccount(
        publicKey ?? "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
      );
      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();
      const simulated = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulated)) throw new Error(`Simulation failed: ${simulated.error}`);
      if (!simulated.result?.retval) return null;
      return scValToNative(simulated.result.retval);
    },
    [contract, publicKey, server]
  );

  const submitScore = useCallback(
    async (user: string, textId: number, score: number): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        if (!publicKey) throw new Error("Wallet not connected.");
        const args = [
          nativeToScVal(Address.fromString(publicKey), { type: "address" }), // MVP: Cüzdanı bağlayan kullanıcı "Oracle" olarak davranır
          nativeToScVal(Address.fromString(user), { type: "address" }),      // Kullanıcı adresi
          nativeToScVal(textId, { type: "u64" }),                            // Metin ID
          nativeToScVal("literature", { type: "string" }),                   // Kategori (Sabit)
          nativeToScVal(score, { type: "u32" }),                             // AI Skoru
        ];
        return await invoke("submit_score", args);
      } catch (err) {
        setError(err instanceof Error ? err.message : "submit_score failed.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [invoke, publicKey]
  );

  const getCertificate = useCallback(
    async (userAddress: string, certId: number): Promise<Certificate | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const args = [
          nativeToScVal(Address.fromString(userAddress), { type: "address" }),
          nativeToScVal(certId, { type: "u64" }),
        ];
        const raw = await view("get_certificate", args);
        if (!raw) return null;
        return {
          id: Number(raw.id ?? certId),
          owner: String(raw.owner ?? userAddress),
          score: Number(raw.score ?? 0),
          issuedAt: Number(raw.issued_at ?? raw.issuedAt ?? 0),
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "get_certificate failed.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [view]
  );

  const getUserCertCount = useCallback(
    async (userAddress: string): Promise<number | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const args = [nativeToScVal(Address.fromString(userAddress), { type: "address" })];
        const raw = await view("get_user_cert_count", args);
        return raw === null ? null : Number(raw);
      } catch (err) {
        setError(err instanceof Error ? err.message : "get_user_cert_count failed.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [view]
  );

  return { isLoading, error, submitScore, getCertificate, getUserCertCount };
}