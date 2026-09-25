import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { ToastProvider } from "./app/providers/ToastProvider";
import "./shared/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider><RouterProvider router={router} /></ToastProvider>
  </React.StrictMode>,
);
