import { Image, Flex, Box } from "@chakra-ui/react"
import { useEffect } from "react"
import { dryrun } from "@permaweb/aoconnect"

function Header({ addr, balance, setBalance }) {
  useEffect(() => {
    ;(async () => {
      try {
        const res = await dryrun({
          process: import.meta.env.VITE_TOKEN_ID,
          tags: [
            { name: "Action", value: "Balance" },
            { name: "Target", value: addr },
          ],
        })
        setBalance(Math.round(res.Messages[0].Tags[6].value / 1000000))
      } catch (e) {}
    })()
  }, [addr])

  return (
    <Flex
      fontSize="18px"
      height="60px"
      align="center"
      w="100%"
      justify="center"
      bg="white"
      sx={{ borderBottom: "1px solid #ddd" }}
    >
      <Flex w="100%" maxW="960px" justfy="flex-start" align="center">
        <Image src="/aj.jpg" boxSize="30px" mr={2} />
        <Box>Arweave Japan メンバートークン 取得</Box>
        <Box flex={1} />
        {addr === null ? null : (
          <Flex
            fontSize="14px"
            justify="center"
            w="150px"
            py={1}
            sx={{ border: "1px #999 solid", borderRadius: "5px" }}
          >
            {addr.slice(0, 5)} : {balance} tAJ
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default Header
