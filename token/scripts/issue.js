const { keccak256 } = require("js-sha3")
const issue = async () => {
  const hash = keccak256(process.argv[2])
  console.log(hash)
  return
}
issue()
