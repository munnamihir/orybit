import {
  describe,
  expect,
  it
} from "vitest";

import {
  publicObjectPath,
  publicObjectQrDataUrl,
  publicObjectUrl
} from "./public-object";

describe(
  "public object helpers",
  () => {
    it(
      "builds a stable public object path",
      () => {
        expect(
          publicObjectPath(
            "tool demo/001"
          )
        ).toBe(
          "/o/tool%20demo%2F001"
        );
      }
    );

    it(
      "builds an origin-scoped public URL",
      () => {
        expect(
          publicObjectUrl(
            "https://orybit.example",
            "demo-001"
          )
        ).toBe(
          "https://orybit.example/o/demo-001"
        );
      }
    );

    it(
      "generates QR data locally",
      () => {
        const value =
          publicObjectQrDataUrl(
            "https://orybit.example",
            "demo-001"
          );

        expect(value).toMatch(
          /^data:image\/gif;base64,/
        );
      }
    );
  }
);
