import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { getObjectBuffer } from "../../routes/aws.js";
import { getVectorStore } from "./vector.store.js";
import { Resource } from "../../db/db.js";

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100
});

async function ingestResource(resource) {
    const result = {
        resourceId: resource._id?.toString(),
        success: false,
        chunksAdded: 0,
        error: null
    };

    try {
        const parsed = await getParsedFromResource(resource);

        const isValid =
            (typeof parsed === "string" && parsed.trim().length > 0) ||
            (Array.isArray(parsed) && parsed.length > 0);

        if (!isValid) {
            throw new Error("Empty or invalid parsed content");
        }

        const chunks = await chunk(parsed, resource);

        if (!Array.isArray(chunks) || chunks.length === 0) {
            throw new Error("No chunks generated from resource");
        }

        await embedAndStore(chunks);

        await Resource.findByIdAndUpdate(resource._id, {
            isEmbedded: true
        });

        result.success = true;
        result.chunksAdded = chunks.length;

    } catch (error) {
        result.error = error?.message || String(error);
        console.error(`Failed to ingest resource ${resource._id}:`, error);
    }

    return result;
}

async function getParsedFromResource(resource) {
    if (typeof resource.content === "string" && resource.content.trim().length > 0) {
        return resource.content;
    }

    if (!resource.AWSKey) {
        throw new Error("No content or AWSKey found on resource");
    }

    const buffer = await fetchFromS3(resource.AWSKey);
    const extension = getFileExtension(resource.AWSKey);

    return await parseFile(buffer, extension);
}

async function fetchFromS3(key) {
    return await getObjectBuffer(key);
}

function getFileExtension(key) {
    const parts = key.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

async function parseFile(buffer, ext) {
    switch (ext) {
        case "pdf":
            return await parsePDF(buffer);

        case "docx":
        case "doc":
            return await parseDOCX(buffer);

        case "pptx":
        case "ppt":
            return await parsePPTX(buffer);

        case "txt":
        case "md":
            return buffer.toString("utf-8");

        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }
}

async function parsePDF(buffer) {
    const blob = new Blob([buffer], { type: "application/pdf" });
    const loader = new PDFLoader(blob, { splitPages: true });
    const docs = await loader.load();
    return docs.map((doc, index) => ({
        text: doc.pageContent,
        pageNumber: doc.metadata?.loc?.pageNumber ?? index + 1
    }));
}

async function parseDOCX(buffer) {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const loader = new DocxLoader(blob);
    const docs = await loader.load();
    return docs.map((doc) => doc.pageContent).join("\n\n");
}

async function parsePPTX(buffer) {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    const loader = new PPTXLoader(blob);
    const docs = await loader.load();
    return docs.map((doc) => doc.pageContent).join("\n\n");
}

function cleanText(text) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
async function chunk(parsed, resource) {
    const baseMetadata = {
        resourceId: resource._id?.toString(),
        name: resource.name || resource.title || "Untitled",
        dataType: resource.dataType || "unknown",
        courseIds: Array.isArray(resource.courseIds)
            ? resource.courseIds.map((id) => id.toString())
            : []
    };

    let documents = [];

    if (Array.isArray(parsed)) {
        // PDFs (with page numbers)
        for (const page of parsed) {
            const cleaned = cleanText(page.text);

            const splits = await splitter.splitText(cleaned);

            let cursor = 0;

            splits.forEach((chunkText, index) => {
                const start = cursor;
                const end = start + chunkText.length;

                documents.push({
                    pageContent: chunkText,
                    metadata: {
                        ...baseMetadata,
                        pageNumber: page.pageNumber,
                        chunkIndex: index,
                        startChar: start,
                        endChar: end
                    }
                });

                // move cursor forward WITH overlap adjustment
                cursor = end - splitter.chunkOverlap;
            });
        }
    } else {
        // Non-PDFs
        const cleaned = cleanText(parsed);

        documents = await splitter.createDocuments(
            [cleaned],
            [baseMetadata]
        );
    }

    return documents;
}

async function embedAndStore(chunks) {
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);
}

export { ingestResource };
