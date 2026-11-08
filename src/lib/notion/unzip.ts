import { unzip, type Unzipped } from "fflate";

// Notion splits big exports into zips inside the zip; this opens them all
// into one map of path → bytes. Only what the importer reads is kept.

const WANTED = /\.(md|csv|png|jpe?g|gif|webp|zip)$/i;

function open(data: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) =>
    unzip(data, { filter: (file) => WANTED.test(file.name) }, (error, files) => (error ? reject(error) : resolve(files))),
  );
}

export async function unzipExport(data: Uint8Array, depth = 0): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  for (const [name, bytes] of Object.entries(await open(data))) {
    if (name.endsWith("/")) continue;
    if (/\.zip$/i.test(name)) {
      if (depth < 2) for (const [inner, b] of await unzipExport(bytes, depth + 1)) files.set(inner, b);
      continue;
    }
    files.set(name.normalize("NFC"), bytes);
  }
  return files;
}
