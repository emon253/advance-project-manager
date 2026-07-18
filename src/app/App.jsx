/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppStateProvider } from "./providers";
import { AppRoutes } from "./routes";
import { PwaUpdatePrompt } from "../components/common/PwaUpdatePrompt";

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <AppRoutes />
        <PwaUpdatePrompt />
      </AppStateProvider>
    </BrowserRouter>
  );
}
