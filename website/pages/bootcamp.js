import Head from "next/head"
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
      <Image src="/bootcamp.png" />
    </Flex>
  )
}
