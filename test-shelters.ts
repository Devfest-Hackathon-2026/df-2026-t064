import { loadShelters } from "./src/lib/shelters";

async function main() {
  const shelters = await loadShelters();

  console.log("全国の避難場所数:", shelters.length);
  console.log("最初の避難場所:", shelters[0]);
}

main().catch(console.error);