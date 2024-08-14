const { TwitterApi } = require("twitter-api-v2")
const crypto = require("crypto")
const client = new TwitterApi({
  clientId: process.env.X_CLIENT_ID,
  clientSecret: process.env.X_CLIENT_SECRET,
})
const { map, compose, splitEvery } = require("ramda")
const Arweave = require("arweave")
const validAddress = addr => /^[a-zA-Z0-9_-]{43}$/.test(addr)
export default async function handler(req, res) {
  const { publicKey } = req.body
  const arweave = Arweave.init()
  const addr = await arweave.wallets.jwkToAddress({
    e: "AQAB",
    ext: true,
    kty: "RSA",
    n: publicKey,
  })
  if (!validAddress(addr)) {
    res.status(200).json({ error: "invalid publicKey" })
  } else {
    const publicJWK = {
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: process.env.ARWEAVE_JWK_N,
    }
    const cryptoKey = await crypto.subtle.importKey(
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
    const json = JSON.stringify({ publicKey, codeVerifier, state })
    const _data = compose(
      map(v => new TextEncoder().encode(v)),
      splitEvery(400),
    )(json)
    let data = []
    for (const v of _data) {
      const enc = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        v,
      )
      data.push(Buffer.from(enc).toString("base64"))
    }
    res.status(200).json({ url, data })
  }
}
