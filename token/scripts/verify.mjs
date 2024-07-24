import cryptoRandomString from "crypto-random-string"
import Arweave from "arweave"

const query = `
  query($id: ID!) {
    transaction(id: $id) {
      id
      owner {
        address
        key
      }
      tags {
        name
        value
      }
    }
  }
`

const verify = async (data, sig, pub) => {
  const binarySignature = new Uint8Array(sig)
  const dataToVerify = new Uint8Array(data)
  const hash = await crypto.subtle.digest("SHA-256", dataToVerify)
  const publicJWK = {
    e: "AQAB",
    ext: true,
    kty: "RSA",
    n: pub,
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
  const result = await crypto.subtle.verify(
    { name: "RSA-PSS", saltLength: 32 },
    cryptoKey,
    binarySignature,
    hash,
  )
  return result
}

const check = async () => {
  const response = await fetch("https://arweave.net/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { id: process.argv[3] },
    }),
  })

  const responseBody = await response.json()
  const msg = responseBody.data.transaction
  const pub = msg.owner.key
  const sig = msg.tags[1].value
  const key = process.argv[2]
  const buffer = Buffer.from(sig, "base64")
  const arr = new Uint8Array(buffer)
  const data = new TextEncoder().encode(key)
  const valid = await verify(data, arr, pub)
  if (valid) {
    console.log(`Address: ${msg.owner.address}`)
    console.log(`Code: ${cryptoRandomString({ length: 20 })}`)
  } else {
    console.log("invalid")
  }
  return
}

check()
