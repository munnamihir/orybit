import {
  StrictMode
} from "react";
import {
  createRoot
} from "react-dom/client";

import App from "./App";
import CapabilityEngineConsole
  from "./CapabilityEngineConsole";
import DeveloperConsole
  from "./DeveloperConsole";
import ObjectMemoryConsole
  from "./ObjectMemoryConsole";
import OwnershipAcceptancePage
  from "./OwnershipAcceptancePage";
import OwnershipConsole
  from "./OwnershipConsole";
import PhysicalBridgeLauncher
  from "./PhysicalBridgeLauncher";
import PublicObjectPage
  from "./PublicObjectPage";
import "./styles.css";
import "./physical-object.css";
import "./object-memory.css";
import "./ownership.css";
import "./capability-engine.css";
import "./developer-platform.css";

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

const isOwnershipAcceptance =
  /^\/ownership\/accept\/?$/.test(
    window.location.pathname
  );

const content = isOwnershipAcceptance
  ? <OwnershipAcceptancePage />
  : publicMatch
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
          <ObjectMemoryConsole />
          <OwnershipConsole />
          <CapabilityEngineConsole />
          <DeveloperConsole />
          <PhysicalBridgeLauncher />
        </>
      );

createRoot(root).render(
  <StrictMode>
    {content}
  </StrictMode>
);
