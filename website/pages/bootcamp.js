import Head from "next/head"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

import { Image, Box, Flex } from "@chakra-ui/react"

export default function Home() {
  return (
    <Flex align="center" justify="center" h="100%" p={10}>
      <style global jsx>{`
        body,
        html,
        #__next {
          height: 100%;
        }
      `}</style>
      <Box>
        <Image src="/bootcamp.png" />
        <Flex justify="center">
          <Link href="https://github.com/arweavejp/.github/blob/master/docs/bootcamp/vol_01.md">
            <Flex
              py={2}
              w="200px"
              fontSize="20px"
              justify="center"
              color="#B5002C"
              sx={{
                fontWeight: "bold",
                border: "5px solid #B5002C",
                cursor: "pointer",
                ":hover": { opacity: 0.75 },
                borderRadius: "5px",
              }}
            >
              Vol. 01
            </Flex>
          </Link>
        </Flex>
      </Box>
    </Flex>
  )
}
