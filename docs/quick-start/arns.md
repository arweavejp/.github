# Arweave ドメイン名の設定

***ArNS は現在テストネットでこちらで取得したトークンやドメインはメインネット移行時に無効になる可能性があります。***

[ArNS (Arewave Name System)](https://arns.app) でドメイン名を取得すると Arweave にデプロイしたファイルやアプリにドメインを設定することができ、無数にある Arweave のゲートウェイからアクセス可能になります。

例えば、 `tomo` というドメイン名を [xYMDxvWMK2QYY47u-RpjaF-LT7fFE6ihDeoKG6sVjb8](https://arweave.net/xYMDxvWMK2QYY47u-RpjaF-LT7fFE6ihDeoKG6sVjb8) に設定した場合、

- [https://tomo.arweave.net](https://tomo.arweave.net)
- [https://tomo.arweave.dev](https://tomo.arweave.dev)
- [https://tomo.g8way.io](https://tomo.g8way.io)
- [https://tomo.ar-io.dev](https://tomo.ar-io.dev)

を含む、無数のゲートウェイ URL からアクセス可能になり、 [ArConnect](https://www.arconnect.io/) をブラウザに導入していれば `ar://tomo` を URL バーに入力するだけでアクセス可能になります。既存の集権的で単一障害点になりえるドメインシステムを分散化させてどこからでもアクセス可能にする仕組みです。

また、 `undername` といってアンダーバーを使った以下のようなドメインも別々のファイルに設定可能になります。サブドメインと同じ原理です。

- ar://blog_tomo
- ar://about_tomo
- ar://social_tomo

## $tIO トークン取得

ArNS は現在テストネット中で、ドメインの購入には `tIO` トークンが必要になります。一般配布はされていないので、 DEX から取得する必要があります。

$AR を持っていない場合の取得手順です。

1. [ArConnect](https://www.arconnect.io/) から $AR を購入
2. [AOX](https://aox.xyz/#/beta) で $AR を AO にブリッジして $wAR を取得
3. [Permaswap](https://www.permaswap.network/#/ao) で $wAR を $tIO に交換

***$tIO の購入に $AR が必要になりますが、 $tIO 自体は ArNS テストネット用のテストネットトークンでメインネット移行時にどちらも無効になる可能性が高いことにご留意下さい。***

## AR.IO SDK

また、既にドメイン名を取得済みの場合、[AR.IO SDK](https://github.com/ar-io/ar-io-sdk) を使ってプログラマブルにドメイン設定を変更できます。

Arweave ドメイン名は 分散型コンピュータ AO によって管理されています。