import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
	ArrowLeft,
	CheckCircle2,
	ExternalLink,
	FileText,
	Filter,
	Hourglass,
	Loader2,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	Unlink,
} from "lucide-react";

import Navbar from "@/components/Navbar/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { BACKEND_URL } from "@/config/env";
import { useToast } from "@/components/ui/toast-provider";

const resourceTypes = ["all", "resources", "pyqs"];
const embeddingStates = ["all", "embedded", "waiting"];

function formatDate(value) {
	if (!value) {
		return "No upload date";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "No upload date";
	}

	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function getPrimaryType(resource) {
	const firstType = resource.linkedCourses?.[0]?.resourceType;
	return firstType === "pyqs" ? "pyqs" : "resources";
}

function matchesType(resource, typeFilter) {
	if (typeFilter === "all") {
		return true;
	}

	return resource.linkedCourses?.some((course) => course.resourceType === typeFilter);
}

const AdminResources = () => {
	const navigate = useNavigate();
	const { toast } = useToast();

	const [user, setUser] = useState(null);
	const [resources, setResources] = useState([]);
	const [selectedId, setSelectedId] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("all");
	const [embeddingFilter, setEmbeddingFilter] = useState("all");
	const [renameDraft, setRenameDraft] = useState("");
	const [courseQuery, setCourseQuery] = useState("");
	const [courseResults, setCourseResults] = useState([]);
	const [addResourceType, setAddResourceType] = useState("resources");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteFileFromStorage, setDeleteFileFromStorage] = useState(false);
	const [isLoadingResources, setIsLoadingResources] = useState(true);
	const [isSearchingCourses, setIsSearchingCourses] = useState(false);
	const [busyAction, setBusyAction] = useState("");

	const selectedResource = resources.find((resource) => resource._id === selectedId) || null;

	const filteredResources = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return resources.filter((resource) => {
			const searchableText = [
				resource.name,
				resource.AWSKey,
				...(resource.linkedCourses || []).flatMap((course) => [course.id, course.name, course.branch]),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
			const matchesEmbedding =
				embeddingFilter === "all" ||
				(embeddingFilter === "embedded" && resource.isEmbedded) ||
				(embeddingFilter === "waiting" && !resource.isEmbedded);

			return matchesSearch && matchesType(resource, typeFilter) && matchesEmbedding;
		});
	}, [embeddingFilter, resources, searchQuery, typeFilter]);

	const courseMatches = useMemo(() => {
		return courseResults.filter((course) => {
			return !selectedResource?.linkedCourses?.some((linkedCourse) => linkedCourse._id === course._id);
		});
	}, [courseResults, selectedResource]);

	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/me`, { withCredentials: true })
			.then((res) => setUser(res.data))
			.catch(() => {
				navigate("/", { replace: true });
			});
	}, [navigate]);

	useEffect(() => {
		loadResources();
	}, []);

	useEffect(() => {
		if (!selectedResource && filteredResources.length > 0) {
			setSelectedId(filteredResources[0]._id);
		}
	}, [filteredResources, selectedResource]);

	useEffect(() => {
		setRenameDraft(selectedResource?.name || "");
		setCourseQuery("");
		setCourseResults([]);
		setAddResourceType("resources");
	}, [selectedResource?._id, selectedResource?.name]);

	async function loadResources(nextSelectedId = selectedId) {
		setIsLoadingResources(true);

		try {
			const response = await axios.get(`${BACKEND_URL}/api/admin/resources`, {
				withCredentials: true,
			});

			const items = response.data;
			setResources(items);

			if (items.length === 0) {
				setSelectedId("");
				return;
			}

			const hasSelected = items.some((resource) => resource._id === nextSelectedId);
			setSelectedId(hasSelected ? nextSelectedId : items[0]._id);
		} catch (error) {
			toast({
				title: "Couldn't load resources",
				description: error.response?.data?.message || "The resource list could not be fetched.",
			});
		} finally {
			setIsLoadingResources(false);
		}
	}

	function mergeResource(updatedResource) {
		setResources((current) =>
			current.map((resource) => (resource._id === updatedResource._id ? updatedResource : resource))
		);
	}

	async function saveRename() {
		const nextName = renameDraft.trim();

		if (!selectedResource || !nextName) {
			return;
		}

		setBusyAction("rename");

		try {
			const response = await axios.patch(
				`${BACKEND_URL}/api/admin/resources/${selectedResource._id}`,
				{ name: nextName },
				{ withCredentials: true }
			);

			mergeResource(response.data);
			toast({
				title: "Resource renamed",
				description: "The display name was updated.",
			});
		} catch (error) {
			toast({
				title: "Rename failed",
				description: error.response?.data?.message || "We couldn't rename that resource.",
			});
		} finally {
			setBusyAction("");
		}
	}

	async function searchCourses(event) {
		event.preventDefault();
		const query = courseQuery.trim();

		if (!query) {
			setCourseResults([]);
			return;
		}

		setIsSearchingCourses(true);

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/queryCourses`,
				{ course_query: query, branch: "", semester: "" },
				{ withCredentials: true }
			);

			setCourseResults(response.data);
			if (response.data.length === 0) {
				toast({
					title: "No courses found",
					description: "Try a different course code or name.",
				});
			}
		} catch (error) {
			toast({
				title: "Course search failed",
				description: "We couldn't load matching courses right now.",
			});
		} finally {
			setIsSearchingCourses(false);
		}
	}

	async function addCourse(course) {
		if (!selectedResource) {
			return;
		}

		setBusyAction(`add-${course._id}`);

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/admin/resources/${selectedResource._id}/courses`,
				{ courseId: course._id, resourceType: addResourceType },
				{ withCredentials: true }
			);

			mergeResource(response.data);
			setCourseQuery("");
			setCourseResults([]);
			toast({
				title: "Course linked",
				description: `${course.id} was added as ${addResourceType === "pyqs" ? "PYQs" : "Resources"}.`,
			});
		} catch (error) {
			toast({
				title: "Link failed",
				description: error.response?.data?.message || "We couldn't link that course.",
			});
		} finally {
			setBusyAction("");
		}
	}

	async function removeCourse(courseId) {
		if (!selectedResource) {
			return;
		}

		setBusyAction(`remove-${courseId}`);

		try {
			const response = await axios.delete(
				`${BACKEND_URL}/api/admin/resources/${selectedResource._id}/courses/${courseId}`,
				{ withCredentials: true }
			);

			mergeResource(response.data);
			toast({
				title: "Course link removed",
				description: "The resource was removed from that course.",
			});
		} catch (error) {
			toast({
				title: "Remove failed",
				description: error.response?.data?.message || "We couldn't remove that course link.",
			});
		} finally {
			setBusyAction("");
		}
	}

	async function changeCourseType(courseId, resourceType) {
		if (!selectedResource) {
			return;
		}

		setBusyAction(`type-${courseId}`);

		try {
			const response = await axios.patch(
				`${BACKEND_URL}/api/admin/resources/${selectedResource._id}/courses/${courseId}`,
				{ resourceType },
				{ withCredentials: true }
			);

			mergeResource(response.data);
			toast({
				title: "Course link updated",
				description: `The resource now appears under ${resourceType === "pyqs" ? "PYQs" : "Resources"}.`,
			});
		} catch (error) {
			toast({
				title: "Update failed",
				description: error.response?.data?.message || "We couldn't update that course link.",
			});
		} finally {
			setBusyAction("");
		}
	}

	async function deleteSelectedResource() {
		if (!selectedResource) {
			return;
		}

		setBusyAction("delete");

		try {
			await axios.delete(`${BACKEND_URL}/api/admin/resources/${selectedResource._id}`, {
				params: { deleteFile: deleteFileFromStorage },
				withCredentials: true,
			});

			const nextResources = resources.filter((resource) => resource._id !== selectedResource._id);
			setResources(nextResources);
			setSelectedId(nextResources[0]?._id || "");
			setDeleteDialogOpen(false);
			setDeleteFileFromStorage(false);

			toast({
				title: "Resource deleted",
				description: deleteFileFromStorage
					? "The resource and stored file were removed."
					: "The resource was removed from all courses.",
			});
		} catch (error) {
			toast({
				title: "Delete failed",
				description: error.response?.data?.message || "We couldn't delete that resource.",
			});
		} finally {
			setBusyAction("");
		}
	}

	async function openResource() {
		if (!selectedResource?.AWSKey) {
			toast({
				title: "No file key",
				description: "This resource does not have a stored file key.",
			});
			return;
		}

		setBusyAction("open");

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/aws/getObjectUrl`,
				{ key: selectedResource.AWSKey },
				{ withCredentials: true }
			);

			window.open(response.data.url, "_blank", "noopener,noreferrer");
		} catch (error) {
			toast({
				title: "Couldn't open file",
				description: error.response?.data?.message || "We couldn't create a file link right now.",
			});
		} finally {
			setBusyAction("");
		}
	}

	return (
		<div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
			<Navbar user={user} />
			<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
				<Button
					type="button"
					variant="ghost"
					className="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
					onClick={() => navigate("/admin")}
				>
					<ArrowLeft className="size-4" />
					Back to admin
				</Button>

				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Manage resources</h1>
					<p className="text-sm text-muted-foreground sm:text-base">
						Review files, update course links, and remove resources from the catalog.
					</p>
				</div>

				<div className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
					<Card className="border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start justify-between gap-3">
								<div>
									<CardTitle>Resources</CardTitle>
									<CardDescription>
										{isLoadingResources ? "Loading resources..." : `${filteredResources.length} matching resource(s)`}
									</CardDescription>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => loadResources()}
									disabled={isLoadingResources}
									aria-label="Refresh resources"
								>
									<RefreshCw className={`size-4 ${isLoadingResources ? "animate-spin" : ""}`} />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4 py-4">
							<label className="space-y-2">
								<span className="text-sm font-medium text-foreground">Search</span>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										placeholder="Name, key, or course"
										className="h-10 bg-background pl-9"
									/>
								</div>
							</label>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="space-y-2">
									<span className="flex items-center gap-2 text-sm font-medium text-foreground">
										<Filter className="size-4 text-primary" />
										Type
									</span>
									<select
										value={typeFilter}
										onChange={(event) => setTypeFilter(event.target.value)}
										className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm capitalize outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
									>
										{resourceTypes.map((type) => (
											<option key={type} value={type}>
												{type === "pyqs" ? "PYQs" : type}
											</option>
										))}
									</select>
								</label>

								<label className="space-y-2">
									<span className="flex items-center gap-2 text-sm font-medium text-foreground">
										<Hourglass className="size-4 text-primary" />
										Embedding
									</span>
									<select
										value={embeddingFilter}
										onChange={(event) => setEmbeddingFilter(event.target.value)}
										className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm capitalize outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
									>
										{embeddingStates.map((state) => (
											<option key={state} value={state}>
												{state}
											</option>
										))}
									</select>
								</label>
							</div>

							<div className="max-h-[64dvh] space-y-3 overflow-y-auto pr-1">
								{isLoadingResources ? (
									<div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
										<Loader2 className="mr-2 size-4 animate-spin" />
										Loading resources...
									</div>
								) : null}

								{!isLoadingResources && filteredResources.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
										No resources match these filters.
									</div>
								) : null}

								{!isLoadingResources && filteredResources.map((resource) => (
									<button
										key={resource._id}
										type="button"
										onClick={() => setSelectedId(resource._id)}
										className={`w-full rounded-xl border p-4 text-left transition ${
											selectedId === resource._id
												? "border-primary bg-primary/6"
												: "border-border bg-background hover:border-primary/35"
										}`}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-foreground">{resource.name}</p>
												<p className="mt-1 text-xs text-muted-foreground">
													{resource.linkedCourses.length} course{resource.linkedCourses.length === 1 ? "" : "s"} linked
												</p>
											</div>
											<span
												className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
													resource.isEmbedded
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground"
												}`}
											>
												{resource.isEmbedded ? "Embedded" : "Waiting"}
											</span>
										</div>
										<div className="mt-3 flex flex-wrap gap-2 text-xs">
											<span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
												{getPrimaryType(resource) === "pyqs" ? "PYQs" : "Resources"}
											</span>
											<span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
												{formatDate(resource.uploadTime)}
											</span>
										</div>
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					<Card className="border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<CardTitle>Resource details</CardTitle>
							<CardDescription>
								{selectedResource ? "View metadata and manage course associations." : "Select a resource to begin."}
							</CardDescription>
						</CardHeader>

						{selectedResource ? (
							<>
								<CardContent className="space-y-6 py-4">
									<div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-4">
										<div className="min-w-0 space-y-2">
											<div className="flex items-center gap-2 text-sm font-medium text-foreground">
												<FileText className="size-4 text-primary" />
												<span className="truncate">{selectedResource.name}</span>
											</div>
											<p className="break-all text-xs text-muted-foreground">{selectedResource.AWSKey}</p>
											<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
												<span className="rounded-full bg-background px-2.5 py-1">{selectedResource.dataType}</span>
												<span className="rounded-full bg-background px-2.5 py-1">{formatDate(selectedResource.uploadTime)}</span>
												<span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
													{selectedResource.isEmbedded ? (
														<CheckCircle2 className="size-3.5 text-primary" />
													) : (
														<Hourglass className="size-3.5" />
													)}
													{selectedResource.isEmbedded ? "Embedded" : "Waiting for embedding"}
												</span>
											</div>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button type="button" variant="outline" onClick={openResource} disabled={busyAction === "open"}>
												{busyAction === "open" ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													<ExternalLink className="size-4" />
												)}
												Open file
											</Button>
											<Button
												type="button"
												variant="destructive"
												onClick={() => setDeleteDialogOpen(true)}
												disabled={busyAction === "delete"}
											>
												<Trash2 className="size-4" />
												Delete everywhere
											</Button>
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Resource name</span>
											<Input
												value={renameDraft}
												onChange={(event) => setRenameDraft(event.target.value)}
												className="h-10 bg-background"
											/>
										</label>
										<div className="flex items-end">
											<Button
												type="button"
												variant="outline"
												className="w-full sm:w-auto"
												onClick={saveRename}
												disabled={busyAction === "rename" || !renameDraft.trim() || renameDraft.trim() === selectedResource.name}
											>
												{busyAction === "rename" ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													<Pencil className="size-4" />
												)}
												{busyAction === "rename" ? "Renaming..." : "Rename"}
											</Button>
										</div>
									</div>

									<section className="space-y-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<h2 className="text-base font-medium text-foreground">Linked courses</h2>
												<p className="text-sm text-muted-foreground">
													Choose whether this file appears under Resources or PYQs per course.
												</p>
											</div>
											<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
												{selectedResource.linkedCourses.length} linked
											</span>
										</div>

										<div className="space-y-2">
											{selectedResource.linkedCourses.length === 0 ? (
												<div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
													This resource is not linked to any course.
												</div>
											) : null}

											{selectedResource.linkedCourses.map((course) => (
												<div
													key={`${course._id}-${course.resourceType}`}
													className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
												>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium text-foreground">
															{course.id} - {course.name}
														</p>
														<p className="mt-1 text-xs text-muted-foreground">
															{course.branch} - Semester {course.semester}
														</p>
													</div>
													<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
														<select
															value={course.resourceType}
															onChange={(event) => changeCourseType(course._id, event.target.value)}
															disabled={busyAction === `type-${course._id}`}
															className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
														>
															<option value="resources">Resources</option>
															<option value="pyqs">PYQs</option>
														</select>
														<Button
															type="button"
															variant="outline"
															onClick={() => removeCourse(course._id)}
															disabled={busyAction === `remove-${course._id}`}
														>
															{busyAction === `remove-${course._id}` ? (
																<Loader2 className="size-4 animate-spin" />
															) : (
																<Unlink className="size-4" />
															)}
															{busyAction === `remove-${course._id}` ? "Removing..." : "Remove"}
														</Button>
													</div>
												</div>
											))}
										</div>
									</section>

									<section className="space-y-3 rounded-xl border border-border/70 bg-muted/15 p-4">
										<div>
											<h2 className="text-base font-medium text-foreground">Add to course</h2>
											<p className="text-sm text-muted-foreground">
												Search a course, then link this resource as a normal resource or PYQ.
											</p>
										</div>

										<form onSubmit={searchCourses} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
											<div className="relative">
												<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
												<Input
													value={courseQuery}
													onChange={(event) => setCourseQuery(event.target.value)}
													placeholder="Search course code or name"
													className="h-10 bg-background pl-9"
												/>
											</div>
											<select
												value={addResourceType}
												onChange={(event) => setAddResourceType(event.target.value)}
												className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
											>
												<option value="resources">Resources</option>
												<option value="pyqs">PYQs</option>
											</select>
											<Button type="submit" variant="outline" disabled={isSearchingCourses}>
												{isSearchingCourses ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													<Search className="size-4" />
												)}
												Search
											</Button>
										</form>

										<div className="space-y-2">
											{courseMatches.map((course) => (
												<div
													key={course._id}
													className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
												>
													<div>
														<p className="text-sm font-medium text-foreground">{course.id} - {course.name}</p>
														<p className="mt-1 text-xs text-muted-foreground">
															{course.branch} - Semester {course.semester}
														</p>
													</div>
													<Button
														type="button"
														onClick={() => addCourse(course)}
														disabled={busyAction === `add-${course._id}`}
													>
														{busyAction === `add-${course._id}` ? (
															<Loader2 className="size-4 animate-spin" />
														) : (
															<Plus className="size-4" />
														)}
														{busyAction === `add-${course._id}` ? "Adding..." : "Add"}
													</Button>
												</div>
											))}

											{courseQuery.trim() && !isSearchingCourses && courseResults.length > 0 && courseMatches.length === 0 ? (
												<p className="text-sm text-muted-foreground">Every matching course is already linked.</p>
											) : null}
										</div>
									</section>
								</CardContent>

								<CardFooter className="flex-col items-stretch justify-between gap-3 border-t border-border/70 bg-transparent sm:flex-row sm:items-center">
									<p className="text-sm text-muted-foreground">Changes are saved immediately.</p>
									<Button type="button" variant="outline" onClick={() => navigate("/admin")}>
										Done
									</Button>
								</CardFooter>
							</>
						) : (
							<CardContent className="py-10">
								<p className="text-sm text-muted-foreground">No resource selected.</p>
							</CardContent>
						)}
					</Card>
				</div>
			</main>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete resource everywhere?</DialogTitle>
						<DialogDescription>
							This will remove {selectedResource?.name || "this resource"} from every linked course and delete the
							resource record. You can also remove the stored file from S3.
						</DialogDescription>
					</DialogHeader>
					<div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
						{selectedResource?.linkedCourses.length || 0} course
						{selectedResource?.linkedCourses.length === 1 ? "" : "s"} would be affected.
					</div>
					<label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
						<input
							type="checkbox"
							checked={deleteFileFromStorage}
							onChange={(event) => setDeleteFileFromStorage(event.target.checked)}
							className="mt-1"
						/>
						<span>
							<span className="block font-medium text-foreground">Delete stored file too</span>
							<span className="text-muted-foreground">
								Leave unchecked to only detach and remove the database resource record.
							</span>
						</span>
					</label>
					<DialogFooter className="bg-transparent">
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={busyAction === "delete"}>
								Cancel
							</Button>
						</DialogClose>
						<Button type="button" variant="destructive" onClick={deleteSelectedResource} disabled={busyAction === "delete"}>
							{busyAction === "delete" ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Trash2 className="size-4" />
							)}
							{busyAction === "delete" ? "Deleting..." : "Delete everywhere"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AdminResources;
