#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec,
};

mod lingua_registry {
    soroban_sdk::contractimport!(file = "../../lingua_registry.wasm");
}
use lingua_registry::Client as LinguaRegistryClient;

#[contracttype]
#[derive(Clone)]
pub struct Certificate {
    pub owner: Address,
    pub score: u32,
    pub language: String,
    pub timestamp: u64,
    pub token_id: u32,
}

#[contracttype]
pub enum DataKey {
    Certificate(u32),
    OwnerTokens(Address),
    NextTokenId,
    Admin,
    RegistryAddress,
}

const TOPIC_MINTED: Symbol = symbol_short!("MINTED");

#[contract]
pub struct LinguaChainContract;

#[contractimpl]
impl LinguaChainContract {
    pub fn initialize(env: Env, admin: Address, registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RegistryAddress, &registry);
        env.storage().instance().set(&DataKey::NextTokenId, &0u32);
    }

    pub fn mint_certificate(
        env: Env,
        recipient: Address,
        score: u32,
        language: String,
    ) -> u32 {
        recipient.require_auth();

        if score < 80 {
            panic!("score_too_low: minimum 80 required");
        }

        let token_id: u32 = env.storage().instance().get(&DataKey::NextTokenId).unwrap_or(0);

        let cert = Certificate {
            owner: recipient.clone(),
            score,
            language,
            timestamp: env.ledger().timestamp(),
            token_id,
        };
        env.storage().persistent().set(&DataKey::Certificate(token_id), &cert);

        let mut tokens: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerTokens(recipient.clone()))
            .unwrap_or(Vec::new(&env));
        tokens.push_back(token_id);
        env.storage().persistent().set(&DataKey::OwnerTokens(recipient.clone()), &tokens);
        env.storage().instance().set(&DataKey::NextTokenId, &(token_id + 1));

        // Registry çağrısı
        let registry_addr: Address = env.storage().instance().get(&DataKey::RegistryAddress).unwrap();
        let registry_client = LinguaRegistryClient::new(&env, &registry_addr);
        registry_client.record_event(&recipient, &token_id);

        env.events().publish((TOPIC_MINTED, token_id), (recipient, score, token_id));

        token_id
    }

    pub fn get_certificate(env: Env, token_id: u32) -> Certificate {
        env.storage().persistent().get(&DataKey::Certificate(token_id)).expect("token_not_found")
    }
}