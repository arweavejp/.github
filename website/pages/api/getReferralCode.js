const { action, tag, getCode, verify } = require("../../lib/utils")
const Arweave = require("arweave")
const crypto = require("crypto")
const {
  result,
  message,
  dryrun,
  createDataItemSigner,
} = require("@permaweb/aoconnect")
const pid = "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA"

const getRef = async addr => {
  const _res = await dryrun({
    process: "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA",
    tags: [action("Get-Referral"), tag("Address", addr)],
  })
  let ref = _res?.Messages?.[0]?.Data
  let id = null
  try {
    id = JSON.parse(ref).id
  } catch (e) {}
  return id
}
export default async function handler(req, res) {
  const { signature, publicKey } = req.body
  const arweave = Arweave.init()
  const addr = await arweave.wallets.jwkToAddress({
    e: "AQAB",
    ext: true,
    kty: "RSA",
    n: publicKey,
  })
  const valid = await verify(signature, addr, publicKey)
  if (valid) {
    let ref = await getRef(addr)
    if (!ref) {
      let privateJWK = {
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
      const mid = await message({
        process: pid,
        tags: [action("Generate-Referral"), tag("Address", addr)],
        signer: createDataItemSigner(privateJWK),
      })
      let { Messages, Spawns, Output, Error } = await result({
        message: mid,
        process: pid,
      })
      if (Messages?.[0]?.Data === "referral generated") {
        ref = await getRef(addr)
      }
    }
    if (ref) {
      const data = addr + ":" + ref
      res.status(200).json({ code: getCode(data) + ":" + ref })
    } else {
      res.status(200).json({ error: "invalid signature" })
    }
  } else {
    res.status(200).json({ error: "invalid signature" })
  }
}
