import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, FileText, Upload, X } from "lucide-react";

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

const initialForm = {
	courseCode: "",
	courseName: "",
	resourceName: "",
	resourceType: "resources",
	branch: "",
	semester: "",
};

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

const Contribute = () => {
	const navigate = useNavigate();
	const { toast } = useToast();

	const [user, setUser] = useState(null);
	const [form, setForm] = useState(initialForm);
	const [selectedFile, setSelectedFile] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef(null);

	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/me`, { withCredentials: true })
			.then((res) => setUser(res.data))
			.catch(() => {
				navigate("/", { replace: true });
			});
	}, [navigate]);

	function handleChange(event) {
		const { name, value } = event.target;
		setForm((current) => ({
			...current,
			[name]: value,
		}));
	}

	function handleFileChange(event) {
		setSelectedFile(event.target.files?.[0] ?? null);
	}

	function clearSelectedFile() {
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();

		if (!selectedFile) {
			toast({
				title: "Choose a file first",
				description: "Add a file before submitting.",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const putUrlResponse = await fetch(`${BACKEND_URL}/api/contributions/presign`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					fileName: selectedFile.name,
					fileType: selectedFile.type || "application/octet-stream",
				}),
			});

			if (!putUrlResponse.ok) {
				throw new Error("Failed to prepare upload.");
			}

			const { url, key } = await putUrlResponse.json();

			const uploadResponse = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": selectedFile.type || "application/octet-stream",
				},
				body: selectedFile,
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload file.");
			}

			const contributeResponse = await fetch(`${BACKEND_URL}/api/contributions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					courseCode: form.courseCode.trim(),
					courseName: form.courseName.trim(),
					resourceName: form.resourceName.trim(),
					resourceType: form.resourceType,
					branch: form.branch.trim(),
					semester: form.semester.trim(),
					originalFileName: selectedFile.name,
					mimeType: selectedFile.type || "application/octet-stream",
					fileSize: selectedFile.size,
					key,
				}),
			});

			if (!contributeResponse.ok) {
				throw new Error("Failed to submit contribution.");
			}

			setForm(initialForm);
			clearSelectedFile();

			toast({
				title: "Contribution submitted",
				description: "Your file was uploaded successfully.",
			});
		} catch (error) {
			toast({
				title: "Upload failed",
				description: error.message || "Something went wrong while submitting.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
			<Navbar user={user} />
			<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contribute a resource</h1>
					<p className="text-sm text-muted-foreground sm:text-base">
						Upload a file and add the details you know.
					</p>
				</div>

				<Card className="border border-border/70 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
					<CardHeader className="border-b border-border/70">
						<CardTitle>Resource Submission</CardTitle>
						<CardDescription>Fill in the form below and submit your file.</CardDescription>
					</CardHeader>
					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-6 py-6">
							<div className="grid gap-5 sm:grid-cols-2">
								<label className="space-y-2">
									<span className="text-sm font-medium text-foreground">Course code</span>
									<Input
										name="courseCode"
										value={form.courseCode}
										onChange={handleChange}
										placeholder="CS201"
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium text-foreground">Course name</span>
									<Input
										name="courseName"
										value={form.courseName}
										onChange={handleChange}
										placeholder="Data Structures"
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium text-foreground">Resource name</span>
									<Input
										name="resourceName"
										value={form.resourceName}
										onChange={handleChange}
										placeholder="Midterm prep sheet"
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium text-foreground">Branch</span>
									<Input
										name="branch"
										value={form.branch}
										onChange={handleChange}
										placeholder="CSE"
									/>
								</label>
								<label className="space-y-2">
									<span className="text-sm font-medium text-foreground">Semester</span>
									<Input
										name="semester"
										value={form.semester}
										onChange={handleChange}
										placeholder="4"
									/>
								</label>
							</div>

							<label className="space-y-2">
								<span className="text-sm font-medium text-foreground">Resource type</span>
								<select
									name="resourceType"
									value={form.resourceType}
									onChange={handleChange}
									className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
								>
									<option value="resources">Resources</option>
									<option value="pyqs">PYQs</option>
								</select>
							</label>

							<label
								htmlFor="contribute-file"
								className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/25 p-5 transition hover:border-primary/35 hover:bg-muted/40"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Upload className="size-4" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">Choose file</p>
										<p className="text-sm text-muted-foreground">Select the resource you want to upload.</p>
									</div>
								</div>
								<Input
									id="contribute-file"
									ref={fileInputRef}
									type="file"
									className="h-auto cursor-pointer border-0 bg-transparent px-0 py-0 pr-0 file:mr-4 file:rounded-lg file:bg-primary/10 file:px-4 file:py-2 file:text-primary hover:file:bg-primary/15"
									onChange={handleFileChange}
									required
								/>
							</label>

							<div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
								<div className="mb-2 flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-sm font-medium text-foreground">
										<FileText className="size-4 text-primary" />
										Selected file
									</div>
									{selectedFile ? (
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="shrink-0 text-muted-foreground hover:text-foreground"
											onClick={clearSelectedFile}
											aria-label="Remove selected file"
										>
											<X className="size-4" />
										</Button>
									) : null}
								</div>
								{selectedFile ? (
									<div className="space-y-1">
										<p className="truncate text-sm text-foreground">{selectedFile.name}</p>
										<p className="text-sm text-muted-foreground">{formatBytes(selectedFile.size)}</p>
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No file selected.</p>
								)}
							</div>
						</CardContent>
						<CardFooter className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
							<p className="text-sm text-muted-foreground">Make sure the details are correct before submitting.</p>
							<Button
								type="submit"
								size="lg"
								className="min-w-44 bg-primary hover:bg-primary/90"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Uploading..." : "Submit contribution"}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</main>
		</div>
	);
};

export default Contribute;
