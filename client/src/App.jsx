import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing/Landing';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ToastProvider } from './components/ui/toast-provider';

const Search = lazy(() => import('./components/Search/Search'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Contribute = lazy(() => import('./components/Contribute/Contribute'));
const Admin = lazy(() => import('./components/Admin/Admin'));
const AdminReview = lazy(() => import('./components/AdminReview/AdminReview'));
const AdminResources = lazy(() => import('./components/AdminResources/AdminResources'));
const NotFound = lazy(() => import('./components/NotFound/NotFound'));

const App = () => {
	return (
		<Router>
			<ToastProvider>
				<Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 font-sans text-foreground/70">Loading...</div>}>
					<Routes>
						<Route path="/" element={<Landing />} />
						<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
						<Route path="/contribute" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
						<Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Admin /></ProtectedRoute>} />
						<Route path="/admin/review" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReview /></ProtectedRoute>} />
						<Route path="/admin/resources" element={<ProtectedRoute allowedRoles={["admin"]}><AdminResources /></ProtectedRoute>} />
						<Route path="/search" element={<Search />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Suspense>
			</ToastProvider>
		</Router>
	);
};

export default App;
