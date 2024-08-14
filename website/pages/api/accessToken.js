const { TwitterApi } = require("twitter-api-v2")
const { compose, map, splitEvery } = require("ramda")
const { decrypt } = require("../../lib/utils")
const Arweave = require("arweave")

export default async function handler(req, res) {
  const { code, state, data } = req.body
  let _data = await decrypt(data)
  if (_data.state !== state) {
    res.status(200).json({ error: "the wrong state" })
  } else {
    const client = new TwitterApi({
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
    })
    const { client: loggedClient, accessToken } = await client.loginWithOAuth2({
      code,
      codeVerifier: _data.codeVerifier,
      redirectUri: process.env.X_REDIRECT_URL,
    })
    _data.accessToken = accessToken
    const user = await loggedClient.v2.me({
      "tweet.fields": [
        "public_metrics",
        "organic_metrics",
        "text",
        "referenced_tweets",
        "entities",
      ],
      "user.fields": [
        "public_metrics",
        "pinned_tweet_id",
        "most_recent_tweet_id",
        "profile_image_url",
        "description",
        "entities",
      ],
      expansions: ["pinned_tweet_id"],
    })
    const publicJWK = {
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: process.env.ARWEAVE_JWK_N,
    }
    const cryptoKey2 = await crypto.subtle.importKey(
      "jwk",
      publicJWK,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    )
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.X_REDIRECT_URL,
      { scope: ["users.read", "tweet.read"] },
    )
    const json = JSON.stringify(_data)
    const _data2 = compose(
      map(v => new TextEncoder().encode(v)),
      splitEvery(400),
    )(json)
    let data2 = []
    for (const v of _data2) {
      const enc = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey2,
        v,
      )
      data2.push(Buffer.from(enc).toString("base64"))
    }
    const arweave = Arweave.init()
    const addr = await arweave.wallets.jwkToAddress({
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: _data.publicKey,
    })
    res.status(200).json({ data: data2, addr, user })
  }
}
