# aoBootcamp Vol.01

- [ローカル環境の設定](#ローカル環境の設定)
- [Arweaveの基礎](#arweaveの基礎)
- [AOS](#aos)
- [独自VMの開発](#独自vmの開発)
- [AOトークン設計](#aoトークン設計)

## ローカル環境の設定

[NodeJS v22](https://nodejs.org/) と [Docker](https://docker.com/) をインストールしてください。

```bash
git clone -b hotfix https://github.com/weavedb/ao-localnet.git
cd ao-localnet/wallets && ./generateAll.sh
cd ../ && sudo docker compose --profile explorer up
```

Docker の起動に成功すると以下のノードがローカル環境で動きます。

- ArLocal : [localhost:4000](http://localhost:4000) - Arweave ローカルゲートウェイ
- GraphQL : [localhost:4000/graphql](http://localhost:4000/graphql) - Arweave GraphQL
- Scar : [localhost:4006](http://localhost:4006) - Arweave ローカルエクスプローラ
- MU : [localhost:4002](http://localhost:4002) - AO メッセンジャーユニット
- SU : [localhost:4003](http://localhost:4003) - AO スケジューラユニット
- CU : [localhost:4004](http://localhost:4004) - AO コンピュートユニット


AOS の Wasm モジュールをダウンロードし AO のユニット運営に必要な各種ウォレットを生成して、ローカル AR トークンをミントします。 生成したウォレットでモジュールをローカル Arweave にアップロードします。モジュールのトランザクション ID が波線で表示されるのでメモしてください。最後のコマンドでウォレットのアドレスがリストされますので、こちらはスケージューラウォレットのアドレスをメモしてください。後に利用します。

```bash
nvm use 22
cd ao-localnet/seed && ./download-aos-module.sh
./seed-for-aos.sh
cd ../wallets && node printWalletAddresses.mjs
```

### 参照

- [ao-localnet](https://github.com/permaweb/ao-localnet) （バグがあるので[修正版](https://github.com/weavedb/ao-localnet/tree/hotfix)を使っています）
- [ArLocal](https://github.com/textury/arlocal)
- [Scar](https://github.com/renzholy/scar)

## Arweaveの基礎

### Arweave ゲートウェイへ接続

```bash
npm i arweave
```

デフォルトがローカル環境のポート `80` 設定になっているので `port` だけ `4000` に指定します。

```javascript
const arweave = require("arweave").init({ port: 4000 })
```

- 参照 : [arweave-js](https://github.com/ArweaveTeam/arweave-js)

### Arweave ウォレットの作成

Arweave アカウントには RSA が使われていてアドレスは公開鍵の SHA-256 ハッシュで 43 文字です。JWK　形式で生成されたものを使うのが一般的です。

```javascript
const addr = async jwk => arweave.wallets.jwkToAddress(jwk)

const gen = async () => {
  const jwk = await arweave.wallets.generate()
  return { jwk, addr: await addr(jwk) }
}
```

```javascript
const {jwk, addr} = await gen()
```

JWK は以下のフォーマットで生成されますが、基本的に `n` が公開鍵、 `d` が秘密鍵で `Web Crypto API` 等と組み合わせて署名や暗号化等、様々な用途に使うこともできます。他のフィールド（ `p` `q` `dp` `dq` `qi` ）は暗号処理を高速化させるためのパラメータです。

```json
{
  "kty":"RSA",
  "n":"o1kvT...",
  "e":"AQAB",
  "d":"Ohpdn...",
  "p":"ymLt9...",
  "q":"zp7X_...",
  "dp":"pyN6W...",
  "dq":"wkpHn....",
  "qi":"Zvbxf..."
}
```

### AR トークンをミント （ArLocal 限定）

ローカル環境の `ArLocal` に限り AR トークンを無制限にミントできます。また、 Arweave メインネットは分散化されたマイナーに自動でマイニングされますが、ローカルノードの場合手動で `/mine` API を呼び出す必要があります。 `/mine` をして始めて、 [`Scar` エクスプローラ](http://localhost:4006)に反映されます。

```javascript
const mine = async () => await arweave.api.get(`/mine`)

const bal = async addr => {
  return arweave.ar.winstonToAr(await arweave.wallets.getBalance(addr))
}

const mint = async (addr, amount = "1.0") => {
  await arweave.api.get(`/mint/${addr}/${arweave.ar.arToWinston(amount)}`)
  await mine()
  return await bal(addr)
}
```

```javascript
const {jwk, addr} = await gen()
const balance = await mint(addr, "10.0")
```

### AR トークンを送金

トランザクションの基本フローは `createTransaction`、`sign`、`post` です。 `createTransaction` のオプションに `data` または `target` と `quantity` が必須で、前者がデータ保存、後者が送金になります。送金とデータ保存を組み合わせることもできます。また、次のセクションにあるように任意の数のタグをトランザクションのメタデータに設定して `GraphQL` で柔軟に検索可能にすることができます。

```javascript
const postTx = async (tx, jwk) => {
  await arweave.transactions.sign(tx, jwk)
  await arweave.transactions.post(tx)
  await mine()
  return tx.id
}

const transfer = async (jwk, to, amount) => {
  let tx = await arweave.createTransaction({
    target: to,
    quantity: arweave.ar.arToWinston(amount),
  })
  return postTx(tx, jwk)
}
```

```javascript
const { addr: addr1, jwk } = await gen()
const { addr: addr2 } = await gen()
await mint(addr1, "1.0")
await transfer(jwk, addr2, "0.5")
```
### テキストデータを保存

データを保存するには `craeteTransaction` のオプションにデータを指定して、 `Content-Type` タグを設定します。

```javascript
const saveMD = async (md, jwk) => {
  let tx = await arweave.createTransaction({ data: md })
  tx.addTag("Content-Type", "text/markdown")
  return await postTx(tx, jwk)
}
```

```javascript
const txid = await saveMD("# This is Markdown", jwk)
```

### 画像データを保存

```javascript
const saveSVG = async (svg, jwk) => {
  let tx = await arweave.createTransaction({ data: Buffer.from(svg, "base64") })
  tx.addTag("Content-Type", "image/svg+xml")
  return await postTx(tx, jwk)
}
```
[AO のロゴ](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDI5IiBoZWlnaHQ9IjIxNCIgdmlld0JveD0iMCAwIDQyOSAyMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDIxNEg3MS4zNzYzTDg1Ljk0MjkgMTc0LjYxTDUzLjE2ODEgMTA3LjVMMCAyMTRaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTg5LjM2NiAxNjAuNzVMMTA5Ljk3OCAxTDg1Ljk0MjkgNTUuNzA4OUwxNjAuOTYxIDIxNEgyMTVMMTg5LjM2NiAxNjAuNzVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyMiAyMTRDMzgxLjA5NCAyMTQgNDI5IDE2Ni4wOTQgNDI5IDEwN0M0MjkgNDcuOTA1NSAzODEuMDk0IDAgMzIyIDBDMjYyLjkwNiAwIDIxNSA0Ny45MDU1IDIxNSAxMDdDMjE1IDE2Ni4wOTQgMjYyLjkwNiAyMTQgMzIyIDIxNFpNMzIyIDE3MkMzNTcuODk5IDE3MiAzODcgMTQyLjg5OSAzODcgMTA3QzM4NyA3MS4xMDE1IDM1Ny44OTkgNDIgMzIyIDQyQzI4Ni4xMDEgNDIgMjU3IDcxLjEwMTUgMjU3IDEwN0MyNTcgMTQyLjg5OSAyODYuMTAxIDE3MiAzMjIgMTcyWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg==)を SVG 形式でアップロードしてみましょう。

```javascript
const ao = "PHN2ZyB3aWR0aD0iNDI5IiBoZWlnaHQ9IjIxNCIgdmlld0JveD0iMCAwIDQyOSAyMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDIxNEg3MS4zNzYzTDg1Ljk0MjkgMTc0LjYxTDUzLjE2ODEgMTA3LjVMMCAyMTRaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTg5LjM2NiAxNjAuNzVMMTA5Ljk3OCAxTDg1Ljk0MjkgNTUuNzA4OUwxNjAuOTYxIDIxNEgyMTVMMTg5LjM2NiAxNjAuNzVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyMiAyMTRDMzgxLjA5NCAyMTQgNDI5IDE2Ni4wOTQgNDI5IDEwN0M0MjkgNDcuOTA1NSAzODEuMDk0IDAgMzIyIDBDMjYyLjkwNiAwIDIxNSA0Ny45MDU1IDIxNSAxMDdDMjE1IDE2Ni4wOTQgMjYyLjkwNiAyMTQgMzIyIDIxNFpNMzIyIDE3MkMzNTcuODk5IDE3MiAzODcgMTQyLjg5OSAzODcgMTA3QzM4NyA3MS4xMDE1IDM1Ny44OTkgNDIgMzIyIDQyQzI4Ni4xMDEgNDIgMjU3IDcxLjEwMTUgMjU3IDEwN0MyNTcgMTQyLjg5OSAyODYuMTAxIDE3MiAzMjIgMTcyWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg=="
const txid = await saveSVG(ao, jwk)
```

### GraphQL でトランザクションを取得

Arweave の最大の強みは、データと共に任意のタグをトランザクションに指定して無数にある分散型ゲートウェイから GraphQL で柔軟に検索可能にできることです。この仕組みを活用するとあらゆる分散型アプリケーションの構築が可能になります。 ハイパー並列コンピュータ AO もこの仕組みをフル活用したプロトコルです。保存されるデータとタグは Arweave でマイニングされる前に、ゲートウェイのキャッシュで即座にアクセス可能になります。究極に速くて便利なプレコンファメーションの仕組みです。

### 参照

- [Arweave のトランザクションタグについて](https://cookbook.arweave.dev/concepts/tags.html)
- [Arweave GraphQL ガイド](https://gql-guide.vercel.app/)

```javascript
const q = txid => `query {
    transactions(ids: ["${txid}"]) {
        edges {
            node { id tags { name value } owner { address } }
        }
    }
}`

const getTx = async txid => {
  const json = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q(txid) }),
  }).then(r => r.json())
  return json.data.transactions.edges.map(v => v.node)[0]
}

```

### データを取得

アップロードされたデータを取得する方法は二つあります。`arweave.js` の `getData` を使うか無数の分散型ゲートウェイから `http` リクエストで取得するかです。例えば、画像をアップロードして `https://arweave.net/[txid]`から即座に参照するアプリケーションを作ること等ができます。

```javascript
const data = await arweave.transactions.getData(
    txid, 
    { decode: true, string: true}
)
```

```javascript
const data = await fetch(`http://localhost:4000/${txid}`).then((r)=> r.text())
```


### トランザクションをネストしてバンドル

Arweave にはメタデータとして任意のタグとデータそのものを保存できますが、更に真価を発揮するのが [ANS-104 Bundled Data v2.0](https://specs.arweave.dev/?tx=xwOgX-MmqN5_-Ny_zNu2A8o-PnTGsoRb_3FrtiMAkuw) 規格によってデータの部分にバイナリフォーマットでトランザクションを無限にネストできる仕組みです。１トランザクションに１００万トランザクションをネストして送ることもできます。このネストの仕組みで Arweave は無制限にスケールすることができます。バンドルフォーマットの作成には `arbundles` を使います。

```bash
npm i arbundles
```

```javascript
const { ArweaveSigner, bundleAndSignData, createData } = require("arbundles")

const bundle = async (_items, jwk) => {
  const signer = new ArweaveSigner(jwk)
  const items = _items.map(v => {
    let tags = []
    for (const k in v[1] && {}) tags.push({ name: k, value: v[1][k] })
    return createData(v[0], signer, { tags })
  })
  const bundle = await bundleAndSignData(items, signer)
  const tx = await bundle.toTransaction({}, arweave, jwk)
  await postTx(tx, jwk)
  return { items, tx }
}
```

例えば、先に挙げたマークダウンファイルと SVG 画像ファイルをバンドルして一緒にアップロードしてみます。

```javascript
const { items } = await bundle(
  [
    ["# This is Markdown!", { Content_Type: "text/markdown" }],
    [Buffer.from(ao, "base64"), { Content_Type: "images/svg+xml" }],
  ],
  jwk
)
```
ネストしたトランザクションのデータ部分に更に無数のトランザクションをネストできます。ネストしたトランザクションやデータも、GraphQL や分散型ゲートウェイから即座に参照可能になります。次のセクションで取り扱う、 `AO` は `ANS-104` フォーマットのフル活用事例です。

## AOS

### AO とは？

AO は 上記した Arweave の `ANS-104` 規格をフル活用した、無制限に水平スケール可能な分散型スーパーコンピュータです。３つのユニット（ MU / SU / CU ）がそれぞれ分散化されて疎結合され、Ethereum のレイヤー１のリステーキングや AR トークンの保有によって発行される AO トークンによってセキュリティが担保されます。AO は単に非同期メッセージの共通フォーマットを定義したもので、その実装方法は定義されていません。 AOS は Lua 言語をベースとした AO 上の最初の VM 実装です。

AO の Lua ベース VM である AOS は、コマンドライン REPL から便利に使うこともできますが、ここでは `aoconnect` を使ってプログラマブルなアプローチをします。

#### 

- [AO スペック](https://ao.arweave.dev/#/read)
- [AO クックブック](https://cookbook_ao.g8way.io/)
- [aoconnect](https://cookbook_ao.g8way.io/guides/aoconnect/aoconnect.html)

### ユニットに接続

```bash
npm i @permaweb/aoconnect
```

メインネット環境では `connect` を使う必要はありませんが、今回はローカル環境のユニットに接続するため `connect` で各種 URL を指定します。

```javascript
const { createDataItemSigner, connect } = require("@permaweb/aoconnect")
const { result, message, spawn, dryrun } = connect(
  {
    MU_URL: "http://localhost:4002",
    CU_URL: "http://localhost:4004",
    GATEWAY_URL: "http://localhost:4000",
  },
)
```

ただし、ローカル環境で AO / AOS を使うと、デバッグに非常に便利な [ao.link](https://ao.link) エクスプローラが使えなくなるため、 Arweave メインネットに保存してテストする形の方が便利かもしれません。その場合、`aoconnect` を以下のようにして使えます。

```javascript
const { result, message, spawn, dryrun } = require("@permaweb/aoconnect")
```

### AOS プロセスを spawn

AO の仕組みを簡潔に説明すると、まずバイナリ形式の Wasm モジュールを Arwaeve に保存します。そして各プロセスが Wasm モジュールをインスタンス化して 4GB (Wasm32) または、 16GB (Wasm64) のメモリを持つことができます。プロセスにユーザーや別のプロセスが非同期にメッセージを送りそれがモジュールにインプットされて Wasm メモリ （スマートコントラクトのステート） を更新 していきます。各プロセスから任意の `message` や別のプロセスを `spawn` したり、 `cron` を使って定期的にメッセージを生成することで完全に `Autonomous` な スマートコントラクト を動かすことができます。また、拡張機能を使って LLM の推論をオンチェーンに載せて Autonomous な AI を動かすこともできます。

ローカル環境立ち上げ時にメモした Module のトランザクション ID と　スケジューラウォレットを指定して、AOS モジュールをインスタンス化したプロセスを立ち上げましょう。プロセスを spawn 後に、MU がメッセージを SU にリレーして SU が Arweave に保存するラグがあるので１秒ほど待ってからトランザクションにアクセスします。

```javascript
const wait = ms => new Promise(res => setTimeout(() => res(), ms))

const pid = await spawn({
  module: AOS_MODULE_TXID,
  scheduler: SCHEDULER_WALLET,
  signer: createDataItemSigner(jwk),
})

await wait(1000)

console.log(await getTx(pid))
```

### Lua ハンドラーを作成

インスタンス化した、プロセスには任意の Lua スクリプトを追加することができます。`Handlers.add` と `hasMatchingTag` を使ってタグにマッチした際に実行する関数を定義するのが一般的です。スクリプトは `eval` によって評価され既にデプロイ済みのスクリプトに後付けされます。これにより、指定済みの既存の変数などを上書きすることができます。

簡単な Key-Value ストアを実装してみます。

```lua
local ao = require('ao')
Store = Store or {}

Handlers.add(
   "Get",
   Handlers.utils.hasMatchingTag("Action", "Get"),
   function (msg)
      assert(type(msg.Key) == 'string', 'Key is required!')
      ao.send({ Target = msg.From, Tags = { Value = Store[msg.Key] }})
   end
)

Handlers.add(
   "Set",
   Handlers.utils.hasMatchingTag("Action", "Set"),
   function (msg)
      assert(type(msg.Key) == 'string', 'Key is required!')
      assert(type(msg.Value) == 'string', 'Value is required!')
      Store[msg.Key] = msg.Value
      Handlers.utils.reply("Value stored!")(msg)
   end
)
```

### ハンドラーを登録

Lua スクリプトを作成したら、 `Eval` アクションによってプロセスに追加します。これは AOS REPL の `.load [script-name.lua]` と同じです。

```javascript
const { readFileSync } = require("fs")
const { resolve } = require("path")

const lua = readFileSync(resolve(__dirname, "test.lua"), "utf8")
const mid = await message({
  process: pid,
  signer: createDataItemSigner(jwk),
  tags: [{ name: "Action", value: "Eval" }],
  data: lua,
})

const res = await result({ process: pid, message: mid })
console.log(res)
```

追加したハンドラーを使ってみます。書き込みをする際は `message` を使いますが、読み取りだけの場合は `dryrun` を使います。この場合、Arweave にメッセージが保存せずに現状の状態だけを取得することができます。読み取りを `message` であえて記録することも可能ですが、これはプロセス同士がある瞬間の状態の記録を取って参照する場合等に使えます。

```javascript
const mid1 = await message({
  process: pid,
  signer: createDataItemSigner(jwk),
  tags: [
    { name: "Action", value: "Set" },
    { name: "Key", value: "test" },
    { name: "Value", value: "abc" },
  ],
})
const res1 = await result({ process: pid, message: mid1 })
console.log(res1.Messages[0])

const res2 = await dryrun({
  process: pid,
  signer: createDataItemSigner(jwk),
  tags: [
    { name: "Action", value: "Get" },
    { name: "Key", value: "test" },
  ],
})
console.log(res2.Messages[0].Tags)
```

他にも、AOS では既存メッセージの `Assign` によって Arweave に保存されたデータを読み込んだり、 `Cron` を設定して `Monitor` することでプロセスを Autonomous にしたりと他のブロックチェーンでは不可能な処理を実行することが可能です。

- [AOS チュートリアル](https://cookbook_ao.g8way.io/welcome/index.html)

## 独自VMの開発

AO　プロセスの処理は CU (コンピュートユニット) が行っていますが、 AOS モジュールは AO の実装の一例に過ぎず、[ao-loader](https://github.com/permaweb/ao/tree/main/loader) に準拠する独自のモジュールを Lua や他の言語で開発することも可能ですし、実はモジュールが Wasm である必要もありません。CU はあるメッセージの実行結果を要求されると、まずそのプロセスの使っているモジュールアドレスを特定し、モジュールメッセージのタグから読み取れるメタ情報等から Wasm のロード方法を判別し `ao-loader` を使ってプロセスの計算を実行します。AOS の Wasm モジュールは [ao CLI](https://github.com/permaweb/ao/tree/main/dev-cli) で Lua をコンパイルして作成可能ですが、モジュールを ao-loader に互換性のない非 Wasm で書き換えても、それ専用のローダーを作ればよいのです。ここでは、実装のヒントとして簡単な Javascript のモジュールとそれに付随する CU / MU を開発してみます。SU は AOS のものをそのまま使います。SU はメッセージを並べて Arweave にアップロードするシーケンサの役割を担うだけなので、モジュールによって実装を変更する必要がありません。

```bash
npm i express body-parser @permaweb/ao-scheduler-utils
```

## Messenger Unit

メッセンジャーユニットの役割は、ユーザーから受け取ったバイナリメッセージを正当なものか判別して、 [ao-scheduler-utils](https://github.com/permaweb/ao/tree/main/scheduler-utils) を使ってそのプロセスを担当している SU の URL を特定しメッセージを横流しします。他にも CU の 計算結果 から spawn されたメッセージを SU にルーティングする等の役割がありますが、ここではそれが発生しないシンプルなモジュールを作ります。

```javascript
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
app.use(bodyParser.raw({ type: "application/octet-stream" }))
const port = 3000
const { DataItem } = require("arbundles")
const { connect } = require("@permaweb/ao-scheduler-utils")

const { validate, locate, raw } = connect({
  GRAPHQL_URL: "http://localhost:4000/graphql",
  cacheSize: 1000,
  followRedirects: true,
  GRAPHQL_MAX_RETRIES: 0,
  GRAPHQL_RETRY_BACKOFF: 300,
})

const getTag = (name, tags) => {
  for (const v of tags) {
    if (v.name === name) return v.value
  }
  return null
}

const schs = {}
app.post("/", async (req, res) => {
  const binary = req.body
  let valid = await DataItem.verify(binary)
  const item = new DataItem(binary)
  const type = getTag("Type", item.tags)
  let _url = null

  if (type === "Process") {
    const sch = getTag("Scheduler", item.tags)
    const { url } = await locate(item.id, sch)
    schs[item.id] = url
    _url = url
  } else {
    _url = schs[item.target]
  }
  try {
    const json = await fetch(_url, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: binary,
    }).then(response => response.json())
    console.log(json)
  } catch (e) {
    console.log(e)
  }
  res.json({ id: item.id })
})

app.get("/", async (req, res) => {
  res.send("ao messenger unit")
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

```bash
node mu.js
```

### Compute Unit

CU はあるトランザクションの結果を要求されると、そのプロセスからモジュールを特定してダウンロードするのとスケジューラを特定し SU から最新のメッセージまでを全て受け取りモジュールにインプットして遅延評価します。ここでは NodeJS の内臓 サンドボックス環境である `vm` を使って `Num` タグがメッセージに含まれていたらそれを Javascript に渡すだけの簡易ローダーを実装してみます。結果として現在の `Count` を Message で返します。

```javascript
const vm = require("vm")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
app.use(bodyParser.raw({ type: "application/octet-stream" }))
const port = 3001
const { DataItem } = require("arbundles")
const { connect } = require("@permaweb/ao-scheduler-utils")

const { validate, locate, raw } = connect({
  GRAPHQL_URL: "http://localhost:4000/graphql",
  cacheSize: 1000,
  followRedirects: true,
  GRAPHQL_MAX_RETRIES: 0,
  GRAPHQL_RETRY_BACKOFF: 300,
})

const getTag = (name, tags) => {
  for (const v of tags) {
    if (v.name === name) return v.value
  }
  return null
}

const q = txid => `query {      
    transactions(ids: ["${txid}"]) {     
        edges {                        
            node { id tags { name value } owner { address } }
        }                                   
    }       
}`

let modules = {}
app.get("/result/:mid", async (req, res) => {
  const { ["process-id"]: pid } = req.query
  const { mid } = req.params
  
  const json = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q(pid) }),
  }).then(r => r.json())
  if (!modules[pid]) {
    const module = getTag("Module", json.data.transactions.edges[0].node.tags)
    let js = await fetch(`http://localhost:4000/${module}`).then(r => r.text())
    modules[pid] = { code: js, id: module, state: { count: 0 } }
  }
  const json2 = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q(mid) }),
  }).then(r => r.json())
  const num = getTag("Num", json2.data.transactions.edges[0].node.tags)
  const code =
    modules[pid].code + `
    count = handle(count, ${num * 1});`
  const context = vm.createContext(modules[pid].state)
  vm.runInContext(code, context)
  modules[pid].state = context
  res.json({
    Messages: [
      {
        Tags: [
          { name: "Count", value: Number(modules[pid].state.count).toString() },
        ],
      },
    ],
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

```bash
node cu.js
```

### Javascript Module を登録

モジュールは Javascript の `handle` 関数で定義して、第一パラメータ （ステート） に第二パラメータを足して返信するだけのシンプルなロジックにします。これを AO のモジュールメッセージのスペックに準拠して `Module-Format` を `js-unknown-unknown` に変更してアップロードします。このモジュールフォーマットを検知した CU が先に定義したシンプルなローダーを使って遅延計算します。AO のメッセージスペックには完全に準拠しているので AOS 等他のプロセスとインターオペラビリティを持ってメッセージの交換ができます。この様に、 AO はメッセージフォーマットをスペックとして定義しているだけで実装言語や技術スタックは自由なのです。 工夫すれば Ethereum や Solana の VM を AO に載っけることも可能です。`Content-Type` は AO のスペック外ですがゲートウェイからのファイルアクセスの利便性のため指定しておきます。

```javascript
const arweave = require("arweave").init({ port: 4000 })

const js = `
function handle(count, num) {
  return count + num;
}`

const { addr: addr1, jwk } = await gen()
const balance = await mint(addr1)

let tx = await arweave.createTransaction({ data: js })
tx.addTag("Data-Protocol", "ao")
tx.addTag("Variant", "ao.TN.1")
tx.addTag("Type", "Module")
tx.addTag("Module-Format", "js-unknown-unknown")
tx.addTag("Input-Encoding", "JSON-V1")
tx.addTag("Output-Encoding", "JSON-V1")
tx.addTag("Content-Type", "text/javascript")
const module_txid = await postTx(tx, jwk)
await wait(1000)
```

### Scheduler URL を登録

プロセスを `spawn` する前に、 `Scheduler-Location` メッセージを使ってスケジューラアドレスに SU の URL を登録する必要があります。 MU と CU はこの情報を使って `ao-scheduler-utils` 等でプロセスのスケジューラを特定します。`Scheduler-Location` を署名する `jwk` のアドレスが URL の管理アドレスになります。これは DNS のように機能します。先に説明したように Arweave のトランザクションにはトークンの送金かデータのアップロードが必須なので、適当に `1984` と指定します。

```javascript
let tx = await arweave.createTransaction({ data: "1984" })
tx.addTag("Data-Protocol", "ao")
tx.addTag("Variant", "ao.TN.1")
tx.addTag("Type", "Scheduler-Location")
tx.addTag("Url", "http://localhost:4003")
tx.addTag("Time-To-Live", "1000000000")
await postTx(tx, jwk)
await wait(1000)
```

### プロセスを spawn

モジュールのトランザクション ID とスケジューラの管理アドレスを指定してプロセスを立ち上げるメッセージを `aoconnect`で `spawn` します。

```javascript
const { createDataItemSigner, connect } = require("@permaweb/aoconnect")
const { result, message, spawn, dryrun } = connect({
  MU_URL: "http://localhost:3000",
  CU_URL: "http://localhost:3001",
  GATEWAY_URL: "http://localhost:4000",
})

const pid = await spawn({
  module: module_txid,
  scheduler: addr,
  signer: createDataItemSigner(jwk),
})
await wait(1000)
```

### Message を送信

作成した Javascript モジュールとプロセスを使ってみましょう。 `Num` タグをつけて `message` を送ります。この値が足されてレスポンスメッセージとして返ってきます。`Count` が `4` のタグが含まれていれば成功です。二回同じメッセージを実行すると `8` になります。

```javascript
const mid = await message({
  process: pid,
  signer: createDataItemSigner(jwk),
  tags: [{ name: "Num", value: "4" }],
})
const res = await result({ process: pid, message: mid })
console.log(res.Messages[0].Tags)
```

## AOトークン設計

お疲れさまでした！このように、 Arweave / AO の仕組みをゼロか積み上げて理解していくと分散型スーパーコンピュータを使ってあらゆる実用的で画期的なプロトコルが開発できることが理解できたかと思います。 AO トークンの発行から数ヶ月で 1000 億円近くまで集まった Ethereum レイヤー1 の TVL とそれが AO ネットワークにブリッジされる流動性は AO プロジェクトが aoETH としてフル活用することができます。また、 aoETH をうまく活用するプロジェクトには AO トークンが自動でミントされる仕組みになっています。完全フェアローンチでビットコインと同じ半減スケジュールでミントされる AO トークンは、その 33.3 % が AR トークン保持者に、 66.6 % が aoETH 保持者に5分毎に自動分配されます。 ユーザーが AR や aoETH をロックしたくなるようなプロジェクトを作れば、AO トークンがそのプロジェクトにどんどん貯まっていきそれを資金にプロジェクトを回すことができるのです。ビットコインは発行１年目から何倍の価格になったでしょうか？AO トークンはそれと同じ設計ですが、開発者やプロジェクトがマイニングできるトークン設計になっています。

- 参照 : [AO ホワイトペーパー](https://5z7leszqicjtb6bjtij34ipnwjcwk3owtp7szjirboxmwudpd2tq.arweave.net/7n6ySzBAkzD4KZoTviHtskVlbdab_yylEQuuy1BvHqc)