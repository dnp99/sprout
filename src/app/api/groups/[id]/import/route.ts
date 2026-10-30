import { groupRequest } from "@/lib/groups/http";
import { importGroup, parseGroupImport, MAX_GROUP_IMPORT_BYTES } from "@/lib/groups/import";
import { GroupError, id } from "@/lib/groups/validation";

/** Bound the actual stream, including requests without Content-Length. */
async function importBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new GroupError("Missing import file.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_GROUP_IMPORT_BYTES + 1_000_000) {
      await reader.cancel();
      throw new GroupError("Import request too large.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new GroupError("Invalid import request.");
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return groupRequest(request, async (userId) =>
    importGroup(userId, id((await params).id), parseGroupImport(await importBody(request))),
  );
}

export const maxDuration = 60;
