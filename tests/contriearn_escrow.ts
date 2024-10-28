import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { randomBytes } from "crypto";
import {
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

import { ContriearnEscrow } from "../target/types/contriearn_escrow";

describe("escrow-new", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .ContriearnEscrow as Program<ContriearnEscrow>;

  const wallet = provider.wallet as NodeWallet;

  const maker = anchor.web3.Keypair.generate();
  const taker = anchor.web3.Keypair.generate();

  let mintA: anchor.web3.PublicKey;

  let makerAtaA: anchor.web3.PublicKey;

  let takerAtaA: anchor.web3.PublicKey;

  const seed = new anchor.BN(randomBytes(8));
  const escrow = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0];

  it("Airdrop Sol to maker and taker", async () => {
    const tx = await provider.connection.requestAirdrop(
      maker.publicKey,
      1000000000
    );
    await provider.connection.confirmTransaction(tx);
    console.log(
      "Maker balance: ",
      await provider.connection.getBalance(maker.publicKey)
    );

    const tx2 = await provider.connection.requestAirdrop(
      taker.publicKey,
      1000000000
    );
    await provider.connection.confirmTransaction(tx2);
    console.log(
      "Taker balance: ",
      await provider.connection.getBalance(taker.publicKey)
    );
  });

  it("Create tokens and Mint Tokens", async () => {
    mintA = await createMint(
      provider.connection,
      wallet.payer,
      provider.publicKey,
      provider.publicKey,
      6
    );
    console.log("Mint A: ", mintA.toBase58());

    makerAtaA = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        wallet.payer,
        mintA,
        maker.publicKey
      )
    ).address;
    console.log("Maker ATA A: ", makerAtaA.toBase58());

    takerAtaA = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        wallet.payer,
        mintA,
        taker.publicKey
      )
    ).address;
    console.log("Taker ATA A: ", takerAtaA.toBase58());

    await mintTo(
      provider.connection,
      wallet.payer,
      mintA,
      makerAtaA,
      provider.publicKey,
      1_000_000_0
    );
  });

  it("make", async () => {
    const vault = getAssociatedTokenAddressSync(
      mintA,
      escrow,
      true,
      TOKEN_PROGRAM_ID
    );

    const tx = await program.methods
      .make(seed, new anchor.BN(1_000_000))
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        makerAtaA,
        escrow,
        vault,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    console.log("Your transaction signature ", tx);
  });

  it("take", async () => {
    const vault = getAssociatedTokenAddressSync(
      mintA,
      escrow,
      true,
      TOKEN_PROGRAM_ID
    );

    const tx = await program.methods
      .take(new anchor.BN(1_000_000))
      .accountsPartial({
        maker: maker.publicKey,
        taker: taker.publicKey,
        mintA,
        escrow,
        vault,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taker])
      .rpc();

    console.log("Your transaction signature ", tx);
  });
});
