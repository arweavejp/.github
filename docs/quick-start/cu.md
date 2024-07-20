# AO Compute Unit (VM) の開発

Compute Unit がメッセージを Wasm プログラムで計算する VM の役割を果たしています。

例えば [CosmWasm AO](https://github.com/weavedb/cosmwasm-ao) は　CosmWasm （Rust） でスマートコントラクトの書ける AOS ともメッセージ互換性のある VM を開発しています。また、 EVM や SVM （Solana VM） を同様に AO に載せることも可能です。