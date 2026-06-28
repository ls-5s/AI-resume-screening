/**
 * App 根组件
 * 配置 React Router 路由表，包含公开路由和需认证路由
 */

import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ToastContainer } from "./components/Toast";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;
