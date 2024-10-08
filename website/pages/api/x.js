const { TwitterApi } = require("twitter-api-v2")
const crypto = require("crypto")
const client = new TwitterApi({
  clientId: process.env.X_CLIENT_ID,
  clientSecret: process.env.X_CLIENT_SECRET,
})
const { dryrun } = require("@permaweb/aoconnect")
const { action, tag, getCode } = require("../../lib/utils")
const { map, compose, splitEvery } = require("ramda")
const Arweave = require("arweave")
const { validAddress } = require("../../lib/utils")
const pid = "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA"

export default async function handler(req, res) {
  const { publicKey, code } = req.body
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
    let referral = null
    if (code) {
      const [_code, _ref] = code.split(":")
      const _res = await dryrun({
        process: pid,
        tags: [action("Get-Referral-By-Id"), tag("ID", _ref)],
      })
      let addr2 = null
      try {
        addr2 = JSON.parse(_res?.Messages?.[0]?.Data).address
      } catch (e) {
        console.log(e)
      }
      let isValid = false
      if (addr2) {
        const data = addr2 + ":" + _ref
        const _code2 = getCode(data)
        if (_code2 === _code && addr2 !== addr) referral = addr2
      }
    }
    const json = JSON.stringify({ publicKey, codeVerifier, state, referral })
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
