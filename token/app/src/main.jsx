import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import Claim from "./Claim.jsx"
import { ChakraProvider } from "@chakra-ui/react"
import { RouterProvider, createHashRouter } from "react-router-dom"

const router = createHashRouter([
  { path: "/", element: <App /> },
  { path: "/claim/:id", element: <Claim /> },
])
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>,
)
