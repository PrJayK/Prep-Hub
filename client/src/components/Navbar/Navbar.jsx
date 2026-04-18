import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, PlusCircle, LogOut, UserCircle2, ShieldCheck, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useTheme } from "@/components/theme/theme-provider";
import axios from "axios";
import { BACKEND_URL } from "@/config/env";

const Navbar = (args) => {
	const { toast } = useToast();
	const { isDark, toggleTheme } = useTheme();
	const [searchQuery, setSearchQuery] = useState("");
	const [profileOpen, setProfileOpen] = useState(false);
	const profileRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const userName = args?.user?.name || "User";

	useEffect(() => {
		if (location.pathname === "/search") {
			setSearchQuery(searchParams.get("q") || "");
			return;
		}

		setSearchQuery("");
	}, [location.pathname, searchParams]);

	useEffect(() => {
		function handleDocumentClick(event) {
			if (profileRef.current && !profileRef.current.contains(event.target)) {
				setProfileOpen(false);
			}
		}

		document.addEventListener("mousedown", handleDocumentClick);
		return () => document.removeEventListener("mousedown", handleDocumentClick);
	}, []);

	const handleAddCoursesButtonOnClick = () => {
		if (typeof args.setAddCoursesButton === "function") {
			args.setAddCoursesButton(true);
			return;
		}

		navigate("/dashboard");
	};
	
	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	};

	const handleContributeButtonOnClick = () => {
		navigate("/contribute");
	};

	const handleAdminReviewOnClick = () => {
		navigate("/admin");
	};

	const handleLogout = async () => {
		try {
			await axios.get(`${BACKEND_URL}/logout`, {
				withCredentials: true,
			});
			navigate('/');
		} catch (error) {
			toast({
				title: "Logout failed",
				description: "We couldn't sign you out cleanly, so we sent you back home.",
			});
			navigate('/');
		}
	};

	return (
		<header className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
			<nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<button
					type="button"
					className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
					onClick={() => navigate("/dashboard")}
					aria-label="Go to dashboard"
				>
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
						P
					</div>
					<span className="truncate font-bold text-lg text-foreground">
						Prep-Hub
					</span>
				</button>
				
				{/* Search Bar - Center */}
				<form onSubmit={handleSearch} className="flex-1 mx-8 max-w-md">
					<Input
					type="text"
					placeholder="Search for resources semantically..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full rounded-lg text-sm"
					/>
				</form>

				<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
					{args?.user?.role === "admin" ? (
						<Button
							type="button"
							variant="outline"
							size="default"
							className="border-border"
							onClick={handleAdminReviewOnClick}
						>
							<ShieldCheck className="size-4 sm:mr-1" />
							<span className="hidden sm:inline">Admin</span>
						</Button>
					) : null}
					<Button
						type="button"
						variant="outline"
						size="default"
						className="border-border"
						onClick={handleContributeButtonOnClick}
					>
						<Upload className="size-4 sm:mr-1" />
						<span className="hidden sm:inline">Contribute</span>
					</Button>
					<Button
						type="button"
						variant="default"
						size="default"
						className="bg-primary hover:bg-primary/90"
						onClick={handleAddCoursesButtonOnClick}
					>
						<PlusCircle className="size-4 sm:mr-1" />
						<span className="hidden sm:inline">Add courses</span>
				</Button>
				<div className="relative" ref={profileRef}>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="text-foreground/80 hover:text-foreground cursor-pointer"
						aria-haspopup="true"
						aria-expanded={profileOpen}
						onClick={() => setProfileOpen((prev) => !prev)}
					>
						<UserCircle2 className="size-6" />
					</Button>

					{profileOpen && (
						<div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-popover text-foreground shadow-large">
							<div className="px-4 py-3">
								<p className="text-sm font-semibold">{userName}</p>
								<p className="text-xs text-muted-foreground">Signed in</p>
							</div>
							<div className="border-t border-border/70">
								<button
									type="button"
									className="inline-flex w-full cursor-pointer items-center justify-start gap-2 border-none bg-transparent px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted focus:outline-none"
									onClick={toggleTheme}
								>
									{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
									{isDark ? "Light mode" : "Dark mode"}
								</button>
							</div>
							<div className="border-t border-border/70">
							<button
								type="button"
								className="w-full inline-flex cursor-pointer items-center justify-start gap-2 rounded-b-2xl border-none bg-transparent px-4 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus:outline-none"
								onClick={handleLogout}
							>
								<LogOut className="size-4" />
								Sign out
							</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</nav>
	</header>
	);
};

export default Navbar;

