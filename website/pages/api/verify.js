const { TwitterApi } = require("twitter-api-v2")
const { fromPairs, compose, map, splitEvery } = require("ramda")
const Arweave = require("arweave")
const { tags, action, tag, verify, decrypt } = require("../../lib/utils")
const { message, dryrun, createDataItemSigner } = require("@permaweb/aoconnect")
export default async function handler(req, res) {
  try {
    const { signature, data } = req.body
    const _data = await decrypt(data)
    const valid = await verify(signature, data.join(""), _data.publicKey)
    if (!valid) {
      res.status(200).json({ error: "invalid signature" })
      return
    }
    const client = new TwitterApi(_data.accessToken)
    const user = await client.v2.me({
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
    const arweave = Arweave.init()
    const addr = await arweave.wallets.jwkToAddress({
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: _data.publicKey,
    })
    const _res = await dryrun({
      process: "ZTTO02BL2P-lseTLUgiIPD9d0CF1sc4LbMA2AQ7e9jo",
      tags: [action("Get-Vouches"), tag("ID", addr)],
    })
    const vouches = JSON.parse(_res.Messages[0].Data)
    let vouched = false
    if (vouches["Vouches-For"] === addr) {
      for (const k in vouches.Vouchers) {
        if (
          vouches.Vouchers[k].Identifier.toLowerCase() ===
          user.data.username.toLowerCase()
        ) {
          vouched = true
          break
        }
      }
    }
    if (!vouched) {
      res.status(200).json({ error: "not vouched" })
      return
    }

    const _res2 = await dryrun({
      process: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
      tags: [action("Get-Profiles-By-Delegate")],
      data: JSON.stringify({ Address: addr }),
    })
    const profile = JSON.parse(_res2?.Messages?.[0]?.Data ?? [])?.[0] ?? null
    if (!profile) {
      res.status(200).json({ error: "AO profile not found" })
      return
    }
    const prid = profile.ProfileId
    const _res3 = await dryrun({
      process: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
      tags: [action("Get-Metadata-By-ProfileIds")],
      data: JSON.stringify({ ProfileIds: [prid] }),
    })
    if (!_res3?.Messages?.[0]?.Data) {
      res.status(200).json({ error: "AO profile not found" })
      return
    }
    const profiles = JSON.parse(_res3.Messages[0].Data)
    const pr = fromPairs(profiles.map(obj => [obj.ProfileId, obj]))[prid]
    if (!pr) {
      res.status(200).json({ error: "AO profile not found" })
      return
    }
    const username = user.data.username
    const id = user.data.id
    console.log(addr, id, username)
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
      process: "7iHLISwhaAQhx9lvuKXWix-Q5NM5CnijzEdNsXpn51w",
      tags: [
        action("Verify"),
        tag("ID", addr),
        tag("X-ID", id),
        tag("X-Username", username),
      ],
      signer: createDataItemSigner(privateJWK),
    })
    res.status(200).json({ addr, user: user.data, vouches, profile: pr, mid })
  } catch (e) {
    console.log(e)
    res.status(200).json({ error: "something went wrong" })
  }
}
