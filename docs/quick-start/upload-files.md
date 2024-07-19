# ファイルのアップロード

Arweave にファイルをアップロードする一番簡単な方法は [arkb](https://github.com/textury/arkb) を使うことです。

まず`arkb`をグローバル環境にインストールします。

```bash
sudo npm -g install arkb
```

ファイルをアップロードするには[ウォレット導入](wallet.md)で生成した`keyfile.json`とそのアカウントが $AR トークンを保有している必要があります。

適当なテキストファイルを作成して Arweave にアップロードしてみましょう。

```bash
echo Hello, world! > hello.txt
arkb deploy hello.txt -w keyfile.json
```

数秒後に [https://arweave.net/cY0Pnp92nIUa31GqjPlFKTsO0DMSc-PNveFzzcjhNn8](https://arweave.net/cY0Pnp92nIUa31GqjPlFKTsO0DMSc-PNveFzzcjhNn8) のような URL が表示されアップロードしたファイルが参照可能になります。

Arweave にファイルをアップロードするのはこれほど簡単です！

フォルダも同様にアップロードできますが、次のステップでアプリケーションを丸ごとデプロイしてみましょう。