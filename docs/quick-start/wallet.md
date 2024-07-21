# Arweave ウォレット導入

Arweave にファイルをアップロードしたりトランザクションを送るためには Arewave のアカウントと $AR トークンが必要になります。

## ArConnect ブラウザー拡張機能

ArConnect ブラウザー拡張機能を導入するとアカウント作成やトークン管理が簡単になります。ローカル環境を設定して開発テスト等をする場合、必ずしもトークンは必要ではありません。

ArConnect の使い方は公式サイトをご参照下さい。

- [ArConnect](https://arconnect.io)

## 開発用 $AR トークン配布

Arweave Japan の[ディスコード](https://discord.gg/bB4N7fAMmp)にて開発用に小額の $AR トークンを配布しています。

### $AR トークン購入と $AO トークンの自動配布

$AR トークンの一番簡単な取得方法は ArConnect ウォレット内にある購入機能を通じて [Transac](https://transak.com/) から購入することです。日本からだとクレジットカードや Google Pay 、Apple Pay がご利用可能です。

$AR トークンをウォレットに保有していると5分毎に $AO トークンが配布されます。AO 分散型コンピュータのセキュリティの一部はベースレイヤーの Arweave ストレージに担保されているため ビットコインと同じ半減期でミントされる$AO トークンの33%は $AR トークン保有者に自動配布される仕組みになっています。残りの67%はイーサリアムL1でstETHのリステーキングの報酬として分配されます。

### RSA JSON KeyFile

Arweave のアカウントは RSA 暗号によって生成されており、ArConnectから JSON KeyFile をエクスポート可能です。ウェブブラウザとローカルの開発環境で同じアカウントを使う場合、この KeyFile が必要になります。

## arweave.js でアカウント生成

Arweave SDK の [arweave.js](https://github.com/ArweaveTeam/arweave-js) を使ってプログラマブルにアカウントを生成し、 ArConnect にインポートすることもできます。

```bash
yarn add arweave
```

NodeJS でのアカウント生成手順です。ウェブブラウザでも同様に`arweave.js`を使うことができます。

```javascript
const Arweave = require("arweave")
const { writeFileSync } = require("fs")

const main = async () => {
  const { wallets } = Arweave.init()
  const key = await wallets.generate()
  const address = await wallets.jwkToAddress(key)
  console.log(address)
  writeFileSync("keyfile.json", JSON.stringify(key))
}

main()
```
生成された`keyfile.json`を ArConnect にインポートすることができます。