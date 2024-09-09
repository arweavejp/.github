import { Image as Image2, Flex, Box } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { map, range } from "ramda"
import font from "../font"

const red = "#222326"
const text = "#222326"
const black = "#222326"
const white = "#fff"
const fontFamily = `"Roboto Mono", monospace`

function App() {
  const [color, setColor] = useState("Color")
  const [type, setType] = useState("Animation")
  const [isBG, setIsBG] = useState(false)
  const [isPadding, setIsPadding] = useState(false)
  const [opa, setOpa] = useState(false)
  useEffect(() => {
    setTimeout(() => {
      setOpa(true)
    }, 1000)
  }, [])
  const colors = ["Color"]
  const types = ["Animation"]
  let color1 = text
  let color2 = red
  let bg = white
  if (color === "White") {
    color1 = white
    color2 = white
    bg = black
  } else if (color === "Black") {
    color1 = black
    color2 = black
    bg = white
  }
  let w = 600
  let h = 300
  let padX = 0
  let padY = 0
  if (type === "Glyph") w = 300
  if (isPadding) {
    padX = 50
    padY = 200
  }
  w += padX * 2
  h += padY * 2
  return (
    <>
      <style>{`
html, body, #root {
    margin: 0;
    padding:0;
    height:100%;
background-color: ${isBG ? "#ccc" : bg};
color: ${text};
}

`}</style>
      <Flex
        direction="column"
        sx={{
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Flex my={6} w="100%" maxW="960px" fontSize="12px">
          <Flex>
            {map(v => (
              <Flex
                bg={v === color ? red : "#eee"}
                color={v === color ? "white" : ""}
                mr={4}
                py={1}
                w="60px"
                align="center"
                justify="center"
                onClick={() => setColor(v)}
                sx={{
                  borderRadius: "5px",
                  cursor: "pointer",
                  ":hover": { opacity: 0.75 },
                }}
              >
                {v}
              </Flex>
            ))(colors)}
          </Flex>
          <Flex ml={8}>
            {map(v => (
              <Flex
                bg={v === type ? red : "#eee"}
                color={v === type ? "white" : ""}
                mr={4}
                py={1}
                w="70px"
                align="center"
                justify="center"
                onClick={() => setType(v)}
                sx={{
                  borderRadius: "5px",
                  cursor: "pointer",
                  ":hover": { opacity: 0.75 },
                }}
              >
                {v}
              </Flex>
            ))(types)}
          </Flex>
          <Flex ml={8}>
            <Flex
              bg={isPadding ? red : "#eee"}
              color={isPadding ? "white" : ""}
              mr={4}
              py={1}
              w="80px"
              align="center"
              justify="center"
              onClick={() => setIsPadding(!isPadding)}
              sx={{
                borderRadius: "5px",
                cursor: "pointer",
                ":hover": { opacity: 0.75 },
              }}
            >
              Padding
            </Flex>
          </Flex>
          <Box flex={1} />
          <Flex
            ml={4}
            py={1}
            align="center"
            justify="center"
            onClick={() => {}}
            sx={{
              borderRadius: "5px",
              cursor: "pointer",
              ":hover": { opacity: 0.75 },
            }}
          >
            Download
          </Flex>
          <Flex
            ml={4}
            py={1}
            w="50px"
            bg="#eee"
            align="center"
            justify="center"
            onClick={() => {
              window.svgExport.downloadSvg(
                document.getElementById("logo"),
                `arweave-japan-logo-${type.toLowerCase()}-${color.toLowerCase()}`,
              )
            }}
            sx={{
              borderRadius: "5px",
              cursor: "pointer",
              ":hover": { opacity: 0.75 },
            }}
          >
            SVG
          </Flex>
        </Flex>
        <Flex
          sx={{
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
          w="100%"
        >
          <Flex
            p="1px"
            sx={{
              border: `1px solid ${isBG ? "#ccc" : isPadding ? color2 : bg}`,
              position: "relative",
            }}
          >
            <Box
              as="svg"
              id="logo"
              h={h}
              w={`${w}px`}
              sx={{ cursor: "pointer" }}
            >
              {map(v => {
                return (
                  <line x1={v.x1} y1={v.y1} x2={v.x1} y2={v.y1} stroke={black}>
                    <animate
                      attributeName="x2"
                      from={v.x1}
                      to={v.x2}
                      dur="1s"
                      fill="freeze"
                      begin={v.begin + "s"}
                    />
                    <animate
                      attributeName="y2"
                      from={v.y1}
                      to={v.y2}
                      dur="1s"
                      fill="freeze"
                      begin={v.begin + "s"}
                    />
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      dur="1s"
                      fill="freeze"
                      begin="16s"
                    />
                  </line>
                )
              })([
                {
                  x1: 0 + padX,
                  y1: 300 + padY,
                  x2: 150 + padX,
                  y2: 0 + padY,
                  stroke: "green",
                  begin: 2,
                },
                {
                  x1: 150 + padX,
                  y1: 0 + padY,
                  x2: 300 + padX,
                  y2: 300 + padY,
                  stroke: "green",
                  begin: 3,
                },
                {
                  x1: 300 + padX,
                  y1: 300 + padY,
                  x2: 450 + padX,
                  y2: 0 + padY,
                  stroke: "green",
                  begin: 4,
                },
                {
                  x1: 450 + padX,
                  y1: 0 + padY,
                  x2: 600 + padX,
                  y2: 300 + padY,
                  stroke: "green",
                  begin: 5,
                },
                {
                  x1: 0 + padX,
                  y1: 0 + padY,
                  x2: 150 + padX,
                  y2: 300 + padY,
                  stroke: "#222326",
                  begin: 6,
                },
                {
                  x1: 150 + padX,
                  y1: 300 + padY,
                  x2: 300 + padX,
                  y2: 0 + padY,
                  stroke: "#222326",
                  begin: 7,
                },
                {
                  x1: 300 + padX,
                  y1: 0 + padY,
                  x2: 450 + padX,
                  y2: 300 + padY,
                  stroke: "#222326",
                  begin: 8,
                },
                {
                  x1: 450 + padX,
                  y1: 300 + padY,
                  x2: 600 + padX,
                  y2: 0 + padY,
                  stroke: "#222326",
                  begin: 9,
                },
                {
                  x1: 70 + padX,
                  y1: 0 + padY,
                  x2: 220 + padX,
                  y2: 300 + padY,
                  stroke: "gold",
                  begin: 10,
                },
                {
                  x1: 380 + padX,
                  y1: 0 + padY,
                  x2: 530 + padX,
                  y2: 300 + padY,
                  stroke: "gold",
                  begin: 10,
                },

                {
                  x1: 300 + padX,
                  y1: 0 + padY,
                  x2: 220 + padX,
                  y2: 300 + padY,
                  stroke: "red",
                  begin: 11,
                },
                {
                  x1: 380 + padX,
                  y1: 0 + padY,
                  x2: 300 + padX,
                  y2: 300 + padY,
                  stroke: "red",
                  begin: 11,
                },

                {
                  x1: 200 + padX,
                  y1: 0 + padY,
                  x2: 100 + padX,
                  y2: 300 + padY,
                  stroke: "red",
                  begin: 11,
                },
                {
                  x1: 500 + padX,
                  y1: 0 + padY,
                  x2: 400 + padX,
                  y2: 300 + padY,
                  stroke: "red",
                  begin: 11,
                },
              ])}
              {map(v => {
                const o = map(v2 => v2.join(","))([
                  v.p[0],
                  v.p[0],
                  v.p[0],
                  v.p[0],
                ]).join(" ")
                const to = map(v2 => v2.join(","))(v.p).join(" ")
                const from = map(v2 => v2.join(","))([
                  v.p[0],
                  v.p[0],
                  v.p[3],
                  v.p[3],
                ]).join(" ")
                return (
                  <polygon points={o} fill={v.fill ?? "#222326"}>
                    <animate
                      attributeName="points"
                      from={from}
                      to={to}
                      begin={v.begin + "s"}
                      dur="1s"
                      fill="freeze"
                    />
                    {v.n ? (
                      <>
                        <animate
                          attributeName="fill"
                          from={v.fill}
                          to="#444"
                          dur="1s"
                          fill="freeze"
                          begin="18s"
                        />
                        <animate
                          attributeName="fill"
                          from="#444"
                          to="#222326"
                          dur="1s"
                          fill="freeze"
                          begin="19s"
                        />
                      </>
                    ) : null}
                  </polygon>
                )
              })([
                {
                  begin: 12,
                  p: [
                    [150 + padX, 0 + padY],
                    [0 + padX, 300 + padY],
                    [100 + padX, 300 + padY],
                    [200 + padX, 0 + padY],
                  ],
                },
                {
                  n: true,
                  begin: 12,
                  p: [
                    [450 + padX, 300 + padY],
                    [600 + padX, 0 + padY],
                    [500 + padX, 0 + padY],
                    [400 + padX, 300 + padY],
                  ],
                },
                {
                  begin: 13,
                  p: [
                    [70 + padX, 0 + padY],
                    [220 + padX, 300 + padY],
                    [300 + padX, 300 + padY],
                    [150 + padX, 0 + padY],
                  ],
                },
                {
                  n: true,
                  begin: 13,
                  p: [
                    [530 + padX, 300 + padY],
                    [380 + padX, 0 + padY],
                    [300 + padX, 0 + padY],
                    [450 + padX, 300 + padY],
                  ],
                },
              ])}
              {map(v => {
                const o = map(v2 => v2.join(","))([
                  v.p[0],
                  v.p[0],
                  v.p[0],
                ]).join(" ")
                const to = map(v2 => v2.join(","))(v.p).join(" ")
                const from = map(v2 => v2.join(","))([
                  v.p[0],
                  v.p[0],
                  v.p[0],
                ]).join(" ")
                return (
                  <polygon points={o} fill={v.fill}>
                    <animate
                      attributeName="points"
                      from={from}
                      to={to}
                      begin={v.begin + "s"}
                      dur="1s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="fill"
                      from={v.fill}
                      to="#ffffff"
                      dur="1s"
                      fill="freeze"
                      begin="16s"
                    />
                  </polygon>
                )
              })([
                {
                  fill: "#F6F6F7",
                  begin: 14,
                  p: [
                    [0 + padX, 300 + padY],
                    [0 + padX, 0 + padY],
                    [150 + padX, 0 + padY],
                  ],
                },
                {
                  fill: "#F6F6F7",
                  begin: 14,
                  p: [
                    [300 + padX, 300 + padY],
                    [150 + padX, 0 + padY],
                    [300 + padX, 0 + padY],
                  ],
                },
                {
                  fill: "#F6F6F7",
                  begin: 14,
                  p: [
                    [300 + padX, 0 + padY],
                    [300 + padX, 300 + padY],
                    [450 + padX, 300 + padY],
                  ],
                },
                {
                  fill: "#F6F6F7",
                  begin: 14,
                  p: [
                    [600 + padX, 0 + padY],
                    [600 + padX, 300 + padY],
                    [450 + padX, 300 + padY],
                  ],
                },
              ])}
              {map(v => {
                const o = map(v2 => v2.join(","))([
                  v.p[0],
                  v.p[0],
                  v.p[0],
                  v.p[0],
                ]).join(" ")
                const to = map(v2 => v2.join(","))(v.p).join(" ")
                const from = map(v2 => v2.join(","))([
                  v.p[0],
                  v.p[0],
                  v.p[3],
                  v.p[3],
                ]).join(" ")
                return (
                  <polygon points={o} fill={v.fill ?? "#222326"}>
                    <animate
                      attributeName="points"
                      from={from}
                      to={to}
                      begin={v.begin + "s"}
                      dur="1s"
                      fill="freeze"
                    />
                    {v.white ? (
                      <animate
                        attributeName="fill"
                        from={v.fill}
                        to="#ffffff"
                        dur="1s"
                        fill="freeze"
                        begin="16s"
                      />
                    ) : (
                      <>
                        <animate
                          attributeName="fill"
                          from={v.fill}
                          to="#444"
                          dur="1s"
                          fill="freeze"
                          begin="18s"
                        />
                        <animate
                          attributeName="fill"
                          from="#444"
                          to={v.fill}
                          dur="1s"
                          fill="freeze"
                          begin="19s"
                        />
                      </>
                    )}
                  </polygon>
                )
              })([
                {
                  white: true,
                  fill: "#F6F6F7",
                  begin: 15,
                  p: [
                    [0 + padX, 0 + padY],
                    [150 + padX, 300 + padY],
                    [220 + padX, 300 + padY],
                    [70 + padX, 0 + padY],
                  ],
                },
                {
                  white: true,
                  fill: "#F6F6F7",
                  begin: 15,
                  p: [
                    [600 + padX, 300 + padY],
                    [450 + padX, 0 + padY],
                    [380 + padX, 0 + padY],
                    [530 + padX, 300 + padY],
                  ],
                },
                {
                  fill: "#222326",
                  begin: 17,
                  p: [
                    [300 + padX, 0 + padY],
                    [230 + padX, 300 + padY],
                    [300 + padX, 300 + padY],
                    [380 + padX, 0 + padY],
                  ],
                },
              ])}
              {map(i => {
                return (
                  <>
                    {i < 30 ? (
                      <line
                        x1={padX}
                        y1={i * 10 + padY}
                        x2={padX}
                        y2={i * 10 + padY}
                        stroke="#ccc"
                      >
                        <animate
                          attributeName="x2"
                          from={padX}
                          to={padX + 600}
                          dur="2s"
                          fill="freeze"
                        />
                        <animate
                          attributeName="opacity"
                          from="1"
                          to="0"
                          dur="1s"
                          fill="freeze"
                          begin="16s"
                        />
                      </line>
                    ) : null}
                    <line
                      y1={padY}
                      x1={i * 10 + padX}
                      y2={padY}
                      x2={i * 10 + padX}
                      stroke="#ccc"
                    >
                      <animate
                        attributeName="y2"
                        from={padY}
                        to={padY + 300}
                        dur="1s"
                        fill="freeze"
                        begin="1s"
                      />
                      <animate
                        attributeName="opacity"
                        from="1"
                        to="0"
                        dur="1s"
                        fill="freeze"
                        begin="16s"
                      />
                    </line>
                  </>
                )
              })(range(0, 60))}
            </Box>
            <Image2
              src="/ao.svg"
              h="326px"
              sx={{
                position: "absolute",
                top: -12 + padY + "px",
                left: 0 + padX,
                opacity: opa ? 0 : 1,
                transition: opa ? "opacity 20s" : "",
              }}
            />
          </Flex>
        </Flex>
      </Flex>
      <canvas id="canvas" style={{ display: "none" }}></canvas>
    </>
  )
}

export default App
