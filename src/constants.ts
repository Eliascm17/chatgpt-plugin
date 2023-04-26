import express from "express";
import { Connection } from "@solana/web3.js";
import { TransactionHandler } from "./handlers/transaction-handlers";
import { createRecurringTokenTransfer } from './handlers/transaction-handlers/createRecurringTokenTransfer';

export const APP = express();
export const PORT = process.env.PORT || 3333;

export const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
export const CONNECTION = new Connection(SOLANA_RPC_URL);

// Internal Solana Pay constants
export const SOLANA_PAY_LABEL = "Solana Clockwork GPT Plugin";
export const TRANSACTION_ENDPOINTS = [ "createRecurringTokenTransfer" ];
export type TransactionEndpoints = (typeof TRANSACTION_ENDPOINTS)[number];
export const TX_DESCRIPTIONS: Record<TransactionEndpoints, string> = {
  createRecurringTokenTransfer: "Sign to create recurring token transfer powered by clockwork"
};
export const TX_HANDLERS: Record<TransactionEndpoints, TransactionHandler> = { 
  createRecurringTokenTransfer: createRecurringTokenTransfer
};

// Inferred Constants
export let HELIUS_URL: string;
export let SELF_URL: string;

export default function index() {
  HELIUS_URL = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`;
  if (process.env.DEV === "true") {
    SELF_URL = `http://localhost:${PORT}`;
  } else {
    SELF_URL = "https://solana-gpt-plugin.onrender.com";
  }
}
