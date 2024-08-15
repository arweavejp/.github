import Head from "next/head"
import Arweave from "arweave"
import { useRouter } from "next/router"
import Link from "next/link"
import { map, fromPairs } from "ramda"
import { useState, useEffect, useRef } from "react"

import {
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  CircularProgress,
  Stack,
  StackDivider,
  Text,
  Card,
  Heading,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Image,
  Box,
  Flex,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react"
import { dryrun } from "@permaweb/aoconnect"
import { validAddress, action, tag, tags } from "../lib/utils"
import lf from "localforage"
function to64(buffer) {
  var binary = ""
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

const steps = [
  { title: "ステップ１", description: "ウォレット接続" },
  { title: "ステップ２", description: "VouchDAO 認証" },
  { title: "ステップ３", description: "AO Profile 作成" },
  { title: "ステップ４", description: "AJ トークン取得" },
]

export default function Home() {
  const router = useRouter()
  const toast = useToast()
  const toastIdRef = useRef()
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })
  const [code, setCode] = useState(null)
  const [init, setInit] = useState(false)
  const [isArconnect, setIsArconnect] = useState(false)
  const [vouched, setVouched] = useState(null)
  const [stats, setStats] = useState(null)
  const [balance, setBalance] = useState(0)
  const [addr, setAddr] = useState(null)
  const [enc, setEnc] = useState(null)
  const [profile, setProfile] = useState(null)
  const [members, setMembers] = useState({})
  const [memberProfiles, setMemberProfiles] = useState([])
  const [ref, setRef] = useState(null)
  const [refAddr, setRefAddr] = useState(null)
  const [refProfile, setRefProfile] = useState(null)
  useEffect(() => {
    if (window.arweaveWallet) setIsArconnect(true)
  }, [])
  useEffect(() => {
    const _profile = members[refAddr]?.profile
    if (_profile) {
      for (const v of memberProfiles) {
        if (v.ProfileId === _profile) {
          setRefProfile(v)
          break
        }
      }
    }
  }, [memberProfiles, refAddr])
  useEffect(() => {
    ;(async () => {
      try {
        const url = new URL(location.href)
        const _ref = url.searchParams.get("ref")
        if (_ref) setRef(_ref)
        const _addr = await lf.getItem("address")
        let _vouched
        let _profile
        let _activeStep = 0
        if (!_addr) {
          setInit(true)
        } else {
          setAddr(_addr)
          _activeStep = 1
          _vouched = await lf.getItem("vouched")
          if (_vouched) {
            setVouched(_vouched)
            _activeStep = 2
            _profile = await lf.getItem("profile")
            if (_profile) {
              setProfile(_profile)
              _activeStep = 3
              const _members = await lf.getItem("members")
              const _member = _members?.[_addr]
              if (_member) {
                _activeStep = 4
                setMembers(_members)
                setInit(true)
                const _memberProfiles = await lf.getItem("memberProfiles")
                if (_memberProfiles) setMemberProfiles(_memberProfiles)
                const _code = await lf.getItem("code")
                if (_code) setCode(_code)
              }
            }
          }
        }
        setActiveStep(_activeStep)
        const _data = await lf.getItem("encryptedData")
        if (_data) {
          setRefAddr(_data.referral)
          setAddr(_data.addr)
          setEnc(_data.data)
          const _stats = await lf.getItem("stats")
          if (_stats) {
            setStats(_stats)
            if (_stats.profile) setProfile(_stats.profile)
          }
        } else {
          const code = url.searchParams.get("code")
          const state = url.searchParams.get("state")
          const data = await lf.getItem(`verifier`)
          if (state && data && _activeStep === 3) {
            const {
              error,
              data: data2,
              addr,
              user,
              referral,
            } = await fetch(`/api/accessToken`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: data.data, code, state }),
            }).then(r => r.json())
            if (error && error === "not enough followers") {
              alert("100 フォロワー以上の X アカウントが必要です。")
            } else if (addr) {
              if (referral) setRefAddr(referral)
              router.push("/", undefined, { shallow: true })
              if (addr !== _addr) {
                alert("ウォレットアドレスが違います。")
                return
              }
              const username = user?.data?.username
              if (
                !username ||
                username.toLowerCase() !== _vouched.Identifier.toLowerCase()
              ) {
                alert("X アカウントが違います。")
                return
              }
              await lf.setItem("encryptedData", { addr, data: data2, referral })
              setEnc(data2)
            }
          }
        }
      } catch (e) {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (addr) {
        const res = await dryrun({
          process: "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA",
          tags: [action("Balance"), tag("Target", addr)],
        })
        if (res?.Messages?.[0]) {
          const balance = tags(res.Messages[0].Tags).Balance ?? "0"
          setBalance(Number(balance) / 1000000)
        }
      }
    })()
  }, [addr])

  useEffect(() => {
    ;(async () => {
      let ids = []
      for (const k in members) ids.push(members[k].profile)
      if (ids.length > 0) {
        try {
          const res = await dryrun({
            process: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
            tags: [action("Get-Metadata-By-ProfileIds")],
            data: JSON.stringify({ ProfileIds: ids }),
          })
          setMemberProfiles(JSON.parse(res?.Messages?.[0].Data))
          await lf.setItem(
            "memberProfiles",
            JSON.parse(res?.Messages?.[0].Data),
          )
        } catch (e) {}
      }
    })()
  }, [members])

  const checkVouchDAO = async _init => {
    const _res = await dryrun({
      process: "ZTTO02BL2P-lseTLUgiIPD9d0CF1sc4LbMA2AQ7e9jo",
      tags: [action("Get-Vouches"), tag("ID", addr)],
    })
    const vouches = JSON.parse(_res.Messages[0].Data)
    if (vouches["Vouches-For"] === addr) {
      for (const k in vouches.Vouchers) {
        if (k === "Ax_uXyLQBPZSQ15movzv9-O1mDo30khslqN64qD27Z8") {
          const v = vouches.Vouchers[k]
          _init = false
          setVouched(v)
          await lf.setItem("vouched", v)
          break
        }
      }
    }
    if (!_init) setActiveStep(2)
    return _init
  }
  const checkAOProfile = async _init => {
    const _res2 = await dryrun({
      process: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
      tags: [action("Get-Profiles-By-Delegate")],
      data: JSON.stringify({ Address: addr }),
    })
    const data = _res2?.Messages?.[0]?.Data
    if (!data) {
      setInit(_init)
      return _init
    }
    const profile = JSON.parse(data)[0]
    if (!profile) {
      setInit(_init)
      return _init
    }
    const prid = profile.ProfileId
    const _res3 = await dryrun({
      process: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
      tags: [action("Get-Metadata-By-ProfileIds")],
      data: JSON.stringify({ ProfileIds: [prid] }),
    })
    if (!_res3?.Messages?.[0]?.Data) {
      setInit(_init)
      return _init
    }
    const profiles = JSON.parse(_res3.Messages[0].Data)
    const pr = fromPairs(profiles.map(obj => [obj.ProfileId, obj]))[prid]
    if (pr) {
      _init = false
      setProfile(pr)
      await lf.setItem("profile", pr)
    }
    if (!_init) setActiveStep(3)
    return _init
  }

  useEffect(() => {
    ;(async () => {
      if (activeStep === 0) return
      let _init = true
      if (activeStep === 1) {
        _init = await checkVouchDAO(true)
        setInit(_init)
        return
      } else if (activeStep === 2) {
        _init = await checkAOProfile(true)
        setInit(_init)
        return
      } else if (activeStep === 3) {
        const _res4 = await dryrun({
          process: "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA",
          tags: [action("Members")],
        })
        try {
          const members = JSON.parse(_res4?.Messages?.[0]?.Data)
          setMembers(members)
          await lf.setItem("members", members)
          const member = members[addr]
          if (member) setActiveStep(4)
        } catch (e) {}
      }
      setInit(_init)
    })()
  }, [activeStep])
  return (
    <>
      <style global jsx>{`
        html,
        body,
        #__next {
          height: 100%;
        }
        body {
          color: #222326;
          font-family: "Sawarabi Gothic";
        }
      `}</style>
      <Flex
        position="fixed"
        w="100%"
        h="60px"
        sx={{ borderBottom: "1px solid #ccc", zIndex: 2, bg: "white" }}
        align="center"
        justify="center"
      >
        <Flex w="100%" maxW="1200px" align="center" px={6}>
          <Flex
            align="center"
            fontWeight="bold"
            fontSize="20px"
            sx={{
              fontFamily: `"Roboto Mono", monospace`,
              fontOpticalSizing: "auto",
              fontWeight: 600,
              fontStyle: "normal",
            }}
          >
            <Box ml={2}>arweave</Box>
            <Box color="#B5002C" ml={2}>
              japan
            </Box>
          </Flex>
          <Box flex={1} />
          {!addr ? null : (
            <>
              <Button
                mt="1px"
                mr={4}
                size="xs"
                fontWeight="normal"
                variant="ghost"
                colorScheme="gray"
                justify="center"
                onClick={async () => {
                  setBalance(0)
                  setAddr(null)
                  setVouched(null)
                  setProfile(null)
                  setEnc(null)
                  setStats(null)
                  setActiveStep(0)
                  setCode(null)
                  await lf.removeItem("code")
                  await lf.removeItem("verifier")
                  await lf.removeItem("stats")
                  await lf.removeItem("encryptedData")
                  await lf.removeItem("address")
                  await lf.removeItem("vouched")
                  await lf.removeItem("profile")
                  await lf.removeItem("members")
                  await lf.removeItem("memberProfiles")
                }}
              >
                ログアウト
              </Button>
              <Flex
                mr={4}
                fontSize="14px"
                variant="ghost"
                colorScheme="gray"
                justify="center"
              >
                <Flex align="flex-end">
                  <Box
                    fontSize="16px"
                    mr={1}
                    color="#B5002C"
                    fontWeight="bold"
                    sx={{
                      fontFamily: `"Roboto Mono", monospace`,
                      fontOpticalSizing: "auto",
                      fontWeight: 600,
                      fontStyle: "normal",
                    }}
                  >
                    {balance}
                  </Box>
                  <Box>AJ</Box>
                </Flex>
              </Flex>
            </>
          )}
          {profile ? (
            <Image
              title={profile.DisplayName}
              src={
                profile.ProfileImage && profile.ProfileImage !== "None"
                  ? `https://arweave.net/${profile.ProfileImage}`
                  : "/logo.png"
              }
              boxSize="35px"
            />
          ) : (
            <Button
              size="md"
              fontWeight="normal"
              variant="outline"
              colorScheme="gray"
              justify="center"
              onClick={async () => {
                setInit(false)
                await window.arweaveWallet.connect(["ACCESS_ADDRESS"])
                const userAddress =
                  await window.arweaveWallet.getActiveAddress()
                setAddr(userAddress)
                if (userAddress) {
                  setActiveStep(1)
                  await lf.setItem("address", userAddress)
                }
              }}
            >
              {addr ? (
                <>
                  <Box>
                    {addr.slice(0, 5)}...{addr.slice(-5)}
                  </Box>
                </>
              ) : (
                <Box>ウォレット接続</Box>
              )}
            </Button>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" minH="100%">
        <Box height="60px" />
        <Flex justify="center">
          <Box w="100%" maxW="1200px" p={6}>
            <Card mt={2} mb={8} variant="outline">
              <CardHeader>
                <Heading size="md" color="#B5002C">
                  メンバートークン取得
                </Heading>
                <Text pt="2" fontSize="sm">
                  4つのステップをクリアすると、200 AJ
                  トークンが自動で付与されます。メンバーシップを取得すると AO
                  ブートキャンプに参加することができます。
                </Text>
              </CardHeader>
              <CardBody>
                <Stack divider={<StackDivider />} spacing="4">
                  <Box>
                    <Heading size="xs" textTransform="uppercase">
                      Arweave ウォレットアドレス
                    </Heading>
                    <Text pt="2" fontSize="sm" color="#B5002C">
                      {addr ? (
                        <Link
                          href={`https://www.ao.link/#/entity/${addr}`}
                          target="_blank"
                        >
                          {addr}
                        </Link>
                      ) : (
                        "未接続"
                      )}
                    </Text>
                  </Box>
                  <Box>
                    <Heading size="xs" textTransform="uppercase">
                      X アカウント | 信頼値
                    </Heading>
                    <Text pt="2" fontSize="sm">
                      {vouched ? (
                        <Box>
                          <Link
                            href={`https://x.com/${vouched.Identifier}`}
                            target="_blank"
                            mr={2}
                          >
                            <Box as="span" color="#B5002C">
                              {vouched.Identifier}
                            </Box>
                          </Link>{" "}
                          | {vouched.Value.split("-")[0]}
                        </Box>
                      ) : (
                        "未認証"
                      )}
                    </Text>
                  </Box>
                  <Box>
                    <Heading size="xs" textTransform="uppercase">
                      AO Profile ID
                    </Heading>
                    <Text pt="2" fontSize="sm" color="#B5002C">
                      {profile ? (
                        <Link
                          href={`https://ao-bazar.arweave.dev/#/profile/${profile.ProfileId}/assets/`}
                          target="_blank"
                        >
                          {profile.ProfileId}
                        </Link>
                      ) : (
                        "未作成"
                      )}
                    </Text>
                  </Box>
                  {!refAddr || refAddr === addr || !refProfile ? null : (
                    <Box>
                      <Heading size="xs" textTransform="uppercase">
                        リファラル
                      </Heading>
                      <Link
                        href={`https://ao-bazar.arweave.dev/#/profile/${refProfile.ProfileId}/assets/`}
                        target="_blank"
                      >
                        <Text pt="2" fontSize="sm" color="#B5002C">
                          {refProfile.DisplayName}
                        </Text>
                      </Link>
                    </Box>
                  )}
                </Stack>
              </CardBody>
            </Card>
            <Stepper index={activeStep} colorScheme="gray">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>

                  <Box flexShrink="0">
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
            {!init || activeStep !== 4 ? null : stats ? (
              <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                <CardBody>
                  <Text
                    color="#B5002C"
                    fontWeight="bold"
                    sx={{ textDecoration: "underline" }}
                  >
                    おめでとうございます！200 AJ トークンが付与されました！
                  </Text>
                </CardBody>
                <CardFooter>
                  <Link
                    href={`https://ao.link/#/message/${stats.mid}`}
                    target="_blank"
                  >
                    <Button colorScheme="white" variant="outline">
                      トランザクションを見る
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ) : (
              <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                <CardBody>
                  <Text
                    mb={2}
                    color="#B5002C"
                    fontWeight="bold"
                    sx={{ textDecoration: "underline" }}
                  >
                    あなたは Arweave Japan のメンバーです！
                  </Text>
                </CardBody>
                <Text>
                  リファラルリンクを使うと１名紹介につき 10 AJ 獲得できます。
                </Text>
                <CardFooter>
                  {code ? (
                    <Button
                      fontWeight="normal"
                      onClick={() => {
                        function copyToClipboard(text) {
                          if (
                            navigator.clipboard &&
                            navigator.clipboard.writeText
                          ) {
                            navigator.clipboard
                              .writeText(text)
                              .then(() => {
                                console.log(
                                  "Text successfully copied to clipboard!",
                                )
                              })
                              .catch(err => {
                                console.error("Failed to copy text: ", err)
                              })
                          } else {
                            console.error("Clipboard API not supported!")
                          }
                        }
                        copyToClipboard(`https://arweave.jp/?ref=${code}`)
                        toastIdRef.current = toast({
                          description: "リンクをコピーしました",
                          status: "warning",
                        })
                      }}
                    >
                      <Flex>
                        https://arweave.jp/?ref={code}
                        <Box
                          fontSize="14px"
                          ml={3}
                          as="i"
                          className="far fa-copy"
                        />
                      </Flex>
                    </Button>
                  ) : (
                    <Button
                      colorScheme="white"
                      variant="outline"
                      onClick={async () => {
                        await window.arweaveWallet.connect([
                          "SIGNATURE",
                          "ACCESS_PUBLIC_KEY",
                        ])
                        const arweave = Arweave.init()
                        const pub =
                          await window.arweaveWallet.getActivePublicKey()
                        const addr = await arweave.wallets.jwkToAddress({
                          e: "AQAB",
                          ext: true,
                          kty: "RSA",
                          n: pub,
                        })
                        const _data = new TextEncoder().encode(addr)
                        const signature =
                          await window.arweaveWallet.signMessage(_data)
                        const res = await fetch(`/api/getReferralCode`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            publicKey: pub,
                            signature: to64(signature),
                          }),
                        }).then(r => r.json())
                        if (res.code) {
                          setCode(res.code)
                          await lf.setItem("code", res.code)
                        }
                      }}
                    >
                      リファラルリンク取得
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
            {!init || activeStep !== 4 ? null : (
              <>
                <Accordion mt={10} mb={4} allowToggle={true}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          Arweave / AO 入門
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        Arewave Japan
                        の目的はグローバルのトップで活躍するビルダーやプロジェクトを多数輩出することです。
                      </p>
                      <Box px={8}>
                        <ol>
                          <li>
                            X の{" "}
                            <Box
                              color="#B5002C"
                              as="a"
                              target="_blank"
                              href="https://x.com/arweavejp"
                            >
                              @arweavejp
                            </Box>{" "}
                            アカウントで開発に役立つ情報やリソースを日本語発信しています。
                          </li>
                          <li>
                            <Box
                              color="#B5002C"
                              as="a"
                              target="_blank"
                              href="https://discord.gg/bB4N7fAMmp"
                            >
                              ディスコード
                            </Box>
                            で開発サポートや開発用 AR
                            トークンの配布を行っています。
                          </li>
                          <li>
                            <Box
                              color="#B5002C"
                              as="a"
                              target="_blank"
                              href="https://github.com/arweavejp"
                            >
                              Github
                            </Box>{" "}
                            で様々なソースコードや資料を公開しています。
                          </li>
                          <li>
                            <Box
                              color="#B5002C"
                              as="a"
                              target="_blank"
                              href="https://github.com/arweavejp/.github/blob/master/docs/quick-start.md"
                            >
                              Arweave / AO 開発入門
                            </Box>
                            から最速で Arewave / AO
                            の開発を包括的に学習できます。
                          </li>
                          <li>
                            トークンや賞金が獲得できる AO
                            ブートキャンプとハッカソンを予定しているので是非ご参加下さい！
                          </li>
                        </ol>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                <Card mt={8} mb={4} variant="outline">
                  <CardHeader>
                    <Flex fontWeight="bold" align="center" fontSize="20px">
                      <Box as="span" color="#B5002C">
                        メンバー
                      </Box>
                      <Box as="span" ml={4} fontWeight="normal" fontSize="14px">
                        {memberProfiles.length} 名
                      </Box>
                    </Flex>
                  </CardHeader>
                  <Flex wrap="wrap" pb={6} px={6}>
                    {map(v => (
                      <>
                        <Link
                          href={`https://ao-bazar.arweave.dev/#/profile/${v.ProfileId}/assets/`}
                          target="_blank"
                        >
                          <Image
                            m={2}
                            title={v.DisplayName}
                            src={
                              !v.ProfileImage || v.ProfileImage === "None"
                                ? `/logo.png`
                                : `https://arweave.net/${v.ProfileImage}`
                            }
                            boxSize="50px"
                          />
                        </Link>
                      </>
                    ))(memberProfiles)}
                  </Flex>
                </Card>
              </>
            )}
            {init ? null : (
              <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                <CardBody>
                  <Flex align="center">
                    <CircularProgress
                      isIndeterminate
                      mr={4}
                      color="gray"
                      size="30px"
                    />
                    <Box>情報を取得中です...</Box>
                  </Flex>
                </CardBody>
              </Card>
            )}
            {!init || activeStep !== 0 ? null : (
              <>
                <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                  <CardBody>
                    <Text>
                      ArConnect ウォレットをブラウザにインストールして Arweave
                      アカウントを生成し、接続しましょう。
                    </Text>
                  </CardBody>
                  <CardFooter>
                    {!isArconnect ? (
                      <Link href="https://arconnect.io" target="_blank">
                        <Button colorScheme="white" variant="outline">
                          ArConnect をインストール
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        colorScheme="white"
                        variant="outline"
                        onClick={async () => {
                          setInit(false)
                          await window.arweaveWallet.connect(["ACCESS_ADDRESS"])
                          const userAddress =
                            await window.arweaveWallet.getActiveAddress()
                          setAddr(userAddress)
                          if (userAddress) {
                            setActiveStep(1)
                            await lf.setItem("address", userAddress)
                          }
                        }}
                      >
                        ウォレット接続
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                <Accordion mt={10} mb={4} allowToggle={true}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          ArConnect ウォレット
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        もっとも使われている Arweave
                        のブラウザ拡張機能ウォレットで、 AR トークンや AO
                        上のトークンを管理できます。
                      </p>
                      <p>
                        ArConnect からクレジットカードや Apple Pay / Google Pay
                        を使って直接 AR トークンを購入することもできます
                        （要KYC）。
                      </p>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          AJ トークン
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        AO 上にデプロイされた Arweave Japan
                        メンバーのテストトークンです。取得タスクやブートキャンプの課題等をクリアすると{" "}
                        <Box
                          color="#B5002C"
                          as="a"
                          target="_blank"
                          href="https://ao.link/#/entity/XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA"
                        >
                          AO プロセス
                        </Box>
                        によって自動で配布されます。
                      </p>
                      <p>今後リファラルプログラムも展開されます。</p>
                      <p>
                        数兆円規模が期待される AO エコシステムで、
                        分散型ソーシャルアプリケーション、 Arweave Japan
                        イベントへの優待参加権、 Arweave
                        ドメイン取得トークンとの交換、国内外企業からの特典、各種ステーキング、メンバー間の報酬支払い、ガバナンス投票、プロジェクトサポート等、様々な用途に活用される予定です。
                      </p>
                      <p>AO 上の DEX 上場も予定しています。</p>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </>
            )}
            {!init || activeStep !== 1 ? null : (
              <>
                <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                  <CardBody>
                    <Text>
                      VouchDAO でウォレットアドレスを認証しましょう。
                    </Text>
                  </CardBody>
                  <CardFooter>
                    <Box>
                      <Link
                        href="https://vouch-twitter.arweave.dev"
                        target="_blank"
                      >
                        <Button colorScheme="white" variant="outline">
                          ウォレットアドレスを認証
                        </Button>
                      </Link>
                      <Flex mt={4} justify="center">
                        <Box
                          sx={{
                            textDecoration: "underline",
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                          }}
                          onClick={async () => {
                            setInit(false)
                            setInit(await checkVouchDAO(true))
                          }}
                        >
                          再チェック
                        </Box>
                      </Flex>
                    </Box>
                  </CardFooter>
                </Card>
                <Accordion mt={10} mb={4} allowToggle={true}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          VouchDAO
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        ボットや
                        AI、複数アカウントによるシビル攻撃を防ぐための分散型認証プロトコルで{" "}
                        <Box
                          href="https://github.com/ArweaveTeam/arweave-standards/blob/ans-109/ans/ANS-109.md"
                          target="_blank"
                          as="a"
                          color="#B5002C"
                        >
                          ANS-109
                        </Box>{" "}
                        を AO 上に実装しています。
                      </p>
                      <p>
                        一定のフォロワー数を有する等の運用履歴のある X
                        アカウント等を紐付けることで Arweave
                        アカウントに信用を付け、アプリケーションは信用あるアカウントのみを扱うことができます。
                      </p>
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          信頼値
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        Confidence Value
                        と呼ばれる一定のアルゴリズムでアカウントの信用度を評価した値です。
                      </p>
                      <p>
                        <Box
                          color="#B5002C"
                          as="a"
                          target="_blank"
                          href="https://github.com/permaweb/vouch-x/blob/main/server/lib/calc-confidence-value.js"
                        >
                          こちらでアルゴリズムを確認
                        </Box>
                        できます。
                      </p>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </>
            )}
            {!init || activeStep !== 2 ? null : (
              <>
                <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                  <CardBody>
                    <Text>BazAR で AO Profile を作成しましょう。</Text>
                  </CardBody>
                  <CardFooter>
                    <Box>
                      <Link href="https://ao-bazar.arweave.dev" target="_blank">
                        <Button colorScheme="white" variant="outline">
                          AO Profile を作成
                        </Button>
                      </Link>
                      <Flex mt={4} justify="center">
                        <Box
                          sx={{
                            textDecoration: "underline",
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                          }}
                          onClick={async () => {
                            setInit(false)
                            setInit(await checkAOProfile(true))
                          }}
                        >
                          再チェック
                        </Box>
                      </Flex>
                    </Box>
                  </CardFooter>
                </Card>
                <Accordion mt={10} mb={4} allowToggle={true}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          AO Profile
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        Arweave / AO
                        上でアプリケーションをまたいで使われる共通のプロフィール規格です。
                      </p>
                      <p>
                        AO プロセスで管理され BazAR
                        マーケットプレイス等で作成できます。
                      </p>
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          BazAR マーケットプレイス
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        Arweave 版 NFT 規格の
                        <Box
                          color="#B5002C"
                          as="a"
                          target="_blank"
                          href="https://helix.arweave.dev/#/docs/core-concepts"
                        >
                          アトミックアセット
                        </Box>
                        を扱った分散型マーケットプレイスで、 AO Profile
                        にアセットやコレクションをインデックスしています。
                      </p>
                      <p>
                        アトミックアセットはスマートコントラクト上の所有権とオフチェーンデータが分離した既存の
                        NFT
                        とは異なり、所有権、データ、ライセンス、スマートコントラクトを全て
                        Arweave
                        ストレージのオンチェーン上に一ヶ所に永久保存することができ、所有しているはずのオフチェーンデータが消えてしまうことがありません。
                      </p>
                      <p>
                        ライセンスは
                        <Box
                          color="#B5002C"
                          as="a"
                          href="https://helix.arweave.dev/#/docs/attach-udl"
                          target="_blank"
                        >
                          UDL （ユニバーサル・データ・ライセンス）
                        </Box>{" "}
                        と呼ばれ、永久保存データのロイヤリティ分配や利益シェアをプログラマブルに自動化可能にするプロトコルです。
                      </p>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </>
            )}
            {!init || activeStep !== 3 ? null : (
              <>
                <Card align="center" mb={4} mt={10} variant="filled" p={4}>
                  <CardBody>
                    <Text>X にログインして AJ トークンを取得しましょう。 100 フォロワー以上のアカウントを条件にしています。</Text>
                  </CardBody>
                  <CardFooter>
                    {enc ? (
                      <Button
                        colorScheme="white"
                        variant="outline"
                        onClick={async () => {
                          await window.arweaveWallet.connect(["SIGNATURE"])
                          const _data = new TextEncoder().encode(enc.join(""))
                          const signature =
                            await window.arweaveWallet.signMessage(_data)
                          const res = await fetch(`/api/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              data: enc,
                              signature: to64(signature),
                            }),
                          }).then(r => r.json())
                          if (res?.error === "not enough followers") {
                            alert(
                              "100 フォロワー以上の X アカウントが必要です。",
                            )
                          } else if (res && !res.error) {
                            await lf.setItem("stats", res)
                            setStats(res)
                            setTimeout(async () => {
                              const _res4 = await dryrun({
                                process:
                                  "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA",
                                tags: [action("Members")],
                              })
                              const member = JSON.parse(
                                _res4?.Messages?.[0]?.Data,
                              )?.[addr]
                              if (member) {
                                setActiveStep(4)
                                setMembers(
                                  JSON.parse(_res4?.Messages?.[0]?.Data),
                                )
                              }
                            }, 3000)
                          }
                        }}
                      >
                        AJ トークン取得
                      </Button>
                    ) : (
                      <Button
                        colorScheme="white"
                        variant="outline"
                        onClick={async () => {
                          await window.arweaveWallet.connect([
                            "ACCESS_PUBLIC_KEY",
                          ])
                          const publicKey =
                            await window.arweaveWallet.getActivePublicKey()
                          const { url, data } = await fetch(`/api/x`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ publicKey, code: ref }),
                          }).then(r => r.json())
                          if (url) {
                            await lf.setItem(`verifier`, { url, data })
                            location.href = url
                          }
                        }}
                      >
                        X にログイン
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                <Accordion mt={10} mb={4} allowToggle={true}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          サーバレス X OAuth 2.0
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        X の OAuth 2.0
                        をバックエンドサーバーにデータ保存しないサーバレス関数と暗号化の仕組みでセキュアに取り扱っています。
                      </p>
                      <Box px={8}>
                        <ol>
                          <li>
                            ユーザーウォレット （以下ユーザー） が AJ ウォレット
                            （以下 AJ） に公開鍵を送信。 AJ
                            ウォレットはサーバーレス関数に格納されている。
                          </li>
                          <li>
                            AJ は X OAuth 2.0 の認証 URL
                            を生成後、秘密鍵を使ってユーザー公開鍵と state と
                            verifierCode を AJ の公開鍵で暗号化しユーザーに URL
                            と共に暗号化オブジェクトを送信。
                          </li>
                          <li>
                            ユーザーは X でログインし、 state と code
                            を取得、秘密鍵で暗号化オブジェクトを署名し暗号化オブジェクトとその署名も
                            AJ に送信。
                          </li>
                          <li>
                            AJ
                            は暗号化オブジェクトを秘密鍵で復号し署名と暗号化オブジェクトに保存したユーザー公開鍵が一致するか検証。また、ユーザーから送られてきた
                            state と 暗号化オブジェクト内の state
                            が一致する場合、X から code と verifierCode
                            を使ってユーザーのアクセストークンを取得し復号化されたオブジェクトに追加して再暗号化しユーザーに送信。
                          </li>
                          <li>
                            ユーザーはこの暗号化オブジェクトを AJ に送信すると
                            AJ
                            が復号化して中に保存されたアクセストークンとユーザー公開鍵を利用してユーザーのアイデンティティを検証できる。
                          </li>
                        </ol>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box
                          color="#B5002C"
                          as="span"
                          flex="1"
                          textAlign="left"
                        >
                          AJ トークン取得 AO プロセス
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      pb={4}
                      sx={{ lineHeight: "180%", fontSize: "14px" }}
                    >
                      <p>
                        AJ トークンの取得は AO
                        プロセスで完全自動化されています。
                      </p>
                      <Box px={8}>
                        <ol>
                          <li>
                            ユーザーのアイデンティティ検証後、 AJ ウォレットが
                            Join プロセスに Verify アクションを送信。
                          </li>
                          <li>
                            Verify 関数が VouchDAO 認証確認と AO Profile
                            の存在確認するメッセージを VouchDAO と AO Profile
                            プロセスに送信。
                          </li>
                          <li>
                            VouchDAO と AO Profile から返信を受けた Join
                            プロセスが AJ トークンプロセスに Join
                            アクションを送信。
                          </li>
                          <li>
                            Join アクションを受け取った AJ
                            トークンプロセスがトークンを配布しメンバーを追加、
                            Join プロセスに Joined アクションを返信。
                          </li>
                          <li>
                            Joined アクションを受け取った Join
                            プロセスがメンバー登録完了の処理をし二重登録を防ぐ。
                          </li>
                        </ol>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </Box>
        </Flex>
        <Box flex={1} />
        <Flex
          p={4}
          justify="center"
          sx={{ borderTop: "1px solid #ccc" }}
          align="center"
        >
          <Flex w="100%" maxW="1200px" px={6} py={6}>
            <Box flex={1}>
              <Box fontSize="bold" mb={2} color="#B5002C">
                日本語リソース
              </Box>
              <Box px={2} fontSize="12px">
                <Link target="_blank" href="https://github.com/arweavejp">
                  <Box mb={1}>Arweave Japan とは？</Box>
                </Link>
                <Link
                  target="_blank"
                  href="https://github.com/arweavejp/.github/blob/master/docs/quick-start.md"
                >
                  <Box mb={1}>Arweave / AO 開発入門</Box>
                </Link>
                <Link
                  target="_blank"
                  href="https://github.com/arweavejp/.github/blob/master/docs/resources.md"
                >
                  <Box mb={1}>リソースまとめ</Box>
                </Link>
                <Link target="_blank" href="https://logo.arweave.jp">
                  <Box>ロゴダウンロード</Box>
                </Link>
              </Box>
            </Box>
            <Box flex={1}>
              <Box fontSize="bold" mb={2} color="#B5002C">
                英語リソース
              </Box>
              <Box px={2} fontSize="12px">
                <Link target="_blank" href="https://arweave.org">
                  <Box mb={1}>Arweave.org</Box>
                </Link>
                <Link target="_blank" href="https://ao.arweave.dev">
                  <Box mb={1}>ao.arweave.dev</Box>
                </Link>
                <Link target="_blank" href="https://cookbook.arweave.dev/">
                  <Box mb={1}>Arweave Cookbbook</Box>
                </Link>
                <Link target="_blank" href="https://cookbook_ao.g8way.io">
                  <Box>AO Cookbbook</Box>
                </Link>
              </Box>
            </Box>
            <Box flex={1}>
              <Box fontSize="bold" mb={2} color="#B5002C">
                関連リンク
              </Box>
              <Box px={2} fontSize="12px">
                <Link target="_blank" href="https://arconnect.io">
                  <Box mb={1}>ArConnect ウォレット</Box>
                </Link>
                <Link target="_blank" href="https://vouchdao.arweave.dev">
                  <Box mb={1}>VouchDAO</Box>
                </Link>
                <Link target="_blank" href="https://ao-bazar.arweave.dev">
                  <Box mb={1}>BazAR マーケットプレイス</Box>
                </Link>
                <Link
                  target="_blank"
                  href="https://ao.link/#/token/XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA"
                >
                  <Box>AJ トークン</Box>
                </Link>
              </Box>
            </Box>
            <Box flex={1}>
              <Box fontSize="bold" mb={2} color="#B5002C">
                コミュニティ
              </Box>
              <Flex px={2}>
                <Link target="_blank" href="https://github.com/arweavejp">
                  <Box
                    as="i"
                    className="fab fa-github"
                    fontSize="25px"
                    mr={4}
                  />
                </Link>
                <Link target="_blank" href="https://x.com/arweavejp">
                  <Box
                    as="i"
                    className="fab fa-twitter"
                    fontSize="25px"
                    mr={4}
                  />
                </Link>
                <Link target="_blank" href="https://discord.gg/bB4N7fAMmp">
                  <Box
                    as="i"
                    className="fab fa-discord"
                    fontSize="25px"
                    mr={4}
                  />
                </Link>
              </Flex>
            </Box>
            <Flex flex={1} justify="flex-end">
              <Image src={`/logotype.png`} h="50px" />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
