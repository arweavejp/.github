const { map, fromPairs } = require("ramda")
const md5 = require("md5")
const crypto = require("crypto")

const decrypt = async data => {
  let privateJWK = {
    e: "AQAB",
    ext: true,
    kty: "RSA",
    alg: "RSA-OAEP-256",
    n: process.env.ARWEAVE_JWK_N,
    d: process.env.ARWEAVE_JWK_D,
    p: process.env.ARWEAVE_JWK_P,
    q: process.env.ARWEAVE_JWK_Q,
    dp: process.env.ARWEAVE_JWK_DP,
    dq: process.env.ARWEAVE_JWK_DQ,
    qi: process.env.ARWEAVE_JWK_QI,
  }
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { ...privateJWK, alg: "RSA-OAEP-256" },
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    true,
    ["decrypt"],
  )
  let json = []
  for (const v of data) {
    const dec = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      Buffer.from(v, "base64"),
    )
    json.push(new TextDecoder().decode(dec))
  }
  return JSON.parse(json.join(""))
}

const verify = async (signature, data, publicKey) => {
  const publicJWK = {
    e: "AQAB",
    ext: true,
    kty: "RSA",
    n: publicKey,
  }
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    publicJWK,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  )
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  )
  return await crypto.subtle.verify(
    { name: "RSA-PSS", saltLength: 32 },
    cryptoKey,
    Buffer.from(signature, "base64"),
    hash,
  )
}
const action = value => tag("Action", value)
const tag = (name, value) => ({ name, value })
const tags = tags => fromPairs(map(v => [v.name, v.value])(tags))
const getCode = data => {
  let key = {
    e: "AQAB",
    ext: true,
    kty: "RSA",
    n: process.env.ARWEAVE_JWK_N,
    d: process.env.ARWEAVE_JWK_D,
    p: process.env.ARWEAVE_JWK_P,
    q: process.env.ARWEAVE_JWK_Q,
    dp: process.env.ARWEAVE_JWK_DP,
    dq: process.env.ARWEAVE_JWK_DQ,
    qi: process.env.ARWEAVE_JWK_QI,
  }

  const priv = crypto.createPrivateKey({ key, format: "jwk" })
  const _sign = crypto.createSign("sha256")
  _sign.update(data)
  _sign.end()
  const sign = _sign.sign(priv, "base64")
  const toURLSafe = str =>
    str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return toURLSafe(Buffer.from(md5(sign), "hex").toString("base64"))
}
const validAddress = addr => /^[a-zA-Z0-9_-]{43}$/.test(addr)
module.exports = { verify, decrypt, action, tag, tags, getCode, validAddress }
