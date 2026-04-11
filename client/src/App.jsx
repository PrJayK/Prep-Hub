import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing/Landing';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));

const App = () => {

	return (
		<Router>
			<Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 font-sans text-foreground/70">Loading…</div>}>
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/dashboard" element={<Dashboard />} />
				</Routes>
			</Suspense>
		</Router>
	);
};

export default App;