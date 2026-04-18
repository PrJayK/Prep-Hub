/* eslint-disable react/prop-types */
import { useEffect, useMemo } from "react";
import {
	ExternalLink,
	LoaderCircle,
	MessageSquare,
	RotateCcw,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const PDFJS_VIEWER_PATH = "/pdfjs/web/viewer.html";

function buildPdfViewerSrc(fileUrl, pageNumber) {
	if (!fileUrl) {
		return "";
	}

	const pageHash =
		Number.isInteger(pageNumber) && pageNumber > 0 ? `#page=${pageNumber}` : "";
	const queryParams = new URLSearchParams({
		file: fileUrl,
	});

	return `${PDFJS_VIEWER_PATH}?${queryParams.toString()}${pageHash}`;
}

function ResourceViewer({
	viewer,
	onClose,
	onAskAboutThis,
	onOpenInNewTab,
	onZoomIn,
	onZoomOut,
	onResetZoom,
}) {
	const pdfViewerSrc = useMemo(
		() =>
			viewer.type === "pdf" && viewer.url
				? buildPdfViewerSrc(viewer.url, viewer.pageNumber)
				: "",
		[viewer.pageNumber, viewer.type, viewer.url]
	);

	useEffect(() => {
		if (!viewer.open) {
			return undefined;
		}

		function handleKeyDown(event) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [viewer.open, onClose]);

	if (!viewer.open) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
			onClick={onClose}
			role="presentation"
		>
			<div
				className="relative flex h-[min(92vh,980px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-background shadow-2xl"
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label={viewer.name || "Resource viewer"}
			>
				<div className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 py-3">
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-foreground">
							{viewer.name || "Resource"}
						</p>
						<p className="text-xs text-foreground/60">
							{viewer.type === "pdf"
								? "PDF preview"
								: viewer.type === "image"
									? "Image preview"
									: viewer.type === "text"
										? "Text preview"
										: "Preview unavailable"}
						</p>
					</div>
					<div className="flex items-center gap-2">
						{viewer.url ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onOpenInNewTab}
								className="inline-flex items-center gap-1.5"
							>
								<ExternalLink className="h-4 w-4" />
								Open in new tab
							</Button>
						) : null}
						<Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
							<X className="h-4 w-4" />
							<span className="sr-only">Close viewer</span>
						</Button>
					</div>
				</div>

				<div className="min-h-0 flex-1 overflow-auto bg-muted/20">
					{viewer.loading ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-foreground/70">
							<LoaderCircle className="h-8 w-8 animate-spin" />
							<p className="text-sm">Loading preview...</p>
						</div>
					) : null}

					{!viewer.loading && viewer.error ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
							<p className="text-base font-semibold text-foreground">
								Couldn&apos;t load this file preview
							</p>
							<p className="max-w-md text-sm text-foreground/70">{viewer.error}</p>
						</div>
					) : null}

					{!viewer.loading &&
					!viewer.error &&
					viewer.type === "pdf" &&
					viewer.url ? (
						<div className="flex h-full min-h-[320px] flex-col">
							<iframe
								key={pdfViewerSrc}
								src={pdfViewerSrc}
								title={viewer.name || "PDF preview"}
								className="h-full w-full flex-1 border-0 bg-background"
							/>
						</div>
					) : null}

					{!viewer.loading &&
					!viewer.error &&
					viewer.type === "image" &&
					viewer.url ? (
						<div className="flex h-full min-h-[320px] flex-col">
							<div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-sm">
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									onClick={onZoomOut}
									disabled={viewer.scale <= 0.5}
								>
									<ZoomOut className="h-4 w-4" />
									<span className="sr-only">Zoom out</span>
								</Button>
								<span className="min-w-16 text-center text-sm text-foreground/75">
									{Math.round(viewer.scale * 100)}%
								</span>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									onClick={onZoomIn}
									disabled={viewer.scale >= 3}
								>
									<ZoomIn className="h-4 w-4" />
									<span className="sr-only">Zoom in</span>
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									onClick={onResetZoom}
								>
									<RotateCcw className="h-4 w-4" />
									<span className="sr-only">Reset zoom</span>
								</Button>
							</div>
							<div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
								<img
									src={viewer.url}
									alt={viewer.name || "Preview"}
									className="max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
									style={{ transform: `scale(${viewer.scale})` }}
								/>
							</div>
						</div>
					) : null}

					{!viewer.loading &&
					!viewer.error &&
					viewer.type === "text" ? (
						<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
							<div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
								<pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground/85">
									{viewer.content || "No text content available for this resource."}
								</pre>
							</div>
						</div>
					) : null}

					{!viewer.loading &&
					!viewer.error &&
					viewer.type === "unsupported" &&
					viewer.url ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
							<p className="text-base font-semibold text-foreground">
								Preview isn&apos;t available for this file type yet
							</p>
							<p className="max-w-md text-sm text-foreground/70">
								You can still open it in a new tab using the link above.
							</p>
						</div>
					) : null}
				</div>
				{viewer.resourceId && onAskAboutThis ? (
					<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-4">
						<button
							type="button"
							onClick={onAskAboutThis}
							className="pointer-events-auto inline-flex cursor-pointer items-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_40px_rgba(59,130,246,0.18)] transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
						>
							<MessageSquare className="h-5 w-5" />
							<span>Ask about this</span>
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
}

export default ResourceViewer;
