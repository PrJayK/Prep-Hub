import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, File, Text } from 'lucide-react'
import axios from 'axios'
import { BACKEND_URL } from '@/config/env'
import Navbar from '../Navbar/Navbar'


export default function SearchPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')
	const [results, setResults] = useState([])
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		const query = searchParams.get('q') || ''
		setSearchQuery(query)
	}, [searchParams])

	useEffect(() => {
		if (!searchQuery.trim()) {
			setResults([])
			return
		}

		setIsLoading(true)
		axios
			.get(`${BACKEND_URL}/api/search`, {
				withCredentials: true,
				params: { q: searchQuery },
			})
			.then((response) => {
				console.log(response.data)
				setResults(response.data)
			})
			.catch(() => {
				alert('Error fetching search results')
				setResults([])
			})
			.finally(() => {
				setIsLoading(false)
			})
	}, [searchQuery])

	const getIconForType = (type) => {
		switch (type) {
			case 'document':
				return File
			case 'text':
				return Text
			default:
				return File
		}
	}

	return (
		<div className="flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 font-sans text-foreground">
			<Navbar />
			<div className="flex min-h-0 flex-1 overflow-auto">
				<main className="flex-1 bg-background/30">
					<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
						<div className="mb-8">
							<button
								onClick={() => navigate('/dashboard')}
								className="mb-4 flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
							>
								<ArrowLeft className="h-4 w-4" />
								Back
							</button>
							<h1 className="mb-2 text-3xl font-bold text-foreground">
								Search Results
							</h1>
							{searchQuery && (
								<p className="text-sm text-foreground/70">
									Found {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
									<span className="font-semibold">&quot;{searchQuery}&quot;</span>
								</p>
							)}
						</div>

						{isLoading ? (
							<div className="rounded-3xl border border-border bg-card/80 p-12 text-center shadow-sm">
								<p className="text-sm text-foreground/70">Searching resources...</p>
							</div>
						) : results.length > 0 ? (
							<div className="space-y-3">
								{results.map((result) => {
									const IconComponent = getIconForType(result.dataType);
									return (
										<div
											key={result.id}
											className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/45 hover:bg-accent/35 hover:shadow-md"
										>
											<div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
												<IconComponent className="h-5 w-5" />
											</div>
											<div className="flex-1">
												<h3 className="mb-1 font-medium text-foreground">
													{result.name}
												</h3>
												<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
													<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/75">
														{result.dataType}
													</span>
													<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
														{result.course ? result.course : 'General'}
													</span>
													<span>{new Date(result.uploadTime).toLocaleDateString()}</span>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center shadow-sm">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
									<File className="h-8 w-8" />
								</div>
								<h3 className="mb-2 text-lg font-medium text-foreground">
									{searchQuery ? 'No results found' : 'Start a search'}
								</h3>
								<p className="text-sm text-foreground/70">
									{searchQuery
										? 'Try searching with different keywords.'
										: 'Use the shared search bar above to look through documents and resources.'}
								</p>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	)
}
