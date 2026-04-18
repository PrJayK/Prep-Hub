const IMAGE_EXTENSIONS = [
	"png",
	"jpg",
	"jpeg",
	"webp",
	"gif",
	"bmp",
	"svg",
	"avif",
];

function getFileExtension(value = "") {
	const sanitized = value.split("?")[0].split("#")[0];
	const parts = sanitized.split(".");
	return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getViewerType(resource = {}) {
	if (resource.dataType === "text" || resource.type === "text") {
		return "text";
	}

	const extension =
		getFileExtension(resource.name) || getFileExtension(resource.AWSKey);

	if (extension === "pdf") {
		return "pdf";
	}

	if (IMAGE_EXTENSIONS.includes(extension)) {
		return "image";
	}

	return "unsupported";
}

export { getViewerType };
