# Arweave/AO リソースまとめ
分散型ストレージ [Arweave](https://arweave.org) と ハイパー並列コンピュータ [AO](https://ao.arweave.dev) の開発者向けリソースをまとめています。

Arweave 関連のプロトコルは元々SmartWeave という Javascript が主流な [Warp スマートコントラクト](https://warp.cc/)を中心に開発されていましたが、 WASM ベースの分散型コンピュータ [AO](https://ao.arweave.dev) と Lua 言語で開発可能な AOS の登場で様々なプロトコルの AO への移行が行われています。古い情報との混乱を避けるため AO に対応したプロトコルやプロジェクトを優先的に紹介します。

Arweave 上に構築された分散型 Web のことを Permaweb と呼びます。

英語のドキュメントが多いですが日本語の情報も徐々に増やしていきます。

## Arweave 公式

- [ウェブサイト](https://arweave.org/)
- [ライトペーパー](https://www.arweave.org/files/arweave-lightpaper.pdf)
- [イエローペーパー](https://www.arweave.org/yellow-paper.pdf)
- [Arweave ウィキ](https://arwiki.arweave.dev)
- [Permaweb クックブック](https://cookbook.arweave.dev/)
- [X / Twitter](https://x.com/ArweaveEco)
- [ディスコード](https://discord.gg/AhsZfBm)

## AO 公式

- [ウェブサイト](https://ao.arweave.dev/)
- [スペック](https://ao.arweave.dev/#/read)
- [ホワイトペーパー](https://5z7leszqicjtb6bjtij34ipnwjcwk3owtp7szjirboxmwudpd2tq.arweave.net/7n6ySzBAkzD4KZoTviHtskVlbdab_yylEQuuy1BvHqc)
- [開発ドキュメント](https://cookbook_ao.g8way.io/)
- [X / Twitter](https://x.com/aoTheComputer)
- [ディスコード](https://discord.gg/dYXtHwc9dc)

## 関連プロトコル

- [Arweave Specs](https://specs.arweave.dev/) - Arweave 関連プロトコルの仕様一覧
- [トランザクションタグ](https://cookbook.arweave.dev/concepts/tags.html) - Arweave トランザクションに添付可能なタグの仕様
- [ANS-104: Bundled Data v2.0](https://specs.arweave.dev/?tx=xwOgX-MmqN5_-Ny_zNu2A8o-PnTGsoRb_3FrtiMAkuw) - Arewave トランザクションのデータフォーマット
- [Arweave GraphQL](https://gql-guide.vercel.app/) - Arweave のデータをゲートウェイから読み取る GraphQL の仕様
- [AOS インターフェイス](https://cookbook_ao.g8way.io/concepts/tour.html) - AOS でメッセージをやりとりする仕様
- [ao トークン仕様](https://cookbook_ao.g8way.io/references/token.html) - AO で取り引きされるトークンとサブ台帳の仕様
- [Arweave 2.6](https://2-6-spec.arweave.dev/) - Arweave 2.6 のプロトコルアップデート解説
- [The Framework for Evolving Arweave](https://vmqar5ywl4r2qg5hqurmnk2sgfuiqy3roqxwiap3fhrfkmjrceta.arweave.net/qyAI9xZfI6gbp4UixqtSMWiIY3F0L2QB-yniVTExESY) - Arweave をフォークによって分散型に進化させるフレームワーク
- [アトミックアセット](https://specs.g8way.io/?tx=FHoS7GZ-MiLy7Uaw0GFFX_DcLrgSpUBV6TtxB-mqAQ0) - データがプログラマブルに変更可能な Arweave NFT仕様
- [UDL (Universal Data License)](https://udlicense.arweave.net/) - 永久データを収益化するライセンスプロトコル
- [UCM (Universal Content Marketplace)](https://ucm-wiki.g8way.io/) - アトミックアセットの分散型エクスチェンジプロトコル
- [STAMPプロトコル](https://stamps.arweave.dev/#/en/main) - Permaweb 上の Like プロトコル
- [ArProfile](https://arprofile.arweave.dev/) - Arweave 上の DID

## 開発ツール

- [ArConnect](https://www.arconnect.io/) - Arweave　ウォレットのブラウザー拡張機能
- [AO Link](https://ao.link) - AO エクスプローラ
- [ViewBlock](https://viewblock.io/arweave) - Arweave エクスプローラ
- [areweave-js](https://github.com/ArweaveTeam/arweave-js) - Arweave の Javascript ライブラリ
- [arkb](https://github.com/textury/arkb) - Arweave にデータをアップロードするツール
- [arlocal](https://github.com/textury/arlocal) - ローカル環境の　Arweave　ノードを走らせるツール
- [scar](https://github.com/renzholy/scar) - Arweave の簡易エクスプローラ

## 情報メディア

- [Arweave Japan](https://github.com/arweavejp) - Arweave Japan の Github から日本語リソースをまとめています
- [Perma DAO ブログ](https://medium.com/@perma_dao) - 中華圏を中心とした Permaweb DAO のブログ
- [Community Labs Blog](https://www.communitylabs.com/blog) - Arweave 最大ののエコシステム構築や開発組織のブログ

## 主要プロジェクト

- [arweave.app](https://arweave.app) - ウェブブラウサベースのArweaveウォレット
- [ArNS](https://arns.app/) - Arweaveのドメインネームシステム
- [ArDrive](https://ardrive.io) - Arweaveを使ったファイルストレージサービス
- [AR.IO](https://ar.io) - Arweaveの分散型ゲートウェイ
- [WeaveDB](https://weavedb.dev) - スマートコントラクト分散型NoSQLデータベース
- [Akord](https://akord.com) - 暗号化されたプライベートストレージ
- [Autonomous Finance](https://www.autonomous.finance/) - AIとDeFiの融合
- [Alex](https://alex.arweave.dev/) - 人類の歴史と文化を永久保存する分散型アーカイブ
- [RedStone](https://redstone.finance/) - Arweave/AO を活用した安価なモジュラーオラクル
- [Warp](https://warp.cc/) - Arweaveのスマートコントラクトプラットフォーム
- [WeaveVM](https://www.wvm.dev/) - Arweaveを活用したスケール可能なEVM
- [Irys](https://irys.xyz) - Arweaveを活用したデータプロビナンスサービス
- [BazAR Marketplace](https://ao-bazar.arweave.net/) - アトミックアセットのエクスチェンジ