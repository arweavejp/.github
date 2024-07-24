import { Image, Flex, Box } from "@chakra-ui/react"
function Footer() {
  return (
    <Flex
      p={4}
      justify="center"
      bg="#B5002C"
      color="white"
      align="center"
      fontSize="12px"
    >
      <Box
        as="a"
        target="_blank"
        href={`https://www.ao.link/#/token/${import.meta.env.VITE_TOKEN_ID}`}
        sx={{ color: "white" }}
      >
        {import.meta.env.VITE_TOKEN_ID}
      </Box>
    </Flex>
  )
}

export default Footer
