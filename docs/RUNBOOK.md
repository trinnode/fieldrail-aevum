# Runbook

## Local run

```bash
pnpm install
cp .env.example .env.local
pnpm --filter @fieldrail/web dev
cd contracts && forge build && forge test -vvv
```

## Deploy factory (requires funded testnet deployer)

```bash
cd contracts
export DEPLOYER_PRIVATE_KEY=<throwaway-test-key>   # never commit
forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast
```

Record the printed factory address in `.env.local` as `NEXT_PUBLIC_FACTORY_ADDRESS`.

## Create and configure a programme

Use `/create` in the web app, or:

```bash
export FACTORY_ADDRESS=<factory>
export TUSD8_ADDRESS=<token>
export SUPPLIER_ADDRESS=<supplier>
export AGENT_ADDRESS=<agent>
forge script script/SeedDemo.s.sol --rpc-url https://rpc-test.qday.info --broadcast
```

Set the printed vault address as `NEXT_PUBLIC_PROGRAM_VAULT_ADDRESS` to switch the dashboard to live reads.

## Run the payment journey

1. Connect the supplier wallet on `/operations` and sign the invoice.
2. Run `Simulate payment (eth_call)` — a real contract simulation.
3. Switch to the agent wallet and submit. Confirm the receipt and open the explorer link.
4. Trigger the three presets under "Blocked-payment explanations" for denial evidence.

## Emergency operations

- **Pause:** `/programme` → Pause. Payments stop; funds do not move.
- **Resume:** `/programme` → Resume. Expiry and caps are unchanged.
- **Revoke agent:** `/agents` → Revoke agent mandate. Effective immediately.
- **Revoke supplier:** sponsor-only `revokeSupplier(supplier, categoryId)`.
- **Close:** `/programme` → Close. Irreversible; blocks all payments.
- **Refund:** `/programme` → Refund unspent after close. Sponsor-only.

## Incident response

1. Pause the programme and revoke the agent.
2. Capture the transaction hashes, block numbers and event logs.
3. Do not rotate or share keys in chat; use a secure channel.
4. Write a blameless timeline and assign specific follow-up actions.

## Fork verification without testnet funds

```bash
cd contracts
forge test --match-contract ForkJourneyTest --fork-url https://rpc-test.qday.info -vvv
```

This exercises the real tUSD8 contract at live Aevum state. It is a fork simulation, not a live transaction.
