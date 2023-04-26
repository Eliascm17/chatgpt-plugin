import { Request } from "express";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createApproveInstruction
} from "@solana/spl-token";
import { CONNECTION } from "../../../constants";
import { ClockworkProvider } from "@clockwork-xyz/sdk";
import * as anchor from "@coral-xyz/anchor";

export async function createRecurringTokenTransfer(req: Request) {

  // setup clockwork shit
  const provider = anchor.AnchorProvider.env();
  const clockworkProvider = ClockworkProvider.fromAnchorProvider(provider);

  // get args from req
  const { mint, destination, amount } = req.query;
  const { account: sender } = req.body;

  // sender and recipient pubkeys
  const senderPublicKey = new PublicKey(sender);
  const destinationPublicKey = new PublicKey(destination as String);
  const mintPublicKey = new PublicKey(mint as String);

  // sender and recipient token accounts
  const sourceToken = getAssociatedTokenAddressSync(
    mintPublicKey,
    senderPublicKey
  );
  const destinationToken = getAssociatedTokenAddressSync(
    mintPublicKey,
    destinationPublicKey
  );

  // define threadID and trigger
  const threadId = "hello_gpt" + new Date().getTime() / 1000;
  const trigger = {
      cron: {
        schedule: "*/10 * * * * * *",
        skippable: true,
      },
  };

  // create target ix that you want to automate
  const targetIx = createTransferInstruction(
      sourceToken,
      destinationToken,
      sender,
      Number(amount as string)
    );

  // create ix for creating clockwork thread
  const recurringTokenTransferThreadIx = await clockworkProvider.threadCreate(
    new PublicKey(sender),
    threadId,
    [targetIx],
    trigger,
    anchor.web3.LAMPORTS_PER_SOL / 10
  );

  // get clockwork thread pubkey
  const [recurringTokenTransferThreadPublicKey, _] = clockworkProvider.getThreadPDA(senderPublicKey, threadId);

  // create ix that delegates token authority of sender's token account to thread that they of course have authority over
  const delegateTokenAuthorityToThreadIx = createApproveInstruction(sourceToken, recurringTokenTransferThreadPublicKey, senderPublicKey, 1000000);

  // create tx
  const tx = new Transaction();

  // add ixs to tx
  tx.add(delegateTokenAuthorityToThreadIx);
  tx.add(recurringTokenTransferThreadIx);

  tx.feePayer = senderPublicKey;
  tx.recentBlockhash = (await CONNECTION.getLatestBlockhash()).blockhash;

  return {
    transaction: tx
      .serialize({ requireAllSignatures: false })
      .toString("base64"),
  };
}
