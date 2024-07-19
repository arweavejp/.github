# Lua ハンドラーを開発

AOS では Lua 言語でハンドラーを開発して自分のプロセスにデプロイすることができます。プロセスがメッセージを受け取ったときにそのハンドラーの条件とメッセージの内容がマッチすると実行されます。

Lua を最速で学ぶのは[この1ページチュートリアル](https://cookbook_ao.g8way.io/concepts/lua.html)がオススメです。Lua は最も容易に学べるプログラミング言語のひとつです。

## Kay-Value ストア

簡易的な Key-Value ストアを実装してみます。VSCode や Emacs 等、お気に入りのエディターで `store.lua` ファイルを作成します。 `Store` 変数を定義し、 `Get` と `Set` ハンドラーを書きます。

```lua
local ao = require('ao') -- ao ライブラリ読み込み
Store = Store or {} -- Store が存在してなければ {} に初期設定

Handlers.add(
   "Get", -- ハンドラー名
   Handlers.utils.hasMatchingTag("Action", "Get"), -- マッチング条件 Action == Get
   function (msg)
      assert(type(msg.Key) == 'string', 'Key is required!') -- Key 存在チェック
      ao.send({ Target = msg.From, Value = Store[msg.Key] }) -- 送り手に値を返す
   end
)

Handlers.add(
   "Set", -- ハンドラー名
   Handlers.utils.hasMatchingTag("Action", "Set"), -- マッチング条件 Action == Set
   function (msg)
      assert(type(msg.Key) == 'string', 'Key is required!') -- Key 存在チェック
      assert(type(msg.Value) == 'string', 'Value is required!') -- Value 存在チェック
      Store[msg.Key] = msg.Value -- Value を　Store に収納
      Handlers.utils.reply("Value stored!")(msg) -- 送り手に処理完了の返信
   end
)
```

## ハンドラーをロード

`store.lua` の保存されたディレクトリに移動して `aos` を立ち上げます。

```bash
aos
```

`.load` コマンドを使ってハンドラーをプロセスにデプロイすることができます。

```bash
aos> .load store.lua
```

## 値を保存

`Target` に自分のプロセス ID `ao.id` を指定し、`Key` と `Value`　を指定して `Set` Action を実行するメッセージを送ります。

```bash
aos> Send({ Target = ao.id, Action = "Set", Key = "fruit", Value = "apple" })
```

## 保存した値を取得

同様に `Get` Action のメッセージを送ります。

```bash
aos> Send({ Target = ao.id, Action = "Get", Key = "fruit" })
```

Inbox に `Value` が返信されます。

```bash
aos> Inbox[#Inbox].Value
```

2つ注意点は、 Arweave のタグの仕様で、タグ名はキャメルケースが推奨されていること、また、タグの値は `String` にすることが必須な点です。数字などを扱う場合は Lua 側でストリングと数字を変換する必要があります。

ハンドラーをアップデートしたい場合、同じハンドラー名でもう一度 `.load` をすると上書きアップデートできます。その際 `Store` が上書きされないために、`Store = Store or {}` になっていることに留意してください。