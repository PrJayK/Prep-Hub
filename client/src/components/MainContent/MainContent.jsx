/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";
import {
	BookOpen,
	FileText,
	ScrollText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import ResourceViewer from "@/components/ResourceViewer/ResourceViewer";
import { getViewerType } from "@/components/ResourceViewer/resourceViewer.utils";

import AddCoursePane from "../AddCoursePane/AddCoursePane";
import { BACKEND_URL } from "@/config/env";

const tabBase =
	"flex h-full cursor-pointer items-center border-b-2 border-transparent px-5 text-sm font-medium text-foreground/65 transition-colors hover:text-foreground sm:px-8";

const MainContent = (args) => {
	const [content, setContent] = useState("pyqs");
	const [viewer, setViewer] = useState({
		open: false,
		loading: false,
		error: "",
		name: "",
		key: "",
		resourceId: "",
		url: "",
		content: "",
		type: "unsupported",
		pageNumber: 1,
		scale: 1,
		highlightPageNumber: null,
		highlightStartChar: null,
		highlightEndChar: null,
	});

	const sortedPYQs = (args.selectedCourse?.PYQs ?? [])
		.slice()
		.sort((a, b) =>
			new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
		);

	const sortedResources = (args.selectedCourse?.resources ?? [])
		.slice()
		.sort((a, b) =>
			new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
		);

	function handlePYQSOnClick() {
		setContent("pyqs");
	}

	function handleResourcesOnClick() {
		setContent("resources");
	}

	function closeViewer() {
		setViewer({
			open: false,
			loading: false,
			error: "",
			name: "",
			key: "",
			resourceId: "",
			url: "",
			content: "",
			type: "unsupported",
			pageNumber: 1,
			scale: 1,
			highlightPageNumber: null,
			highlightStartChar: null,
			highlightEndChar: null,
		});
	}

	function openViewerForResource(resource) {
		openViewerForResourceAtPage(resource, 1);
	}

	function openViewerForResourceAtPage(resource, pageNumber = 1) {
		const viewerType = getViewerType(resource);

		setViewer({
			open: true,
			loading: true,
			error: "",
			name: resource.name || "Resource",
			key: resource.AWSKey || "",
			resourceId: resource._id || "",
			url: "",
			content: resource.content || "",
			type: viewerType,
			pageNumber: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
			scale: 1,
			highlightPageNumber: null,
			highlightStartChar: null,
			highlightEndChar: null,
		});

		if (viewerType === "text") {
			setViewer((currentViewer) => ({
				...currentViewer,
				loading: false,
			}));
			return;
		}

		axios
			.post(
				`${BACKEND_URL}/api/aws/getObjectUrl`,
				{ key: resource.AWSKey },
				{ withCredentials: true }
			)
			.then((res) => {
				setViewer((currentViewer) => ({
					...currentViewer,
					loading: false,
					url: res.data.url,
				}));
			})
			.catch(() => {
				setViewer((currentViewer) => ({
					...currentViewer,
					loading: false,
					error: "We couldn't fetch a temporary URL for this file.",
				}));
			});
	}

	function handleZoomIn() {
		setViewer((currentViewer) => ({
			...currentViewer,
			scale: Math.min(currentViewer.scale + 0.25, currentViewer.type === "image" ? 3 : 2.5),
		}));
	}

	function handleZoomOut() {
		setViewer((currentViewer) => ({
			...currentViewer,
			scale: Math.max(currentViewer.scale - 0.25, currentViewer.type === "image" ? 0.5 : 0.75),
		}));
	}

	function handleResetZoom() {
		setViewer((currentViewer) => ({
			...currentViewer,
			scale: 1,
		}));
	}

	function handleOpenInNewTab() {
		if (!viewer.key) {
			return;
		}

		axios
			.post(
				`${BACKEND_URL}/api/aws/getObjectUrl`,
				{ key: viewer.key },
				{ withCredentials: true }
			)
			.then((res) => {
				window.open(res.data.url, "_blank", "noopener,noreferrer");
			})
			.catch(() => {
				setViewer((currentViewer) => ({
					...currentViewer,
					error: "We couldn't fetch a fresh URL to open this file in a new tab.",
				}));
			});
	}

	function handleAskAboutThis() {
		if (!viewer.resourceId) {
			return;
		}

		args.onAskAboutResource?.({
			_id: viewer.resourceId,
			name: viewer.name,
		});
	}

	useEffect(() => {
		args.onViewerOpenChange?.(viewer.open);

		return () => {
			args.onViewerOpenChange?.(false);
		};
	}, [args.onViewerOpenChange, viewer.open]);

	useEffect(() => {
		const sourceRequest = args.sourceRequest;
		if (!sourceRequest?.resourceId) {
			return;
		}

		const matchedCourse = args.enrolledCourses.find((course) => {
			const allResources = [...(course?.resources ?? []), ...(course?.PYQs ?? [])];
			return allResources.some((resource) => resource?._id === sourceRequest.resourceId);
		});

		if (!matchedCourse) {
			return;
		}

		const matchedResource = [...(matchedCourse.resources ?? []), ...(matchedCourse.PYQs ?? [])]
			.find((resource) => resource?._id === sourceRequest.resourceId);

		if (!matchedResource) {
			return;
		}

		args.setSelectedCourse?.(matchedCourse);
		if ((matchedCourse.resources ?? []).some((resource) => resource?._id === sourceRequest.resourceId)) {
			setContent("resources");
		} else if ((matchedCourse.PYQs ?? []).some((resource) => resource?._id === sourceRequest.resourceId)) {
			setContent("pyqs");
		}

		openViewerForResourceAtPage(
			matchedResource,
			Number.isInteger(sourceRequest.page) ? sourceRequest.page : 1
		);
	}, [args.enrolledCourses, args.setSelectedCourse, args.sourceRequest]);

	return (
		<>
			{args.addCoursesButton ? (
				<div className="h-full min-h-0 min-w-0 flex-1 overflow-auto">
					<AddCoursePane
						setEnrolledCourses={args.setEnrolledCourses}
						enrolledCourses={args.enrolledCourses}
					/>
				</div>
			) : (
				<div className="h-full min-h-0 min-w-0 flex-1 overflow-auto bg-background/30">
					{args.enrolledCourses.length === 0 ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<BookOpen className="h-8 w-8" strokeWidth={1.75} />
							</div>
							<div>
								<p className="text-lg font-semibold text-foreground">
									No courses yet
								</p>
								<p className="mt-1 max-w-md text-sm text-foreground/70">
									Enroll in a course to access PYQs and study resources.
								</p>
							</div>
						</div>
					) : null}
					{args.selectedCourse ? (
						<>
							<div
								className="flex h-14 shrink-0 items-stretch border-b border-border bg-background/60 backdrop-blur-sm"
								role="tablist"
							>
								<button
									type="button"
									role="tab"
									aria-selected={content === "pyqs"}
									className={cn(
										tabBase,
										content === "pyqs" &&
											"border-primary text-foreground font-semibold"
									)}
									id="PYQS-controller"
									onClick={handlePYQSOnClick}
								>
									PYQs
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={content === "resources"}
									className={cn(
										tabBase,
										content === "resources" &&
											"border-primary text-foreground font-semibold"
									)}
									id="Resources-controller"
									onClick={handleResourcesOnClick}
								>
									Resources
								</button>
							</div>
							<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
								{content === "pyqs" && (
									<div className="space-y-4" id="pyqs-container">
										{sortedPYQs.length === 0 ? (
											<div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
												<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
													<FileText className="h-8 w-8" strokeWidth={1.75} />
												</div>
												<div>
													<p className="text-lg font-semibold text-foreground">
														No PYQs yet
													</p>
												</div>
											</div>
										) : (
											sortedPYQs.map((pyq, index) => (
												<div
													key={pyq._id || index}
													className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/45 hover:shadow-md"
													onClick={() => openViewerForResource(pyq)}
												>
													<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
														<FileText className="h-5 w-5" strokeWidth={1.75} />
													</div>
													<div className="min-w-0 flex-1 font-medium text-foreground">
														{pyq.name}
													</div>
												</div>
											))
										)}
									</div>
								)}
								{content === "resources" && (
									<div className="space-y-4" id="resources-container">
										{sortedResources.length === 0 ? (
											<div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
												<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
													<BookOpen className="h-8 w-8" strokeWidth={1.75} />
												</div>
												<div>
													<p className="text-lg font-semibold text-foreground">
														No resources yet
													</p>
												</div>
											</div>
										) : (
											sortedResources.map((resource, index) => (
												<div key={resource._id || index}>
													{resource.dataType === "text" ? (
														<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/35">
															<div className="flex items-center gap-3 border-b border-border px-4 py-4">
																<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
																	<ScrollText
																		className="h-6 w-6 text-primary/75"
																		strokeWidth={1.75}
																		aria-hidden="true"
																	/>
																</div>
																<div className="min-w-0 flex-1 font-medium text-foreground">
																	{resource.name}
																</div>
															</div>
															<div className="px-4 py-5">
																<p className="text-sm leading-relaxed text-foreground/85">
																	<pre className="whitespace-pre-wrap font-sans">
																		{resource.content}
																	</pre>
																</p>
															</div>
														</div>
													) : null}
													{console.log(resource)}
													{resource.dataType === "application/pdf" ? (
														<div
															className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/45 hover:shadow-md"
															onClick={() => openViewerForResource(resource)}
														>
															<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
																<FileText
																	className="h-5 w-5"
																	strokeWidth={1.75}
																/>
															</div>
															<div className="min-w-0 flex-1 font-medium text-foreground">
																{resource.name}
															</div>
														</div>
													) : null}
												</div>
											))
										)}
									</div>
								)}
							</div>
						</>
					) : null}
				</div>
			)}
			<ResourceViewer
				viewer={viewer}
				onClose={closeViewer}
				onAskAboutThis={handleAskAboutThis}
				onOpenInNewTab={handleOpenInNewTab}
				onZoomIn={handleZoomIn}
				onZoomOut={handleZoomOut}
				onResetZoom={handleResetZoom}
			/>
		</>
	);
};

export default MainContent;
