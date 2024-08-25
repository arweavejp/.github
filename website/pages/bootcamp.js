import Head from "next/head"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

import { Image, Box, Flex } from "@chakra-ui/react"
const title = "aoBootcamp | Arweave Japan"
const description = "Arweave / AO をゼロから最速で学習するブートキャンプです。"
const image = "https://arweave.jp/bootcamp-cover.png"

export default function Home() {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta property="og:title" content={title} />
        <meta name="og:description" content={description} />
        <meta name="og:image" content={image} />
      </Head>
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
    </>
  )
}
