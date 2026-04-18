import { Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
	const navigate = useNavigate();

	return (
		<div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 px-4 font-sans text-foreground">
			<div className="w-full max-w-xl rounded-3xl border border-border bg-card/90 p-8 text-center shadow-sm backdrop-blur sm:p-10">
				<div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<span className="text-xl font-bold">404</span>
				</div>

				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Page not found
				</h1>
				<p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
					The page you&apos;re looking for doesn&apos;t exist or may have been moved.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					<Button className="bg-primary hover:bg-primary/90" onClick={() => navigate("/")}>
						<Home className="size-4" />
						Go home
					</Button>
					<Button variant="outline" onClick={() => navigate(-1)}>
						<ArrowLeft className="size-4" />
						Go back
					</Button>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
