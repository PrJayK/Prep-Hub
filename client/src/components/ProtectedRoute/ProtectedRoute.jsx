import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "@/config/env";

const ProtectedRoute = ({ children, allowedRoles = null, redirectTo = "/" }) => {
	const [authStatus, setAuthStatus] = useState("loading");
	const navigate = useNavigate();

	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/me`, { withCredentials: true })
			.then((res) => {
				const userRole = res.data?.role || "user";

				if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
					setAuthStatus("forbidden");
					navigate(redirectTo, { replace: true });
					return;
				}

				setAuthStatus("authorized");
			})
			.catch(() => {
				setAuthStatus("unauthorized");
				navigate(redirectTo, { replace: true });
			});
	}, [allowedRoles, navigate, redirectTo]);

	if (authStatus === "loading") {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 font-sans text-foreground/80">
				Checking authentication...
			</div>
		);
	}

	return <>{children}</>;
};

export default ProtectedRoute;
