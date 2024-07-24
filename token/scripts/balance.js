const { dryrun } = require("@permaweb/aoconnect")

const balance = async () => {
  const res = await dryrun({
    process: "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA",
    tags: [
      { name: "Action", value: "Balance" },
      { name: "Target", value: "Balance" },
    ],
  })
  console.log(res)
}

balance()
