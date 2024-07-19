# フロントエンドから AO に接続

[aoconnect](https://cookbook_ao.g8way.io/guides/aoconnect/aoconnect.html) を使うとフロントエンドのウェブアプリから AO にアクセスすることができます。

[Vite + React で作成したアプリ](./deploy-app.md)から [Lua ハンドラー開発](./handlers.md)で作った Key-Value ストアに接続してみましょう。

## `aoconnect` をインストール

アプリのルートディレクトリに移動します。

```bash
yarn add @permaweb/aoconnect
```
## `.env` にプロセス ID を定義

Key-Value ストアをデプロイしたプロセス ID を `.env` ファイルに定義します。

```bash
VITE_PROCESS_ID=XXXXXXXXXXXXXXXXXXXX
```

## Message で Store をアップデート

プロセスにメッセージを送るには aoconnect の `message` 関数を使います。

AOS でプロセスをデプロイしたオーナーと同一のアカウントを `ArConnect` ウォレットにインポートして利用可能にする必要があります。

```javascript
import { message, result } from "@permaweb/aoconnect"

unction App() {
  return (
    <div onClick={async ()=>{

    // ArConnect ウォレットに許可を与える
      await window.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "SIGN_TRANSACTION",
      ])
      const tags = [
        { name: "Action", value: "Set" },
        { name: "Key", value: "test_val" },
        { name: "Value", value: "xyz" },
      ]
      const messageId = await message({
        process: import.meta.env.VITE_PROCESS_ID,
        signer: createDataItemSigner(window.arweaveWallet),
        tags,
      })
      
      // messageId を指定して実効結果を取得します
      const res = await result({
        message: messageId,
        process: import.meta.env.VITE_PROCESS_ID,
      })
      if(res.Messages[0]){
        console.log("value stored successfully!")
      }else{
        alert("something went wrong!")
      }
    }}>Set</div>
  )
}

export default App
```

## Dryrun で Store を読み取り

プロセスのアップデートが不要な Action は `dryrun` で読み取りだけすることができます。`dryrun` はメッセージを Areave に保存しません。

```javascript
import { dryrun } from "@permaweb/aoconnect"

function App() {
  return (
    <div onClick={async ()=>{
      const result = await dryrun({
        process: import.meta.env.VITE_PROCESS_ID,
        tags: [
          { name: "Action", value: "Get" },
          { name: "Key", value: "test_val" }
        ],
      })
      const value = result.Messages[0].Tags[6].value
      console.log(value); // xyz
    }}>Get</div>
  )
}

export default App
```

## 応用編

初級編で学んだ、分散型アプリのデプロイと中級編の AOS を組み合わせることでアップデートが可能な分散型の永久アプリを開発することができます。

例えば [PermaCMS](https://github.com/ocrybit/perma-cms) は Arweave に静的な SPA (Single Page App) を一度だけデプロイして、記事は AO で管理することで、永久に運用不要なブログシステムを実現しています。また Arweave のドメイン名を割り当て、あらゆるゲートウェイから永久アクセス可能にしています。

- [tomo.arweave.net](https://tomo.arweave.net)