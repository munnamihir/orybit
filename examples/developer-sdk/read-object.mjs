import {
  OrybitClient
} from "../../sdk/dist/index.js";

const baseUrl =
  process.env.ORYBIT_BASE_URL;
const apiKey =
  process.env.ORYBIT_API_KEY;
const publicId =
  process.env.ORYBIT_PUBLIC_ID;

if (!baseUrl || !apiKey || !publicId) {
  console.error(
    "Set ORYBIT_BASE_URL, ORYBIT_API_KEY, and ORYBIT_PUBLIC_ID before running this example."
  );
  process.exit(1);
}

const orybit = new OrybitClient({
  baseUrl,
  apiKey
});

const [
  developer,
  object,
  manifest,
  capabilities
] = await Promise.all([
  orybit.developer.me(),
  orybit.objects.get(publicId),
  orybit.manifests.get(publicId),
  orybit.capabilities.list(publicId)
]);

console.log(
  JSON.stringify(
    {
      developer,
      object,
      manifest,
      capabilities
    },
    null,
    2
  )
);
