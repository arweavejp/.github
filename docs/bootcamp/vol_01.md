# aoBootcamp Vol.01

[NodeJS v22](https://nodejs.org/) と [Docker](https://docker.com/) をインストールしてください。

- [ローカル環境の設定](#ローカル環境の設定)
- [Arweaveの基礎](#arweaveの基礎)
- [AOS](#aos)
- [独自VMの開発](#独自vmの開発)

## ローカル環境の設定

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


AOS の Wasm モジュールをダウンロードし AO のユニット運営に必要な各種ウォレットを生成して、ローカル AR トークンをミントします。 生成したウォレットでモジュールをローカル Arweave にアップロードします。モジュールのトランザクション ID が波線で表示されるのでメモしてください。最後のコマンドでウォレットのアドレスがリストされます。

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

ローカル環境の `ArLocal` に限り AR トークンを無制限にミントできます。また、 Arweave メインネットは分散化されたマイナーに自動でマイニングされますが、ローカルノードの場合主導で `/mine` API を呼び出す必要があります。 `/mine` をして始めて、 [`Scar` エクスプローラ](http://localhost:4006)に反映されます。

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
  let tx = await arweave.createTransaction({
    data: md,
  })
  tx.addTag("Content-Type", "text/markdown")
  return await postTx(tx, jwk)
}
```

```javascript
await saveMD("# This is Markdown", jwk)
```

### 画像データを保存

```javascript
const saveSVG = async (svg, jwk) => {
  let tx = await arweave.createTransaction({
    data: Buffer.from(svg, "base64"),
  })
  tx.addTag("Content-Type", "image/svg+xml")
  return await postTx(tx, jwk)
}
```
[AO のロゴ](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDI5IiBoZWlnaHQ9IjIxNCIgdmlld0JveD0iMCAwIDQyOSAyMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDIxNEg3MS4zNzYzTDg1Ljk0MjkgMTc0LjYxTDUzLjE2ODEgMTA3LjVMMCAyMTRaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTg5LjM2NiAxNjAuNzVMMTA5Ljk3OCAxTDg1Ljk0MjkgNTUuNzA4OUwxNjAuOTYxIDIxNEgyMTVMMTg5LjM2NiAxNjAuNzVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyMiAyMTRDMzgxLjA5NCAyMTQgNDI5IDE2Ni4wOTQgNDI5IDEwN0M0MjkgNDcuOTA1NSAzODEuMDk0IDAgMzIyIDBDMjYyLjkwNiAwIDIxNSA0Ny45MDU1IDIxNSAxMDdDMjE1IDE2Ni4wOTQgMjYyLjkwNiAyMTQgMzIyIDIxNFpNMzIyIDE3MkMzNTcuODk5IDE3MiAzODcgMTQyLjg5OSAzODcgMTA3QzM4NyA3MS4xMDE1IDM1Ny44OTkgNDIgMzIyIDQyQzI4Ni4xMDEgNDIgMjU3IDcxLjEwMTUgMjU3IDEwN0MyNTcgMTQyLjg5OSAyODYuMTAxIDE3MiAzMjIgMTcyWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg==)を SVG 形式でアップロードしてみましょう。

```javascript
const ao = "PHN2ZyB3aWR0aD0iNDI5IiBoZWlnaHQ9IjIxNCIgdmlld0JveD0iMCAwIDQyOSAyMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDIxNEg3MS4zNzYzTDg1Ljk0MjkgMTc0LjYxTDUzLjE2ODEgMTA3LjVMMCAyMTRaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTg5LjM2NiAxNjAuNzVMMTA5Ljk3OCAxTDg1Ljk0MjkgNTUuNzA4OUwxNjAuOTYxIDIxNEgyMTVMMTg5LjM2NiAxNjAuNzVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyMiAyMTRDMzgxLjA5NCAyMTQgNDI5IDE2Ni4wOTQgNDI5IDEwN0M0MjkgNDcuOTA1NSAzODEuMDk0IDAgMzIyIDBDMjYyLjkwNiAwIDIxNSA0Ny45MDU1IDIxNSAxMDdDMjE1IDE2Ni4wOTQgMjYyLjkwNiAyMTQgMzIyIDIxNFpNMzIyIDE3MkMzNTcuODk5IDE3MiAzODcgMTQyLjg5OSAzODcgMTA3QzM4NyA3MS4xMDE1IDM1Ny44OTkgNDIgMzIyIDQyQzI4Ni4xMDEgNDIgMjU3IDcxLjEwMTUgMjU3IDEwN0MyNTcgMTQyLjg5OSAyODYuMTAxIDE3MiAzMjIgMTcyWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg=="
await saveSVG(ao, jwk)
```

### GraphQL でトランザクションを取得

Arweave の最大の強みは、データと共に任意のタグをトランザクションに指定して無数にある分散型ゲートウェイから GraphQL で柔軟に検索可能にできることです。この仕組みを活用するとあらゆる分散型アプリケーションの構築が可能になります。 ハイパー並列コンピュータ AO もこの仕組みをフル活用したプロトコルです。保存されるデータとタグは Arweave でマイニングされる前に、ゲートウェイのキャッシュで即座にアクセス可能になります。究極に速くて便利なプレコンファメーションな仕組みです。

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

アップロードされたデータを取得する方法は二つあります。`arweave.js` の `getData` を使うか無数の分散型ゲートウェイから `http` リクエストで取得するかです。画像をアップロードして `https://arweave.net/[txid]`から即座に参照する等ができます。

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

Arweave にはメタデータとして任意のタグとデータそのものを保存できますが、更に真価を発揮するのが [ANS-104 Bundled Data v2.0](https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md) 規格によってデータの部分にバイナリフォーマットでトランザクションを無限にネストできる仕組みです。１トランザクションに１００万トランザクションをネストして送ることもできます。このネストの仕組みで Arweave は無制限にスケールすることができます。バンドルフォーマットの作成には `arbundles` を使います。

```bash
npm i arbundles
```

```javascript
const { ArweaveSigner, bundleAndSignData, createData } = require("arbundles")

const bundle = async (_items, jwk) => {
  const signer = new ArweaveSigner(jwk)
  const items = _items.map(v => {
    let tags = {}
    for (const k in v[1] && {}) tags.push({ name: k, value: v[1][k] })
    return createData(v[0], signer, { tags })
  })
  const bundle = await bundleAndSignData(items, signer)
  const tx = await bundle.toTransaction({}, arweave, jwk)
  await postTx(tx, jwk)
  return { items, tx }
}
```

例えば、先に上げたマークダウンファイルと SVG 画像ファイルをバンドルして一緒にアップロードしてみます。

```javascript
const { items } = await bundle(
  [
    ["# This is Markdown!", { Content_Type: "text/markdown" }],
    [Buffer.from(ao, "base64"), { Content_Type: "images/svg+xml" }],
  ],
  jwk
)
```

次のセクションで取り扱う、 `AO` は `ANS-104` フォーマットのフル活用です。

## AOS

### ユニットに接続

```bash
npm i @permaweb/aoconnect
```


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

### AOS プロセスを spawn

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
      ao.log("what the hell")
      ao.log("is going on")
      Store[msg.Key] = msg.Value
      Handlers.utils.reply("Value stored!")(msg)
   end
)
```

### ハンドラーを登録

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
console.log(res1)

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

## 独自VMの開発

```bash
npm i express body-parser @permaweb/ao-scheduler-utils
```

## Messenger Unit

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
      headers: {
        "Content-Type": "application/octet-stream",
      },
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

```javascript
const js = `
function handle(count, num) {
  return count + num;
}`

const { result, results, message, spawn, monitor, unmonitor, dryrun } =
  connect({
    MU_URL: "http://localhost:3000",
    CU_URL: "http://localhost:3001",
    GATEWAY_URL: "http://localhost:4000",
  })
const { addr: addr1, jwk } = await gen()
const balance = await mint(addr1)

let tx = await arweave.createTransaction({ data: js })
tx.addTag("Data-Protocol", "ao")
tx.addTag("Variant", "ao.TN.1")
tx.addTag("Type", "Module")
tx.addTag("Module-Format", "js-unknown-unknown")
tx.addTag("Input-Encoding", "JSON-V1")
tx.addTag("Output-Encoding", "JSON-V1")
await postTx(tx, jwk)
await wait(1000)
```

### Scheduler URL を登録

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

```javascript
const pid = await spawn({
  module: tx0.id,
  scheduler: addr1,
  signer: createDataItemSigner(jwk),
})
await wait(1000)
```

### Message を送信

```javascript
const mid = await message({
  process: pid,
  signer: createDataItemSigner(jwk),
  tags: [{ name: "Num", value: "4" }],
})
const res = await result({ process: pid, message: mid })
console.log(res.Messages[0].Tags)
```
