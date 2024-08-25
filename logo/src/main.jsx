import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createHashRouter } from "react-router-dom"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import Bootcamp from "./pages/Bootcamp"
import { ChakraProvider } from "@chakra-ui/react"

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/bootcamp",
    element: <Bootcamp />,
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider>
      <RouterProvider router={router} />
    </ChakraProvider>
  </StrictMode>,
)
