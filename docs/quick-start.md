# Arweave / AO 開発入門

開発者がゼロから Arweave / AO でプロトコルを開発できるハッカーになる最短学習コースです。

## 導入編

### Arweave とは？

高度なアルゴリズム的ゲーム理論を組み合わせ、データを半永久的に保存可能にする分散型ストレージプロトコルです。
$AR トークンによってデータ保存時に一度だけ安価な使用料を払うことで最低200年はデータが保存される設計です。効率的な PoW とデータサンプリング的な仕組みを合わせた SPoRA （Succinct Proof of Random Access） でストレージは無制限にスケールできる設計になっています。

### AO とは？

Arweave ストレージを活用した分散型計算プロトコルです。既存のブロックチェーンのスケーラビリティ問題を、アクターモデルによる非同期メッセージと PoS によるプログラマブルなセキュリティで解決し、無制限にスケールできる分散型スーパーコンピュータです。イーサリアムL1のリステーキングとビットコインと同じ半減期でミントされるフェアローンチトークン $AO によってセキュリティが担保されます。SCP （Storage-based Consensus Paradigm） やホログラフィックステートという概念で安価で無制限にスケール可能なスマートコントラクトや分散型 VM （仮想マシン） が実現できます。


### 何が開発できる？

既存のブロックチェーンのボトルネックはストレージと計算コストが高くスケールできないことです。Arweave / AO はその2点の課題を解決し無制限にスケールできる分散型永久ストレージと分散型並列コンピュータを実現しました。これまでの Web3 では実現不可能であったWebレベルでスケール可能な実用的アプリケーション、 AI と DeFi や分散型インフラの融合、またゼロ知識証明やFHE（完全準同型暗号）を活用した画期的なプロトコル等が開発可能です。

- [Arweave / AO リソースまとめ](./resources.md)

## 初級編

まずは Arweave を触ってみましょう！

1. [Arweave ウォレット導入](./quick-start/wallet.md)
2. [ファイルアップロード](./quick-start/upload-files.md)
3. [分散型アプリケーションのデプロイ](./quick-start/deploy-app.md)
4. [Arweave ドメイン名の設定](./quick-start/arns.md)

## 中級編

AOS を導入して AO 上にアプリを作ってみましょう！

5. [AOS を使ってみる](./quick-start/aos.md)
6. [AOS Lua ハンドラー開発](./quick-start/handlers.md)
7. [フロントエンドから AO に接続](./quick-start/aoconnect.md)

## 上級編

Arweave / AO の仕様を深く理解して独自の分散型 VM を作ってみましょう！

8. [ローカル開発環境の設定](./quick-start/local-environment.md)
9. [ANS-104](./quick-start/ans-104.md)
10. [GraphQL によるデータアクセス](./quick-start/graphql.md)
11. [AO Spec （MU / SU / CU）](./quick-start/ao.md)
12. [AO Compute Unit (VM) の開発](./quick-start/cu.md)

***2024年8月25日に開催された AO ブートキャンプ第一弾の[チュートリアル](./bootcamp/vol_01.md)で詳細に解説しました。***