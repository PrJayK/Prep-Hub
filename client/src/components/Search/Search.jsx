/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, LockOpen, Search as SearchIcon } from 'lucide-react'
import axios from 'axios'

import { BACKEND_URL } from '@/config/env'
import Navbar from '../Navbar/Navbar'
import ResourceViewer from '@/components/ResourceViewer/ResourceViewer'
import { getViewerType } from '@/components/ResourceViewer/resourceViewer.utils'
import { useToast } from '@/components/ui/toast-provider'

const emptyViewer = {
	open: false,
	loading: false,
	error: '',
	name: '',
	key: '',
	resourceId: '',
	url: '',
	content: '',
	type: 'unsupported',
	pageNumber: 1,
	scale: 1,
	highlightPageNumber: null,
	highlightStartChar: null,
	highlightEndChar: null,
}

function SearchSection({ title, description, icon: Icon, accentClassName, results, onOpenResult }) {
	if (results.length === 0) {
		return (
			<section className="rounded-3xl border border-dashed border-border bg-card/70 p-6 shadow-sm">
				<div className="mb-4 flex items-center gap-3">
					<div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClassName}`}>
						<Icon className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-foreground">{title}</h2>
						<p className="text-sm text-foreground/65">{description}</p>
					</div>
				</div>
				<p className="text-sm text-foreground/65">No matching resources in this section yet.</p>
			</section>
		)
	}

	return (
		<section className="rounded-3xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-sm">
			<div className="mb-5 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClassName}`}>
						<Icon className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-foreground">{title}</h2>
						<p className="text-sm text-foreground/65">{description}</p>
					</div>
				</div>
				<span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground/70">
					{results.length} result{results.length !== 1 ? 's' : ''}
				</span>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{results.map((result, index) => (
					<button
						type="button"
						key={`${result.resourceId}-${result.courseId}-${index}`}
						onClick={() => onOpenResult(result)}
						className="cursor-pointer group flex h-[300px] w-full flex-col overflow-hidden rounded-[1.35rem] border border-border/80 bg-gradient-to-br from-background via-background to-muted/25 p-5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
					>
						<div className="mb-4 flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="line-clamp-2 text-[1.02rem] font-semibold leading-6 tracking-[-0.01em] text-foreground">
									{result.resourceName}
								</p>
								<p className="mt-2 line-clamp-2 text-sm leading-5 text-foreground/62">
									Found in <span className="font-medium text-foreground/85">{result.courseName}</span>
								</p>
							</div>
							<span className="shrink-0 rounded-full border border-primary/10 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
								{result.dataType}
							</span>
						</div>
						{typeof result.pageNumber === 'number' ? (
							<p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-foreground/55">
								Page {result.pageNumber}
							</p>
						) : null}
						<div className="flex-1 overflow-hidden rounded-2xl bg-muted/35 px-4 py-3">
							<p className="line-clamp-6 break-words text-sm leading-6 text-foreground/78">
								{result.pageContent || ''}
							</p>
						</div>
					</button>
				))}
			</div>
		</section>
	)
}

export default function SearchPage() {
	const [user, setUser] = useState(null)
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { toast } = useToast()
	const [searchQuery, setSearchQuery] = useState('')
	const [groupedResults, setGroupedResults] = useState({
		enrolledResults: [],
		nonEnrolledResults: [],
	})
	const [isLoading, setIsLoading] = useState(false)
	const [viewer, setViewer] = useState(emptyViewer)

	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/me`, { withCredentials: true })
			.then((res) => setUser(res.data))
			.catch(() => {
				// ignore; user data not required for search page if unauthorized
			})
	}, [])

	useEffect(() => {
		const query = searchParams.get('q') || ''
		setSearchQuery(query)
	}, [searchParams])

	useEffect(() => {
		if (!searchQuery.trim()) {
			setGroupedResults({ enrolledResults: [], nonEnrolledResults: [] })
			return
		}

		setIsLoading(true)
		axios
			.get(`${BACKEND_URL}/api/search`, {
				withCredentials: true,
				params: { q: searchQuery },
			})
			.then((response) => {
				setGroupedResults({
					enrolledResults: response.data?.enrolledResults ?? [],
					nonEnrolledResults: response.data?.nonEnrolledResults ?? [],
				})
			})
			.catch(() => {
				toast({
					title: 'Search failed',
					description: "We couldn't fetch search results right now.",
				})
				setGroupedResults({ enrolledResults: [], nonEnrolledResults: [] })
			})
			.finally(() => {
				setIsLoading(false)
			})
	}, [searchQuery, toast])

	const totalResults = useMemo(
		() => groupedResults.enrolledResults.length + groupedResults.nonEnrolledResults.length,
		[groupedResults]
	)

	function closeViewer() {
		setViewer(emptyViewer)
	}

	function getLockedCourseNames(resourceId) {
		return Array.from(
			new Set(
				groupedResults.nonEnrolledResults
					.filter((result) => result.resourceId === resourceId)
					.map((result) => result.courseName)
					.filter(Boolean)
			)
		)
	}

	function handleLockedResultClick(result) {
		const lockedCourseNames = getLockedCourseNames(result.resourceId)

		toast({
			title: 'Access locked',
			description: lockedCourseNames.length
				? `You are not enrolled in the course${lockedCourseNames.length > 1 ? 's' : ''}: ${lockedCourseNames.join(', ')}.`
				: 'You are not enrolled in the course for this resource.',
		})
	}

	function openViewerForResult(result) {
		const resource = {
			_id: result.resourceId,
			name: result.resourceName,
			AWSKey: result.awsKey,
			dataType: result.dataType,
			content: result.resourceContent,
		}
		const viewerType = getViewerType(resource)

		setViewer({
			open: true,
			loading: viewerType !== 'text',
			error: '',
			name: result.resourceName || 'Resource',
			key: result.awsKey || '',
			resourceId: result.resourceId || '',
			url: '',
			content: result.resourceContent || result.pageContent || '',
			type: viewerType,
			pageNumber: typeof result.pageNumber === 'number' ? result.pageNumber : 1,
			scale: 1,
			highlightPageNumber:
				typeof result.pageNumber === 'number' ? result.pageNumber : null,
			highlightStartChar:
				typeof result.startChar === 'number' ? result.startChar : null,
			highlightEndChar:
				typeof result.endChar === 'number' ? result.endChar : null,
		})

		if (viewerType === 'text') {
			return
		}

		axios
			.post(
				`${BACKEND_URL}/api/aws/getObjectUrl`,
				{ key: result.awsKey },
				{ withCredentials: true }
			)
			.then((res) => {
				setViewer((currentViewer) => ({
					...currentViewer,
					loading: false,
					url: res.data.url,
				}))
			})
			.catch(() => {
				setViewer((currentViewer) => ({
					...currentViewer,
					loading: false,
					error: "We couldn't fetch a temporary URL for this file.",
				}))
			})
	}

	function handleZoomIn() {
		setViewer((currentViewer) => ({
			...currentViewer,
			scale: Math.min(currentViewer.scale + 0.25, currentViewer.type === 'image' ? 3 : 2.5),
		}))
	}

	function handleZoomOut() {
		setViewer((currentViewer) => ({
			...currentViewer,
			scale: Math.max(currentViewer.scale - 0.25, currentViewer.type === 'image' ? 0.5 : 0.75),
		}))
	}

	function handleResetZoom() {
		setViewer((currentViewer) => ({
			...currentViewer,
			scale: 1,
		}))
	}

	function handleOpenInNewTab() {
		if (!viewer.key) {
			return
		}

		axios
			.post(
				`${BACKEND_URL}/api/aws/getObjectUrl`,
				{ key: viewer.key },
				{ withCredentials: true }
			)
			.then((res) => {
				window.open(res.data.url, '_blank', 'noopener,noreferrer')
			})
			.catch(() => {
				setViewer((currentViewer) => ({
					...currentViewer,
					error: "We couldn't fetch a fresh URL to open this file in a new tab.",
				}))
			})
	}

	return (
		<div className="flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 font-sans text-foreground">
			<Navbar user={user} />
			<div className="flex min-h-0 flex-1 overflow-auto">
				<main className="flex-1 bg-background/30">
					<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
						<div className="mb-8">
							<button
								onClick={() => navigate('/dashboard')}
								className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
							>
								<ArrowLeft className="h-4 w-4" />
								Back
							</button>
							<h1 className="mb-2 text-3xl font-bold text-foreground">
								Search Results
							</h1>
							{searchQuery ? (
								<p className="max-w-2xl text-sm leading-6 text-foreground/70">
									{totalResults} result{totalResults !== 1 ? 's' : ''} for{' '}
									<span className="font-semibold">&quot;{searchQuery}&quot;</span>, grouped by whether the matching resource belongs to one of your enrolled courses.
								</p>
							) : null}
						</div>

						{isLoading ? (
							<div className="rounded-3xl border border-border bg-card/80 p-12 text-center shadow-sm">
								<p className="text-sm text-foreground/70">Searching resources...</p>
							</div>
						) : totalResults > 0 ? (
							<div className="space-y-6">
								<SearchSection
									title="Resources From Your Enrolled Courses"
									description="The closest matching chunks from the courses you already have access to."
									icon={BookOpen}
									accentClassName="bg-emerald-500/10 text-emerald-600"
									results={groupedResults.enrolledResults}
									onOpenResult={openViewerForResult}
								/>
								<SearchSection
									title="Resources Not From Your Enrolled Courses"
									description="Useful matches from courses outside your current enrollments."
									icon={LockOpen}
									accentClassName="bg-amber-500/10 text-amber-600"
									results={groupedResults.nonEnrolledResults}
									onOpenResult={handleLockedResultClick}
								/>
							</div>
						) : (
							<div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center shadow-sm">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
									{searchQuery ? <FileText className="h-8 w-8" /> : <SearchIcon className="h-8 w-8" />}
								</div>
								<h3 className="mb-2 text-lg font-medium text-foreground">
									{searchQuery ? 'No results found' : 'Start a search'}
								</h3>
								<p className="mx-auto max-w-md text-sm text-foreground/70">
									{searchQuery
										? 'Try searching with a different phrase or a more specific course topic.'
										: 'Use the shared search bar above to look through documents and resources.'}
								</p>
							</div>
						)}
					</div>
				</main>
			</div>
			<ResourceViewer
				viewer={viewer}
				onClose={closeViewer}
				onOpenInNewTab={handleOpenInNewTab}
				onZoomIn={handleZoomIn}
				onZoomOut={handleZoomOut}
				onResetZoom={handleResetZoom}
			/>
		</div>
	)
}
