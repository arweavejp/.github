import { Flex, Box } from "@chakra-ui/react"
import { useState } from "react"
import { map } from "ramda"
import font from "./font"

const red = "#B5002C"
const text = "#222326"
const black = "#000"
const white = "#fff"
const fontFamily = `"Roboto Mono", monospace`

function App() {
  const [color, setColor] = useState("Color")
  const [type, setType] = useState("Logotype")
  const [isBG, setIsBG] = useState(false)
  const [isPadding, setIsPadding] = useState(false)

  const colors = ["Color", "Black", "White"]
  const types = ["Logotype", "Glyph"]
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
  let w = 975
  let h = 300
  let padX = 0
  let padY = 0
  if (type === "Glyph") w = 300
  if (isPadding) {
    padX = 40
    padY = 40
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
              bg={isBG ? red : "#eee"}
              color={isBG ? "white" : ""}
              mr={4}
              py={1}
              w="80px"
              align="center"
              justify="center"
              onClick={() => setIsBG(!isBG)}
              sx={{
                borderRadius: "5px",
                cursor: "pointer",
                ":hover": { opacity: 0.75 },
              }}
            >
              Background
            </Flex>
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
              const svgElement = document.getElementById("logo")
              const serializer = new XMLSerializer()
              const svgString = serializer.serializeToString(svgElement)
              const img = new Image()
              img.src = "data:image/svg+xml;base64," + btoa(svgString)
              img.onload = function () {
                const canvas = document.getElementById("canvas")
                canvas.width = svgElement.width.baseVal.value
                canvas.height = svgElement.height.baseVal.value
                const context = canvas.getContext("2d")
                context.drawImage(img, 0, 0)
                const pngDataUrl = canvas.toDataURL("image/png")
                const downloadLink = document.createElement("a")
                downloadLink.href = pngDataUrl
                downloadLink.download = `arweave-japan-${type.toLowerCase()}-${color.toLowerCase()}.png`
                document.body.appendChild(downloadLink)
                downloadLink.click()
                document.body.removeChild(downloadLink)
              }
            }}
            sx={{
              borderRadius: "5px",
              cursor: "pointer",
              ":hover": { opacity: 0.75 },
            }}
          >
            PNG
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
          <Box
            p="1px"
            sx={{
              border: `1px solid ${isBG ? "#ccc" : isPadding ? color2 : bg}`,
            }}
          >
            <Box
              as="svg"
              id="logo"
              h={h}
              w={`${w}px`}
              sx={{
                cursor: "pointer",
              }}
            >
              <defs>
                <style type="text/css">{font}</style>
              </defs>
              {!isBG ? null : (
                <rect height={h} width={w} x="0" y="0" fill={bg} />
              )}
              <circle
                cx={150 + padX}
                cy={150 + padY}
                r="140"
                fill="transparent"
                stroke={color2}
                style={{ strokeWidth: "20px" }}
              />
              <text
                x={88 + padX}
                y={202 + padY}
                className="logo"
                fill={color1}
                style={{
                  fontWeight: "600",
                  fontSize: "195px",
                  fontFamily,
                }}
              >
                a
              </text>
              {type === "Glyph" ? null : (
                <>
                  <text
                    x={400 + padX}
                    y={110 + padY}
                    className="logo"
                    fill={color1}
                    style={{
                      fontWeight: "600",
                      fontSize: "100px",
                      letterSpacing: "26px",
                      fontFamily,
                    }}
                  >
                    arweave
                  </text>
                  <text
                    x={400 + padX}
                    y={235 + padY}
                    className="logo"
                    fill={color2}
                    style={{
                      fontWeight: "600",
                      fontSize: "100px",
                      letterSpacing: "26px",
                      fontFamily,
                    }}
                  >
                    japan
                  </text>
                </>
              )}
            </Box>
          </Box>
        </Flex>
      </Flex>
      <canvas id="canvas" style={{ display: "none" }}></canvas>
    </>
  )
}

export default App
