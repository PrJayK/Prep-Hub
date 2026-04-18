import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
	ArrowLeft,
	BookOpen,
	CheckCircle2,
	FileUp,
	Hourglass,
	Loader2,
	MessagesSquare,
	Plus,
	RefreshCw,
	Search,
	Settings2,
	Upload,
	X,
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
import { BACKEND_URL } from "@/config/env";
import { useToast } from "@/components/ui/toast-provider";

const initialCourseForm = {
	id: "",
	name: "",
	branch: "",
	semester: "",
};

const initialResourceForm = {
	courseQuery: "",
	resourceName: "",
	resourceType: "resources",
};

const inputClass = "h-10 bg-background";
const footerClass = "mt-auto flex-col items-stretch justify-between gap-3 border-t border-border/70 bg-transparent sm:flex-row sm:items-center";

function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "Unknown size";
	}

	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

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
		hour: "numeric",
		minute: "2-digit",
	});
}

const Admin = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const fileInputRef = useRef(null);

	const [user, setUser] = useState(null);
	const [courseForm, setCourseForm] = useState(initialCourseForm);
	const [resourceForm, setResourceForm] = useState(initialResourceForm);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [courseResults, setCourseResults] = useState([]);
	const [selectedFile, setSelectedFile] = useState(null);
	const [unembeddedResources, setUnembeddedResources] = useState([]);
	const [isCreatingCourse, setIsCreatingCourse] = useState(false);
	const [isSearchingCourses, setIsSearchingCourses] = useState(false);
	const [isUploadingResource, setIsUploadingResource] = useState(false);
	const [isLoadingResources, setIsLoadingResources] = useState(true);
	const [isEmbeddingResources, setIsEmbeddingResources] = useState(false);

	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/me`, { withCredentials: true })
			.then((res) => setUser(res.data))
			.catch(() => {
				navigate("/", { replace: true });
			});
	}, [navigate]);

	useEffect(() => {
		loadUnembeddedResources();
	}, []);

	function handleCourseChange(event) {
		const { name, value } = event.target;
		setCourseForm((current) => ({
			...current,
			[name]: value,
		}));
	}

	function handleResourceChange(event) {
		const { name, value } = event.target;
		setResourceForm((current) => ({
			...current,
			[name]: value,
		}));

		if (name === "courseQuery") {
			setSelectedCourse(null);
		}
	}

	function clearSelectedFile() {
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	async function createCourse(event) {
		event.preventDefault();
		setIsCreatingCourse(true);

		try {
			await axios.post(
				`${BACKEND_URL}/api/admin/courses`,
				{
					id: courseForm.id.trim(),
					name: courseForm.name.trim(),
					branch: courseForm.branch.trim(),
					semester: courseForm.semester.trim(),
				},
				{ withCredentials: true }
			);

			toast({
				title: "Course created",
				description: `${courseForm.id.trim()} is now available.`,
			});
			setCourseForm(initialCourseForm);
		} catch (error) {
			toast({
				title: "Couldn't create course",
				description: error.response?.data?.message || "Please check the course details and try again.",
			});
		} finally {
			setIsCreatingCourse(false);
		}
	}

	async function searchCourses(event) {
		event.preventDefault();
		setIsSearchingCourses(true);

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/queryCourses`,
				{ course_query: resourceForm.courseQuery.trim(), branch: "", semester: "" },
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

	function chooseCourse(course) {
		setSelectedCourse(course);
		setResourceForm((current) => ({
			...current,
			courseQuery: `${course.id} - ${course.name}`,
		}));
		setCourseResults([]);
	}

	async function uploadResource(event) {
		event.preventDefault();

		if (!selectedCourse?._id) {
			toast({
				title: "Choose a course",
				description: "Search for and select the course that should receive this resource.",
			});
			return;
		}

		if (!selectedFile) {
			toast({
				title: "Choose a file first",
				description: "Add a file before uploading the resource.",
			});
			return;
		}

		setIsUploadingResource(true);

		try {
			const presignResponse = await axios.post(
				`${BACKEND_URL}/api/admin/resources/presign`,
				{
					fileName: selectedFile.name,
					fileType: selectedFile.type || "application/octet-stream",
				},
				{ withCredentials: true }
			);

			const uploadResponse = await fetch(presignResponse.data.url, {
				method: "PUT",
				headers: {
					"Content-Type": selectedFile.type || "application/octet-stream",
				},
				body: selectedFile,
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload the file.");
			}

			await axios.post(
				`${BACKEND_URL}/api/admin/resources`,
				{
					courseId: selectedCourse._id,
					resourceName: resourceForm.resourceName.trim(),
					resourceType: resourceForm.resourceType,
					key: presignResponse.data.key,
					mimeType: selectedFile.type || "application/octet-stream",
				},
				{ withCredentials: true }
			);

			toast({
				title: "Resource uploaded",
				description: "It is now waiting for embedding.",
			});
			setResourceForm(initialResourceForm);
			setSelectedCourse(null);
			setCourseResults([]);
			clearSelectedFile();
			await loadUnembeddedResources();
		} catch (error) {
			toast({
				title: "Upload failed",
				description: error.response?.data?.message || error.message || "We couldn't upload that resource.",
			});
		} finally {
			setIsUploadingResource(false);
		}
	}

	async function loadUnembeddedResources() {
		setIsLoadingResources(true);

		try {
			const response = await axios.get(`${BACKEND_URL}/api/admin/resources/unembedded`, {
				withCredentials: true,
			});
			setUnembeddedResources(response.data);
		} catch (error) {
			toast({
				title: "Couldn't load waiting resources",
				description: "The embedding queue could not be fetched.",
			});
		} finally {
			setIsLoadingResources(false);
		}
	}

	async function embedWaitingResources() {
		setIsEmbeddingResources(true);

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/chat/ingestAllResources`,
				{},
				{ withCredentials: true }
			);

			const { ingestedResources, failedResources, ingestedChunks } = response.data;
			toast({
				title: "Embedding finished",
				description: `${ingestedResources} embedded, ${failedResources} failed, ${ingestedChunks} chunks added.`,
			});
			await loadUnembeddedResources();
		} catch (error) {
			toast({
				title: "Embedding failed",
				description: error.response?.data?.message || error.response?.data?.error || "Try again in a moment.",
			});
		} finally {
			setIsEmbeddingResources(false);
		}
	}

	return (
		<div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
			<Navbar user={user} />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
				<Button
					type="button"
					variant="ghost"
					className="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
					onClick={() => navigate("/dashboard")}
				>
					<ArrowLeft className="size-4" />
					Back to dashboard
				</Button>

				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Admin</h1>
					<p className="text-sm text-muted-foreground sm:text-base">
						Quick tools for managing courses, uploads, reviews, and embeddings.
					</p>
				</div>

				<div className="grid items-stretch gap-6 lg:grid-cols-2">
					<Card className="min-h-full border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<BookOpen className="size-5" />
								</div>
								<div>
									<CardTitle>Create Course</CardTitle>
									<CardDescription>Add a new course to Prep-Hub.</CardDescription>
								</div>
							</div>
						</CardHeader>
						<form className="flex flex-1 flex-col" onSubmit={createCourse}>
							<CardContent className="grid gap-4 py-4 sm:grid-cols-2">
								<label className="space-y-2">
									<span className="text-sm font-medium">Course code</span>
									<Input
										className={inputClass}
										name="id"
										value={courseForm.id}
										onChange={handleCourseChange}
										placeholder="CS201"
										required
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium">Course name</span>
									<Input
										className={inputClass}
										name="name"
										value={courseForm.name}
										onChange={handleCourseChange}
										placeholder="Data Structures"
										required
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium">Branch</span>
									<Input
										className={inputClass}
										name="branch"
										value={courseForm.branch}
										onChange={handleCourseChange}
										placeholder="CSE"
										required
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium">Semester</span>
									<Input
										className={inputClass}
										name="semester"
										value={courseForm.semester}
										onChange={handleCourseChange}
										placeholder="4"
										inputMode="numeric"
										required
									/>
								</label>
							</CardContent>
							<CardFooter className={footerClass}>
								<p className="text-sm text-muted-foreground">Course code must be unique.</p>
								<Button type="submit" className="min-w-36" disabled={isCreatingCourse}>
									{isCreatingCourse ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
									{isCreatingCourse ? "Creating..." : "Create course"}
								</Button>
							</CardFooter>
						</form>
					</Card>

					<Card className="min-h-full border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<FileUp className="size-5" />
								</div>
								<div>
									<CardTitle>Upload Resource</CardTitle>
									<CardDescription>Add a resource directly to a course.</CardDescription>
								</div>
							</div>
						</CardHeader>
						<form className="flex flex-1 flex-col" onSubmit={uploadResource}>
							<CardContent className="space-y-4 py-4">
								<label className="space-y-2">
									<span className="text-sm font-medium">Course</span>
									<div className="flex gap-2">
										<Input
											className={inputClass}
											name="courseQuery"
											value={resourceForm.courseQuery}
											onChange={handleResourceChange}
											placeholder="Search course code or name"
											required
										/>
										<Button
											type="button"
											variant="outline"
											size="icon-lg"
											onClick={searchCourses}
											disabled={isSearchingCourses}
											aria-label="Search courses"
										>
											{isSearchingCourses ? (
												<Loader2 className="size-4 animate-spin" />
											) : (
												<Search className="size-4" />
											)}
										</Button>
									</div>
								</label>

								{selectedCourse ? (
									<div className="flex items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/6 p-3 text-sm">
										<div>
											<p className="font-medium text-foreground">{selectedCourse.id} - {selectedCourse.name}</p>
											<p className="mt-1 text-muted-foreground">
												{selectedCourse.branch} - Semester {selectedCourse.semester}
											</p>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											onClick={() => setSelectedCourse(null)}
											aria-label="Clear selected course"
										>
											<X className="size-4" />
										</Button>
									</div>
								) : null}

								{courseResults.length > 0 ? (
									<div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
										{courseResults.map((course) => (
											<button
												key={course._id}
												type="button"
												onClick={() => chooseCourse(course)}
												className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
											>
												<span className="block font-medium text-foreground">{course.id} - {course.name}</span>
												<span className="text-xs text-muted-foreground">
													{course.branch} - Semester {course.semester}
												</span>
											</button>
										))}
									</div>
								) : null}

								<div className="grid gap-4 sm:grid-cols-2">
									<label className="space-y-2">
										<span className="text-sm font-medium">Resource name</span>
										<Input
											className={inputClass}
											name="resourceName"
											value={resourceForm.resourceName}
											onChange={handleResourceChange}
											placeholder="Lecture notes"
											required
										/>
									</label>
									<label className="space-y-2">
										<span className="text-sm font-medium">Type</span>
										<select
											name="resourceType"
											value={resourceForm.resourceType}
											onChange={handleResourceChange}
											className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
										>
											<option value="resources">Resources</option>
											<option value="pyqs">PYQs</option>
										</select>
									</label>
								</div>

								<label
									htmlFor="admin-resource-file"
									className="flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4 transition hover:border-primary/35 hover:bg-muted/35"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<Upload className="size-4" />
										</div>
										<div>
											<p className="text-sm font-medium text-foreground">Choose file</p>
											<p className="text-sm text-muted-foreground">
												{selectedFile ? `${selectedFile.name} (${formatBytes(selectedFile.size)})` : "No file selected."}
											</p>
										</div>
									</div>
									<Input
										id="admin-resource-file"
										ref={fileInputRef}
										className="h-auto cursor-pointer border-0 bg-transparent px-0 py-0 pr-0 file:mr-4 file:rounded-lg file:bg-primary/10 file:px-4 file:py-2 file:text-primary hover:file:bg-primary/15"
										type="file"
										onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
										required
									/>
								</label>
							</CardContent>
							<CardFooter className={footerClass}>
								<p className="text-sm text-muted-foreground">New uploads enter the embedding queue.</p>
								<Button type="submit" className="min-w-40" disabled={isUploadingResource}>
									{isUploadingResource ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
									{isUploadingResource ? "Uploading..." : "Upload resource"}
								</Button>
							</CardFooter>
						</form>
					</Card>

					<Card className="min-h-full border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<MessagesSquare className="size-5" />
								</div>
								<div>
									<CardTitle>Review Contributions</CardTitle>
									<CardDescription>Approve or reject user-submitted resources.</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex-1 py-4">
							<p className="text-sm leading-6 text-muted-foreground">
								Open the existing contribution queue, edit submission details, and publish approved files.
							</p>
						</CardContent>
						<CardFooter className={footerClass}>
							<p className="text-sm text-muted-foreground">Pending, approved, and rejected filters are available.</p>
							<Button type="button" className="min-w-44" onClick={() => navigate("/admin/review")}>
								<MessagesSquare className="size-4" />
								Review contributions
							</Button>
						</CardFooter>
					</Card>

					<Card className="min-h-full border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Settings2 className="size-5" />
								</div>
								<div>
									<CardTitle>Manage Resources</CardTitle>
									<CardDescription>View, move, rename, or delete course resources.</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex-1 py-4">
							<p className="text-sm leading-6 text-muted-foreground">
								Open the resource manager to inspect course links and stage changes before backend wiring.
							</p>
						</CardContent>
						<CardFooter className={footerClass}>
							<p className="text-sm text-muted-foreground">Delete and association controls live on a dedicated page.</p>
							<Button type="button" className="min-w-40" onClick={() => navigate("/admin/resources")}>
								<Settings2 className="size-4" />
								Manage resources
							</Button>
						</CardFooter>
					</Card>

					<Card className="min-h-full border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Hourglass className="size-5" />
									</div>
									<div>
										<CardTitle>Resources Waiting For Embedding</CardTitle>
										<CardDescription>Resources published but not embedded yet.</CardDescription>
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={loadUnembeddedResources}
									disabled={isLoadingResources}
									aria-label="Refresh waiting resources"
								>
									<RefreshCw className={`size-4 ${isLoadingResources ? "animate-spin" : ""}`} />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="flex-1 py-4">
							{isLoadingResources ? (
								<div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
									<Loader2 className="mr-2 size-4 animate-spin" />
									Loading waiting resources...
								</div>
							) : unembeddedResources.length === 0 ? (
								<div className="flex min-h-40 items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
									<CheckCircle2 className="size-5 text-primary" />
									All published resources are embedded.
								</div>
							) : (
								<div className="max-h-64 space-y-2 overflow-y-auto pr-1">
									{unembeddedResources.map((resource) => (
										<div
											key={resource._id}
											className="rounded-xl border border-border/70 bg-background p-3 text-sm"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0">
													<p className="truncate font-medium text-foreground">{resource.name || "Untitled resource"}</p>
													<p className="mt-1 truncate text-xs text-muted-foreground">{resource.AWSKey}</p>
												</div>
												<span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
													Waiting
												</span>
											</div>
											<p className="mt-2 text-xs text-muted-foreground">
												{resource.dataType || "Unknown type"} - {formatDate(resource.uploadTime)}
											</p>
										</div>
									))}
								</div>
							)}
						</CardContent>
						<CardFooter className={footerClass}>
							<p className="text-sm text-muted-foreground">
								{unembeddedResources.length} resource{unembeddedResources.length === 1 ? "" : "s"} waiting.
							</p>
							<Button
								type="button"
								variant="outline"
								className="min-w-44"
								onClick={embedWaitingResources}
								disabled={isEmbeddingResources || isLoadingResources || unembeddedResources.length === 0}
							>
								{isEmbeddingResources ? <Loader2 className="size-4 animate-spin" /> : <Hourglass className="size-4" />}
								{isEmbeddingResources ? "Embedding..." : "Embed waiting"}
							</Button>
						</CardFooter>
					</Card>
				</div>
			</main>
		</div>
	);
};

export default Admin;
