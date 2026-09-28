import {
  existsSync,
  readFileSync
} from "node:fs";

const requiredFiles = [
  "README.md",
  "docs/VISION.md",
  "docs/PRINCIPLES.md",
  "docs/ARCHITECTURE.md",
  "docs/ROADMAP.md",
  "docs/PROTOCOL-v0.1.md",
  "docs/adr/ADR-001-carrier-independent-identity.md",
  "docs/adr/ADR-002-web-first.md",
  "docs/adr/ADR-003-zero-cost-prototype.md",
  "docs/adr/ADR-004-events-for-lifecycle-history.md",
  "specs/v0.1/object.schema.json",
  "specs/v0.1/event.schema.json",
  "specs/v0.1/capability.schema.json",
  "examples/coffee-machine/object.json",
  "examples/coffee-machine/events.json",
  "examples/coffee-machine/capabilities.json",
  "packages/protocol/package.json",
  "packages/protocol/tsconfig.json",
  "packages/protocol/src/protocol-version.ts",
  "packages/protocol/src/types.ts",
  "packages/protocol/src/ids.ts",
  "packages/protocol/src/validators.ts",
  "packages/protocol/src/index.ts",
  "packages/protocol/test/protocol.test.mjs"
];

console.log("");
console.log("ORYBIT Foundation Check");
console.log("=======================");
console.log("");

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`✗ Missing: ${file}`);
    failed = true;
  } else {
    console.log(`✓ ${file}`);
  }
}

const jsonFiles = requiredFiles.filter(
  (file) => file.endsWith(".json")
);

console.log("");
console.log("JSON validation");
console.log("---------------");

for (const file of jsonFiles) {
  try {
    JSON.parse(
      readFileSync(file, "utf8")
    );

    console.log(
      `✓ Valid JSON: ${file}`
    );
  } catch (error) {
    console.error(
      `✗ Invalid JSON: ${file}`
    );

    console.error(error.message);
    failed = true;
  }
}

const object = JSON.parse(
  readFileSync(
    "examples/coffee-machine/object.json",
    "utf8"
  )
);

console.log("");
console.log("Object model validation");
console.log("-----------------------");

function check(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
  } else {
    console.error(`✗ ${message}`);
    failed = true;
  }
}

check(
  object.protocolVersion === "0.1",
  "Protocol version is 0.1"
);

check(
  object.id?.startsWith("obj_"),
  "Object has ORYBIT internal ID"
);

check(
  Boolean(object.publicId),
  "Object has public ID"
);

check(
  Boolean(object.identity?.name),
  "Object has human-readable identity"
);

check(
  Array.isArray(object.carriers),
  "Object contains carrier collection"
);

check(
  object.carriers.some(
    (carrier) => carrier.type === "qr"
  ),
  "Demo object supports QR discovery"
);

check(
  Array.isArray(object.capabilities) &&
    object.capabilities.length > 0,
  "Object exposes capabilities"
);

console.log("");

if (failed) {
  console.error(
    "ORYBIT foundation check FAILED."
  );

  process.exit(1);
}

console.log(
  "ORYBIT foundation check PASSED."
);

console.log("");
console.log(
  "Protocol source -> PRESENT"
);
console.log(
  "Next validation -> TypeScript build and tests"
);
console.log("");
