import { cn } from "@/lib/utils";

import school from "../../assets/school.svg";
import lib_books from "../../assets/lib-books.svg";

const EnrolledPane = (args) => {
	const handleCourseOnClick = (courseId) => {
		const selectedCourse = args.enrolledCourses.find(
			(course) => course.id === courseId
		);
		args.setSelectedCourse(selectedCourse);
		args.setAddCoursesButton(false);
	};

	return (
		<div
			className={cn(
				"flex min-h-0 w-64 shrink-0 self-stretch flex-col overflow-hidden border-r border-border bg-card/50 backdrop-blur-sm sm:w-72",
				args.className
			)}
		>
			<div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
				<img className="h-6 w-6 opacity-70" src={school} alt="" />
				<div className="text-sm font-semibold text-foreground">
					Enrolled courses
				</div>
			</div>
			<ul className="flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto overflow-x-hidden p-2">
				{args.enrolledCourses.map((course) => (
					<li
						key={course.id}
						className={cn(
							"flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-muted/80",
							args.selectedCourse?.id === course.id &&
								"bg-primary/10 text-foreground ring-1 ring-primary/25"
						)}
						onClick={() => handleCourseOnClick(course.id)}
					>
						<img
							className="h-6 w-6 shrink-0 opacity-70"
							src={lib_books}
							alt=""
						/>
						<div className="min-w-0 truncate font-medium">{course.id}</div>
					</li>
				))}
			</ul>
		</div>
	);
};

export default EnrolledPane;
