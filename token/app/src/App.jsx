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
import { Flex, Box } from "@chakra-ui/react"
import { map } from "ramda"
import Footer from "./Footer.jsx"
import Header from "./Header.jsx"

function App() {
  const [key, setKey] = useState(null)
  const [mid, setMid] = useState(null)
  const [code, setCode] = useState("")
  const [addr, setAddr] = useState(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  return (
    <Flex direction="column" w="100%" h="100%" justify="center">
      <Header {...{ addr, balance, setBalance }} />

      <Flex align="center" justify="center" flex={1}>
        <Box>
          {mid === null ? (
            <>
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
                      let _key = cryptoRandomString({ length: 20 })
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
                        const campaign = JSON.parse(
                          res.Messages[0].Tags[7].value,
                        )
                        if (campaign) {
                          if (campaign.state === 3) {
                            alert("既にトークンを取得済みです")
                            cancel = true
                          } else if (campaign.state === 2) {
                            alert("既に取得コード B を発行済です。")
                            cancel = true
                          } else if (campaign.state === 1) {
                            if (
                              !confirm(
                                "再申請すると以前の取得コードが無効になりますがよろしいですか？",
                              )
                            ) {
                              cancel = true
                            }
                          }
                        }
                      } catch (e) {
                        console.log(e)
                        cancel = true
                      }
                      if (cancel) {
                        setLoading(false)
                        return
                      }
                      const data = new TextEncoder().encode(_key)
                      const sig = await window.arweaveWallet.signMessage(data)
                      const b64 = btoa(String.fromCharCode(...sig))
                      console.log(b64)
                      const mid = await message({
                        process: import.meta.env.VITE_TOKEN_ID,
                        tags: [
                          { name: "Action", value: "Request" },
                          { name: "Signature", value: b64 },
                          { name: "Campaign", value: "join" },
                        ],

                        signer: createDataItemSigner(window.arweaveWallet),
                      })
                      let { Messages, Spawns, Output, Error } = await result({
                        message: mid,
                        process: import.meta.env.VITE_TOKEN_ID,
                      })
                      if (Messages[0]) {
                        setKey(_key)
                        setMid(mid)
                      } else {
                        console.log(Error)
                        alert("申請に失敗しました")
                      }
                    } catch (e) {}
                    setLoading(false)
                  }}
                >
                  {loading ? "申請中..." : "ArConnect ウォレットを接続"}
                </Flex>
              </Flex>
            </>
          ) : (
            <>
              <Box mb={8}>
                <Flex my={2}>
                  <Box w="150px" as="span">
                    取得コード
                  </Box>
                  <Box as="span" color="#B5002C">
                    {key}
                  </Box>
                </Flex>
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
                <Box mt={4} as="a" href={import.meta.env.VITE_GOOGLE_FORM}>
                  こちらのフォームから上記の情報を入力して申請して下さい。
                </Box>
              </Flex>
              <Flex justify="center">
                <Box
                  as="a"
                  display="flex"
                  justifyContent="center"
                  href="https://forms.gle/z1NwVevfjc7D6cYCA"
                  target="_blank"
                  bg="#eee"
                  py={4}
                  mt={4}
                  width="300px"
                  sx={{
                    borderRadius: "5px",
                    cursor: "pointer",
                    ":hover": { opacity: 0.75 },
                  }}
                >
                  トークン申請
                </Box>
              </Flex>
            </>
          )}
        </Box>
      </Flex>
      <Footer />
    </Flex>
  )
}

export default App
