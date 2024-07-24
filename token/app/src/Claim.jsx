import { useState, useEffect } from "react"
import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"
import cryptoRandomString from "crypto-random-string"
import {
  dryrun,
  result,
  message,
  createDataItemSigner,
} from "@permaweb/aoconnect"
import { Image, Flex, Box } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import Footer from "./Footer.jsx"
import Header from "./Header.jsx"

function Claim() {
  const { id } = useParams()
  const [mid, setMid] = useState(null)
  const [addr, setAddr] = useState(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  return (
    <Flex direction="column" w="100%" h="100%" justify="center">
      <Header {...{ addr, balance, setBalance }} />
      <Flex align="center" justify="center" flex={1}>
        <Box>
          {id?.length !== 20 ? (
            <Box>無効な取得コードです</Box>
          ) : mid === null ? (
            <Flex justify="center" mt={8}>
              <Flex
                justify="center"
                bg="#eee"
                py={4}
                width="300px"
                sx={{
                  borderRadius: "5px",
                  cursor: "pointer",
                  ":hover": { opacity: 0.75 },
                }}
                onClick={async () => {
                  if (loading) return
                  setLoading(true)
                  try {
                    await window.arweaveWallet.connect([
                      "ACCESS_ADDRESS",
                      "SIGN_TRANSACTION",
                      "SIGNATURE",
                    ])
                    const addr = await window.arweaveWallet.getActiveAddress()
                    setAddr(addr)
                    let cancel = false
                    try {
                      const res = await dryrun({
                        process: import.meta.env.VITE_TOKEN_ID,
                        tags: [
                          { name: "Action", value: "Get-Request" },
                          { name: "Campaign", value: "join" },
                          { name: "Target", value: addr },
                        ],
                      })
                      const campaign = JSON.parse(res.Messages[0].Tags[7].value)
                      if (campaign) {
                        if (campaign.state === 3) {
                          alert("既にトークンを取得済みです")
                          cancel = true
                        } else if (campaign.state === 1) {
                          alert("申請を処理中なので時間を空けてお試し下さい")
                          cancel = true
                        }
                      } else {
                        alert("先に申請手続きを行って下さい")
                        cancel = true
                      }
                    } catch (e) {
                      console.log(e)
                      cancel = true
                    }
                    if (cancel) {
                      setLoading(false)
                      return
                    }
                    const mid = await message({
                      process: import.meta.env.VITE_TOKEN_ID,
                      tags: [
                        { name: "Action", value: "Claim" },
                        { name: "Key", value: id },
                        { name: "Campaign", value: "join" },
                      ],

                      signer: createDataItemSigner(window.arweaveWallet),
                    })
                    let { Messages, Spawns, Output, Error } = await result({
                      message: mid,
                      process: import.meta.env.VITE_TOKEN_ID,
                    })
                    if (Messages[0]) {
                      setMid(mid)
                      try {
                        const res = await dryrun({
                          process: import.meta.env.VITE_TOKEN_ID,
                          tags: [
                            { name: "Action", value: "Balance" },
                            { name: "Target", value: addr },
                          ],
                        })
                        setBalance(
                          Math.round(res.Messages[0].Tags[6].value / 1000000),
                        )
                      } catch (e) {}
                    } else {
                      console.log(Error)
                      alert("取得に失敗しました")
                    }
                  } catch (e) {
                    console.log(e)
                  }
                  setLoading(false)
                }}
              >
                {loading ? "トークン取得中..." : "トークン取得"}
              </Flex>
            </Flex>
          ) : (
            <>
              <Box mb={8}>
                <Flex my={2}>
                  <Box w="150px" as="span">
                    AO メッセージ ID
                  </Box>
                  <Box
                    as="a"
                    target="_blank"
                    color="#B5002C"
                    sx={{ textDecoration: "underline" }}
                    href={`https://ao.link/#/message/${mid}`}
                  >
                    {mid}
                  </Box>
                </Flex>
              </Box>
              <Flex justify="center">
                おめでとうございます！ 100 tAJ トークンを取得しました！
              </Flex>
            </>
          )}
        </Box>
      </Flex>
      <Footer />
    </Flex>
  )
}

export default Claim
