import "server-only";

import path from "path";
import { inflateRawSync, inflateSync } from "zlib";

export type ParsedKnowledgeFile = {
  text: string;
  parser: string;
};

export type KnowledgeParserLimits = {
  maxZipEntries: number;
  maxDecompressedBytes: number;
};

type ZipEntry = {
  name: string;
  compression: number;
  compressedSize: number;
  uncompressedSize: number;
  dataOffset: number;
};

const defaultParserLimits: KnowledgeParserLimits = {
  maxZipEntries: 300,
  maxDecompressedBytes: 200 * 1024 * 1024,
};

export function parseKnowledgeFile(
  buffer: Buffer,
  name: string,
  mimeType: string,
  limits: KnowledgeParserLimits = defaultParserLimits
): ParsedKnowledgeFile {
  const ext = path.extname(name).toLowerCase();

  if (isTextLike(ext, mimeType)) {
    return {
      text: normalizeText(buffer.toString("utf8")),
      parser: "text",
    };
  }

  if (ext === ".docx") {
    return {
      text: normalizeText(parseDocx(buffer, limits)),
      parser: "docx",
    };
  }

  if (ext === ".xlsx" || ext === ".xlsm") {
    return {
      text: normalizeText(parseXlsx(buffer, limits)),
      parser: "xlsx",
    };
  }

  if (ext === ".pdf") {
    return {
      text: normalizeText(parsePdfBestEffort(buffer)),
      parser: "pdf-best-effort",
    };
  }

  return {
    text: "",
    parser: "unsupported",
  };
}

export function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isTextLike(ext: string, mimeType: string) {
  return mimeType.startsWith("text/") || [".txt", ".md", ".csv", ".json", ".html", ".xml", ".log"].includes(ext);
}

function parseDocx(buffer: Buffer, limits: KnowledgeParserLimits) {
  const entries = readZipEntries(buffer, limits);
  const files = [
    "word/document.xml",
    ...[...entries.keys()].filter((name) => /^word\/(header|footer|footnotes|endnotes)\d*\.xml$/.test(name)),
  ];

  return files
    .map((file) => entries.get(file))
    .filter((entry): entry is Buffer => Boolean(entry))
    .map((entry) => xmlToText(entry.toString("utf8"), { paragraphTag: "w:p", tabTag: "w:tab" }))
    .join("\n\n");
}

function parseXlsx(buffer: Buffer, limits: KnowledgeParserLimits) {
  const entries = readZipEntries(buffer, limits);
  const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "");
  const worksheetNames = [...entries.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();

  return worksheetNames
    .map((sheetName, sheetIndex) => {
      const sheetXml = entries.get(sheetName)?.toString("utf8") ?? "";
      const rows = parseWorksheet(sheetXml, sharedStrings);
      return [`Sheet ${sheetIndex + 1}`, ...rows].join("\n");
    })
    .join("\n\n");
}

function parsePdfBestEffort(buffer: Buffer) {
  const binary = buffer.toString("latin1");
  const streamTexts: string[] = [];
  const streamPattern = /<<(.*?)>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  let streamMatch: RegExpExecArray | null;

  while ((streamMatch = streamPattern.exec(binary))) {
    const dictionary = streamMatch[1];
    const raw = Buffer.from(streamMatch[2], "latin1");
    const inflated = dictionary.includes("/FlateDecode") ? tryInflate(raw) : raw;

    if (inflated) {
      streamTexts.push(extractPdfTextOperators(inflated.toString("latin1")));
    }
  }

  streamTexts.push(extractPdfTextOperators(binary));
  return streamTexts.filter(Boolean).join("\n");
}

function tryInflate(raw: Buffer) {
  const candidates = [raw, trimPdfStream(raw)];

  for (const candidate of candidates) {
    try {
      return inflateSync(candidate);
    } catch {
      try {
        return inflateRawSync(candidate);
      } catch {
        // Try the next representation.
      }
    }
  }

  return null;
}

function trimPdfStream(buffer: Buffer) {
  let start = 0;
  let end = buffer.length;

  while (start < end && (buffer[start] === 0x0a || buffer[start] === 0x0d)) start += 1;
  while (end > start && (buffer[end - 1] === 0x0a || buffer[end - 1] === 0x0d)) end -= 1;

  return buffer.subarray(start, end);
}

function extractPdfTextOperators(content: string) {
  const parts: string[] = [];
  const textOperatorPattern = /(\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>|\[(?:[^\]]|\][^\sTJ])*\])\s*(?:Tj|TJ|')/g;
  let match: RegExpExecArray | null;

  while ((match = textOperatorPattern.exec(content))) {
    const token = match[1];

    if (token.startsWith("[")) {
      parts.push(...extractPdfArrayStrings(token));
    } else {
      parts.push(decodePdfString(token));
    }
  }

  return parts.join(" ");
}

function extractPdfArrayStrings(token: string) {
  const strings: string[] = [];
  const stringPattern = /\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>/g;
  let match: RegExpExecArray | null;

  while ((match = stringPattern.exec(token))) {
    strings.push(decodePdfString(match[0]));
  }

  return strings;
}

function decodePdfString(token: string) {
  if (token.startsWith("<")) {
    return decodePdfHexString(token);
  }

  const inner = token.slice(1, -1);

  return inner.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_match, value: string) => {
    if (/^[0-7]+$/.test(value)) {
      return String.fromCharCode(parseInt(value, 8));
    }

    const escapes: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\",
    };

    return escapes[value] ?? value;
  });
}

function decodePdfHexString(token: string) {
  const hex = token.slice(1, -1).replace(/\s+/g, "");
  if (!hex) return "";

  const padded = hex.length % 2 === 0 ? hex : `${hex}0`;
  const bytes = Buffer.from(padded, "hex");

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const chars: string[] = [];

    for (let i = 2; i + 1 < bytes.length; i += 2) {
      chars.push(String.fromCharCode(bytes.readUInt16BE(i)));
    }

    return chars.join("");
  }

  return bytes.toString("latin1");
}

function parseSharedStrings(xml: string) {
  const strings: string[] = [];
  const itemPattern = /<si[\s\S]*?<\/si>/g;
  const items = xml.match(itemPattern) ?? [];

  for (const item of items) {
    strings.push(xmlToText(item, { paragraphTag: "r", tabTag: "t" }).replace(/\n/g, ""));
  }

  return strings;
}

function parseWorksheet(xml: string, sharedStrings: string[]) {
  const rows: string[] = [];
  const rowPattern = /<row\b[\s\S]*?<\/row>/g;
  const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  const rowMatches = xml.match(rowPattern) ?? [];

  for (const rowXml of rowMatches) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellPattern.exec(rowXml))) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const type = /t="([^"]+)"/.exec(attributes)?.[1];
      const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      const inlineString = /<is>([\s\S]*?)<\/is>/.exec(body)?.[1];

      if (type === "s") {
        cells.push(sharedStrings[Number(value)] ?? "");
      } else if (type === "inlineStr" && inlineString) {
        cells.push(xmlToText(inlineString, { paragraphTag: "r", tabTag: "t" }).replace(/\n/g, ""));
      } else {
        cells.push(decodeXml(value));
      }
    }

    const line = cells.map((cell) => cell.trim()).filter(Boolean).join(" | ");
    if (line) {
      rows.push(line);
    }
  }

  return rows;
}

function xmlToText(xml: string, { paragraphTag, tabTag }: { paragraphTag: string; tabTag: string }) {
  return decodeXml(
    xml
      .replace(new RegExp(`<${tabTag}[^>]*/>`, "g"), "\t")
      .replace(new RegExp(`</${paragraphTag}>`, "g"), "\n")
      .replace(/<[^>]+>/g, "")
  );
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function readZipEntries(buffer: Buffer, limits: KnowledgeParserLimits) {
  const entries = new Map<string, Buffer>();
  const directoryOffset = findEndOfCentralDirectory(buffer);
  let offset = directoryOffset;
  let entryCount = 0;
  let totalDecompressedBytes = 0;

  while (offset + 4 <= buffer.length && buffer.readUInt32LE(offset) === 0x02014b50) {
    if (offset + 46 > buffer.length) {
      throw new Error("Office document structure is incomplete");
    }

    entryCount += 1;
    if (entryCount > limits.maxZipEntries) {
      throw new Error("Office document has too many internal files");
    }

    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameEnd = offset + 46 + fileNameLength;
    if (nameEnd > buffer.length) {
      throw new Error("Office document structure is incomplete");
    }

    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8").replace(/\\/g, "/");

    const entry: ZipEntry = {
      name,
      compression,
      compressedSize,
      uncompressedSize,
      dataOffset: getLocalDataOffset(buffer, localHeaderOffset),
    };

    const remainingBytes = limits.maxDecompressedBytes - totalDecompressedBytes;
    const content = readZipEntry(buffer, entry, remainingBytes);
    totalDecompressedBytes += content.byteLength;

    if (totalDecompressedBytes > limits.maxDecompressedBytes) {
      throw new Error("Office document is too large after decompression");
    }

    entries.set(name, content);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return buffer.readUInt32LE(offset + 16);
    }
  }

  throw new Error("Unable to read Office document structure");
}

function getLocalDataOffset(buffer: Buffer, localHeaderOffset: number) {
  if (localHeaderOffset < 0 || localHeaderOffset + 30 > buffer.length) {
    throw new Error("Office document structure is incomplete");
  }

  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error("Office document structure is incomplete");
  }

  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);

  const dataOffset = localHeaderOffset + 30 + fileNameLength + extraLength;
  if (dataOffset > buffer.length) {
    throw new Error("Office document structure is incomplete");
  }

  return dataOffset;
}

function readZipEntry(buffer: Buffer, entry: ZipEntry, maxOutputBytes: number) {
  if (maxOutputBytes <= 0 || entry.uncompressedSize > maxOutputBytes) {
    throw new Error("Office document is too large after decompression");
  }

  if (entry.dataOffset + entry.compressedSize > buffer.length) {
    throw new Error("Office document structure is incomplete");
  }

  const compressed = buffer.subarray(entry.dataOffset, entry.dataOffset + entry.compressedSize);

  if (entry.compression === 0) {
    if (compressed.byteLength > maxOutputBytes) {
      throw new Error("Office document is too large after decompression");
    }

    return compressed;
  }

  if (entry.compression === 8) {
    const inflated = inflateRawSync(compressed, { maxOutputLength: maxOutputBytes });
    return entry.uncompressedSize ? inflated.subarray(0, entry.uncompressedSize) : inflated;
  }

  return Buffer.alloc(0);
}
