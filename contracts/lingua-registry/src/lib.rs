#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct LinguaRegistry;

#[contractimpl]
impl LinguaRegistry {
    pub fn record_event(env: Env, user: Address, token_id: u32) {
        let timestamp = env.ledger().timestamp();
        
        // Hata buradaydı: user değişkenini burada 'move' (taşıma) yapıyorduk.
        // user.clone() ile bir kopyasını alarak sorunu çözüyoruz.
        env.storage().persistent().set(&(user.clone(), token_id), &timestamp);
        
        // Burada da yine clone() kullanarak aynı adresi tekrar kullanabiliyoruz.
        env.storage().persistent().extend_ttl(&(user.clone(), token_id), 100, 100);
    }
}