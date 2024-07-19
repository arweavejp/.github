# 分散型アプリケーションのデプロイ

[ファイルのアップロード](upload-files.md)と同じ方法で スタティックウェブサイトや SPA (Single Page App)を簡単に Arweave にデプロイすることができます。一度デプロイされたアプリは運用管理不要で永久に存在し続けます。

ここでは簡単に SPA を作成可能な [Vite + React](https://vitejs.dev/) を使ってアプリを構築しデプロイします。

## Vite アプリを作成

まず Vite をグローバル環境にインストールします。

```bash
sudo npm install　-g vite
```

次に React アプリを作成します。

```bash
npm create vite@latest myapp -- -t react-swc
cd myapp && yarn
```

ここが一番重要なステップですが、`base: "./"`を`vite.config.js`ファイルに追加します。この設定で Arweave にデプロイした時にファイルパスが正しくリンクするようになります.

```js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
})
```

アプリを変更したい場合、ここで色々いじって `yarn dev` でローカル環境で確認して下さい。

## ハッシュルーティング

Arweave にデプロイする SPA でページ遷移を行う場合ハッシュルーティングという方法を使います。

https://your.app/page ではなく https://your.app/#/page という ハッシュ（#）を含んだ URL を使うということです。Arweave は単一URL（https://your.app/） に静的ウェブサイトがデプロイされる仕組みでバックエンドサーバーでルーティングをすることができないので、例えば SPA の中で https://your.app/page に遷移したとしても、ページをリロードするとそのURLにはファイルが存在せず元のページにアクセスできないからです。URL の仕組みでハッシュ後の値の違いは同一ページと識別されるので、 https://your.app/#/page は https://your.app/ と同じ URL のファイルが取得されリロードしてもページが復元できます。

[react-router-dom](https://reactrouter.com/) を使うと簡単にハッシュルーティングを導入できます。

```bash
yarn add react-router-dom
```

### `/src/main.jsx` にルーターを定義

```javascript
import React from "react"
import { RouterProvider, createHashRouter } from "react-router-dom"
import ReactDOM from "react-dom/client"
import Article from "./pages/Article"
import Admin from "./pages/Admin"

const router = createHashRouter([
  { path: "/", element: <App />  },
  { path: "/article/:id", element: <Article /> },
  { path: "/admin", element: <Admin /> }
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

### `/src/App.jsx`　で各ページにリンク

```javascript
import { Link } from "react-router-dom"

function App() {
  return (
    <div>
      <Link to={`./admin`}><div>admin</div></Link>
      <Link to={`./artocle/1`}><div>article 1</div></Link>
      <Link to={`./artocle/2`}><div>article 2</div></Link>
      <Link to={`./artocle/3`}><div>article 3</div></Link>
    </div>
  )
}

export default App
```

### `/src/pages/Article.jsx` でダイナミックなパラメータを取得

`/article/:id` で以下のようにダイナミックに変化する `:id` の部分を設定できます。

- `https://your.app/#/article/1`
- `https://your.app/#/article/my-article-about-ao`

`:id` の部分は `useParams()`　で取得可能です。

```javascript
import { useParams } from "react-router-dom"

function Article(a) {
  const { id } = useParams()
  return <div>article {id}</div>
}

export default Article
```

## Arweave にデプロイ

アプリが全てよければビルドします。

```bash
yarn build
```

[ファイルのアップロード](upload-files.md)のステップで `arkb` をインストール済みで $AR を保有したアカウントの `keyfile.json` があることを確認して下さい。

アプリを Arweave にデプロイします。

```bash
arkb deploy dist -w path_to_keyfile --auto-confirm
```

数秒後にアプリの URL が表示されます。

[https://arweave.net/_oliAd7vpL2gIXCpTnXHedhPhqpYJZrr0iMeItf6PDA](https://arweave.net/_oliAd7vpL2gIXCpTnXHedhPhqpYJZrr0iMeItf6PDA)