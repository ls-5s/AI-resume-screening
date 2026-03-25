import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ToastContainer } from "./components/Toast";
// import { PetDesktop } from "./components/pet";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      {/* <PetDesktop /> */}
    </>
  );
}

export default App;
