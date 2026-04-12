import { useState } from "react";
import axios from "axios";
import { BookOpen, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

import text from "../../assets/text.svg";

import AddCoursePane from "../AddCoursePane/AddCoursePane";
import { BACKEND_URL } from "@/config/env";

const tabBase =
	"flex h-full cursor-pointer items-center border-b-2 border-transparent px-5 text-sm font-medium text-foreground/65 transition-colors hover:text-foreground sm:px-8";

const MainContent = (args) => {
	const [content, setContent] = useState("pyqs");

	function handlePYQSOnClick() {
		setContent("pyqs");
	}

	function handleResourcesOnClick() {
		setContent("resources");
	}

	function handleDocumentOnClick(key) {
		axios
			.post(`${BACKEND_URL}/api/aws/getObjectUrl`, { key }, { withCredentials: true })
			.then((res) => {
				window.open(res.data.url, "_blank");
			})
			.catch((err) => {
				alert("An error occured. Couldn't fetch object url.");
			});
	}

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
										{args.selectedCourse.PYQs.map((pyq) => (
											<div
												key={pyq.key}
												className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/45 hover:shadow-md"
												onClick={() => handleDocumentOnClick(pyq.AWSKey)}
											>
												<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
													<FileText className="h-5 w-5" strokeWidth={1.75} />
												</div>
												<div className="min-w-0 flex-1 font-medium text-foreground">
													{pyq.name}
												</div>
											</div>
										))}
									</div>
								)}
								{content === "resources" && (
									<div className="space-y-4" id="resources-container">
										{args.selectedCourse.resources.map((resource, index) => (
											<div key={resource.key ?? `${resource.name}-${index}`}>
												{resource.dataType === "text" ? (
													<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/35">
														<div className="flex items-center gap-3 border-b border-border px-4 py-4">
															<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
																<img
																	className="h-6 w-6 opacity-70"
																	src={text}
																	alt=""
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
												{resource.dataType === "document" ? (
													<div
														className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/45 hover:shadow-md"
														onClick={() =>
															handleDocumentOnClick(resource.AWSKey)
														}
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
										))}
									</div>
								)}
							</div>
						</>
					) : null}
				</div>
			)}
		</>
	);
};

export default MainContent;
