import {
  StrictMode
} from "react";
import {
  createRoot
} from "react-dom/client";

import App from "./App";
import PhysicalBridgeLauncher
  from "./PhysicalBridgeLauncher";
import PublicObjectPage
  from "./PublicObjectPage";
import "./styles.css";
import "./physical-object.css";

const root =
  document.getElementById("root");

if (!root) {
  throw new Error(
    "ORYBIT root element was not found."
  );
}

const publicMatch =
  window.location.pathname.match(
    /^\/o\/([^/]+)\/?$/
  );

const content = publicMatch
  ? (
      <PublicObjectPage
        publicId={decodeURIComponent(
          publicMatch[1]
        )}
      />
    )
  : (
      <>
        <App />
        <PhysicalBridgeLauncher />
      </>
    );

createRoot(root).render(
  <StrictMode>
    {content}
  </StrictMode>
);
