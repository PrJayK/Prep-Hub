import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Check, ExternalLink, Search, ShieldCheck, X } from "lucide-react";

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

const statusOptions = ["pending", "approved", "rejected", "all"];

function createDraft(contribution) {
	if (!contribution) {
		return {
			courseCode: "",
			courseName: "",
			resourceName: "",
			resourceType: "resources",
			branch: "",
			semester: "",
			adminNotes: "",
			targetCourseId: "",
		};
	}

	return {
		courseCode: contribution.courseCode || "",
		courseName: contribution.courseName || "",
		resourceName: contribution.resourceName || "",
		resourceType: contribution.resourceType || "resources",
		branch: contribution.branch || "",
		semester: contribution.semester || "",
		adminNotes: contribution.adminNotes || "",
		targetCourseId: contribution.targetCourseId || contribution.targetCourse?._id || "",
	};
}

const AdminReview = () => {
	const navigate = useNavigate();
	const { toast } = useToast();

	const [user, setUser] = useState(null);
	const [statusFilter, setStatusFilter] = useState("pending");
	const [contributions, setContributions] = useState([]);
	const [selectedId, setSelectedId] = useState("");
	const [draft, setDraft] = useState(createDraft(null));
	const [courseQuery, setCourseQuery] = useState("");
	const [courseResults, setCourseResults] = useState([]);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [isBusy, setIsBusy] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const selectedContribution = contributions.find((item) => item._id === selectedId) || null;

	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/me`, { withCredentials: true })
			.then((res) => setUser(res.data))
			.catch(() => {
				navigate("/", { replace: true });
			});
	}, [navigate]);

	useEffect(() => {
		loadContributions(statusFilter);
	}, [statusFilter]);

	useEffect(() => {
		if (!selectedContribution) {
			setDraft(createDraft(null));
			setSelectedCourse(null);
			return;
		}

		setDraft(createDraft(selectedContribution));
		setSelectedCourse(selectedContribution.targetCourse || null);
	}, [selectedContribution]);

	async function loadContributions(status = statusFilter, nextSelectedId = selectedId) {
		setIsLoading(true);

		try {
			const response = await axios.get(`${BACKEND_URL}/api/admin/contributions`, {
				params: { status },
				withCredentials: true,
			});

			const items = response.data;
			setContributions(items);

			if (items.length === 0) {
				setSelectedId("");
				return;
			}

			const hasSelected = items.some((item) => item._id === nextSelectedId);
			setSelectedId(hasSelected ? nextSelectedId : items[0]._id);
		} catch (error) {
			toast({
				title: "Couldn't load contributions",
				description: "We couldn't fetch the review queue right now.",
			});
		} finally {
			setIsLoading(false);
		}
	}

	function handleDraftChange(event) {
		const { name, value } = event.target;
		setDraft((current) => ({
			...current,
			[name]: value,
		}));
	}

	async function handleCourseSearch(event) {
		event.preventDefault();

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/queryCourses`,
				{ course_query: courseQuery, branch: "", semester: "" },
				{ withCredentials: true }
			);

			setCourseResults(response.data);
		} catch (error) {
			toast({
				title: "Couldn't search courses",
				description: "We couldn't load course matches right now.",
			});
		}
	}

	function handleSelectCourse(course) {
		setSelectedCourse(course);
		setDraft((current) => ({
			...current,
			targetCourseId: course._id,
			courseCode: course.id || current.courseCode,
			courseName: course.name || current.courseName,
			branch: course.branch || current.branch,
			semester: String(course.semester ?? current.semester ?? ""),
		}));
	}

	async function openContributionFile() {
		if (!selectedContribution?.AWSKey) {
			return;
		}

		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/aws/getObjectUrl`,
				{ key: selectedContribution.AWSKey },
				{ withCredentials: true }
			);

			window.open(response.data.url, "_blank", "noopener,noreferrer");
		} catch (error) {
			toast({
				title: "Couldn't open file",
				description: "We couldn't fetch a file link right now.",
			});
		}
	}

	async function saveEdits() {
		if (!selectedContribution) {
			return;
		}

		setIsBusy(true);

		try {
			await axios.patch(
				`${BACKEND_URL}/api/admin/contributions/${selectedContribution._id}`,
				draft,
				{ withCredentials: true }
			);

			await loadContributions(statusFilter, selectedContribution._id);
			toast({
				title: "Changes saved",
				description: "Contribution details were updated.",
			});
		} catch (error) {
			toast({
				title: "Save failed",
				description: error.response?.data?.message || "We couldn't save those edits.",
			});
		} finally {
			setIsBusy(false);
		}
	}

	async function approveContribution() {
		if (!selectedContribution) {
			return;
		}

		if (!draft.targetCourseId) {
			toast({
				title: "Choose a course",
				description: "Select the course this contribution should be published into.",
			});
			return;
		}

		setIsBusy(true);

		try {
			await axios.post(
				`${BACKEND_URL}/api/admin/contributions/${selectedContribution._id}/approve`,
				draft,
				{ withCredentials: true }
			);

			await loadContributions(statusFilter, selectedContribution._id);
			toast({
				title: "Contribution approved",
				description: "The resource was published into the selected course.",
			});
		} catch (error) {
			toast({
				title: "Approval failed",
				description: error.response?.data?.message || "We couldn't approve this contribution.",
			});
		} finally {
			setIsBusy(false);
		}
	}

	async function rejectContribution() {
		if (!selectedContribution) {
			return;
		}

		setIsBusy(true);

		try {
			await axios.post(
				`${BACKEND_URL}/api/admin/contributions/${selectedContribution._id}/reject`,
				draft,
				{ withCredentials: true }
			);

			await loadContributions(statusFilter, selectedContribution._id);
			toast({
				title: "Contribution rejected",
				description: "The contribution was marked as rejected.",
			});
		} catch (error) {
			toast({
				title: "Reject failed",
				description: error.response?.data?.message || "We couldn't reject this contribution.",
			});
		} finally {
			setIsBusy(false);
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
					onClick={() => navigate("/dashboard")}
				>
					<ArrowLeft className="size-4" />
					Back to dashboard
				</Button>

				<div className="space-y-2">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
						<ShieldCheck className="size-3.5" />
						Admin review
					</div>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Review user contributions</h1>
					<p className="text-sm text-muted-foreground sm:text-base">
						Edit the details, choose a course, and approve or reject each submission.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					{statusOptions.map((status) => (
						<Button
							key={status}
							type="button"
							variant={statusFilter === status ? "default" : "outline"}
							onClick={() => setStatusFilter(status)}
							className="capitalize"
						>
							{status}
						</Button>
					))}
				</div>

				<div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
					<Card className="border border-border/70 bg-card">
						<CardHeader className="border-b border-border/70">
							<CardTitle>Queue</CardTitle>
							<CardDescription>
								{isLoading ? "Loading contributions..." : `${contributions.length} contribution(s)`}
							</CardDescription>
						</CardHeader>
						<CardContent className="max-h-[70dvh] space-y-3 overflow-y-auto py-4">
							{!isLoading && contributions.length === 0 ? (
								<p className="text-sm text-muted-foreground">No contributions found for this filter.</p>
							) : null}

							{contributions.map((item) => (
								<button
									key={item._id}
									type="button"
									onClick={() => setSelectedId(item._id)}
									className={`w-full rounded-2xl border p-4 text-left transition ${
										selectedId === item._id
											? "border-primary bg-primary/6"
											: "border-border bg-background hover:border-primary/30"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-foreground">
												{item.resourceName || item.originalFileName}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{item.uploader?.name || "Unknown uploader"}
											</p>
										</div>
										<span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground">
											{item.status}
										</span>
									</div>
									<p className="mt-3 truncate text-xs text-muted-foreground">
										{item.courseCode || item.courseName || "No course details yet"}
									</p>
								</button>
							))}
						</CardContent>
					</Card>

					<Card className="border border-border/70 bg-card">
						<CardHeader className="border-b border-border/70">
							<CardTitle>Review</CardTitle>
							<CardDescription>
								{selectedContribution ? "Update the details before publishing." : "Select a contribution to review."}
							</CardDescription>
						</CardHeader>
						{selectedContribution ? (
							<>
								<CardContent className="space-y-6 py-6">
									<div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
										<div className="space-y-1">
											<p className="text-sm font-medium text-foreground">{selectedContribution.originalFileName}</p>
											<p className="text-sm text-muted-foreground">
												Uploaded by {selectedContribution.uploader?.name || "Unknown user"}
											</p>
											<p className="text-sm text-muted-foreground">
												{selectedContribution.mimeType || "Unknown type"} · {(selectedContribution.fileSize / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
										<Button type="button" variant="outline" onClick={openContributionFile}>
											<ExternalLink className="size-4 sm:mr-1" />
											<span className="hidden sm:inline">Open file</span>
										</Button>
									</div>

									<div className="grid gap-5 sm:grid-cols-2">
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Resource name</span>
											<Input name="resourceName" value={draft.resourceName} onChange={handleDraftChange} />
										</label>
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Resource type</span>
											<select
												name="resourceType"
												value={draft.resourceType}
												onChange={handleDraftChange}
												className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
											>
												<option value="resources">Resources</option>
												<option value="pyqs">PYQs</option>
												<option value="other">Other</option>
											</select>
										</label>
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Course code</span>
											<Input name="courseCode" value={draft.courseCode} onChange={handleDraftChange} />
										</label>
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Course name</span>
											<Input name="courseName" value={draft.courseName} onChange={handleDraftChange} />
										</label>
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Branch</span>
											<Input name="branch" value={draft.branch} onChange={handleDraftChange} />
										</label>
										<label className="space-y-2">
											<span className="text-sm font-medium text-foreground">Semester</span>
											<Input name="semester" value={draft.semester} onChange={handleDraftChange} />
										</label>
									</div>

									<label className="space-y-2">
										<span className="text-sm font-medium text-foreground">Admin notes</span>
										<textarea
											name="adminNotes"
											value={draft.adminNotes}
											onChange={handleDraftChange}
											rows={4}
											className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
										/>
									</label>

									<Card className="border border-border/70 bg-background">
										<CardHeader>
											<CardTitle className="text-base">Publish into course</CardTitle>
											<CardDescription>Search and choose the course that should receive this resource.</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											<form onSubmit={handleCourseSearch} className="flex gap-2">
												<Input
													value={courseQuery}
													onChange={(event) => setCourseQuery(event.target.value)}
													placeholder="Search by course code or name"
												/>
												<Button type="submit" variant="outline">
													<Search className="size-4" />
												</Button>
											</form>

											{selectedCourse ? (
												<div className="rounded-2xl border border-primary/20 bg-primary/6 p-4 text-sm">
													<p className="font-medium text-foreground">{selectedCourse.id} · {selectedCourse.name}</p>
													<p className="mt-1 text-muted-foreground">
														{selectedCourse.branch} · Semester {selectedCourse.semester}
													</p>
												</div>
											) : (
												<p className="text-sm text-muted-foreground">No course selected yet.</p>
											)}

											<div className="grid gap-3">
												{courseResults.map((course) => (
													<button
														key={course._id}
														type="button"
														onClick={() => handleSelectCourse(course)}
														className="rounded-2xl border border-border bg-card px-4 py-3 text-left transition hover:border-primary/35"
													>
														<p className="text-sm font-medium text-foreground">{course.id} · {course.name}</p>
														<p className="mt-1 text-xs text-muted-foreground">
															{course.branch} · Semester {course.semester}
														</p>
													</button>
												))}
											</div>
										</CardContent>
									</Card>
								</CardContent>
								<CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
									<Button type="button" variant="outline" onClick={saveEdits} disabled={isBusy}>
										Save changes
									</Button>
									<div className="flex flex-col gap-3 sm:flex-row">
										<Button type="button" variant="destructive" onClick={rejectContribution} disabled={isBusy}>
											<X className="size-4 sm:mr-1" />
											<span className="hidden sm:inline">Reject</span>
										</Button>
										<Button type="button" onClick={approveContribution} disabled={isBusy}>
											<Check className="size-4 sm:mr-1" />
											<span className="hidden sm:inline">Approve and publish</span>
										</Button>
									</div>
								</CardFooter>
							</>
						) : (
							<CardContent className="py-10">
								<p className="text-sm text-muted-foreground">Pick a contribution from the queue to begin review.</p>
							</CardContent>
						)}
					</Card>
				</div>
			</main>
		</div>
	);
};

export default AdminReview;
