/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ArrowLeft,
	ChevronDown,
	Expand,
	FileText,
	MessageSquare,
	Plus,
	Send,
	Shrink,
	StopCircle,
	Trash2,
	X,
} from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/config/env";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

const INITIAL_MESSAGES = [
	{
		id: 1,
		author: "AI",
		text: "**Hi there!**\n\nI'm Prep-Hub AI, your study assistant. Ask me anything about your courses, and I'll help you learn effectively!\n\n*What would you like to explore today?*",
		sources: [],
	},
];

const getConversationId = (conversation) =>
	conversation?.conversationId ?? conversation?._id ?? conversation?.id ?? null;

const normalizeConversation = (conversation) => ({
	id: getConversationId(conversation),
	title: conversation?.title || "New Chat",
	lastMessage: conversation?.lastMessage || "No messages yet",
	updatedAt: conversation?.updatedAt || conversation?.createdAt || null,
});

const normalizeMessage = (messageItem, index) => ({
	id: messageItem?._id ?? messageItem?.id ?? `${messageItem?.role || "message"}-${index}`,
	author: messageItem?.author ?? (messageItem?.role === "user" ? "user" : "AI"),
	text: messageItem?.text ?? messageItem?.content ?? "",
	sources: Array.isArray(messageItem?.sources) ? messageItem.sources : [],
});

const formatConversationTime = (value) => {
	if (!value) return "";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
};

const Chatbot = ({
	mode = "closed",
	setMode,
	allowDocking = true,
	resourceContext,
	clearResourceContext,
	onOpenSource,
}) => {
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState(INITIAL_MESSAGES);
	const [isLoading, setIsLoading] = useState(false);
	const [abortController, setAbortController] = useState(null);
	const messagesContainerRef = useRef(null);
	const [chatView, setChatView] = useState("chat");
	const [conversations, setConversations] = useState([]);
	const [activeConversation, setActiveConversation] = useState(null);
	const [conversationId, setConversationId] = useState(null);
	const [conversationStarted, setConversationStarted] = useState(false);
	const [isConversationsLoading, setIsConversationsLoading] = useState(false);
	const [isMessagesLoading, setIsMessagesLoading] = useState(false);
	const [deletingConversationId, setDeletingConversationId] = useState(null);
	const [historyUnavailable, setHistoryUnavailable] = useState(false);
	const [activeResourceContext, setActiveResourceContext] = useState(null);
	const isFloating = mode === "floating";
	const isDocked = mode === "docked";

	const loadConversations = useCallback(async () => {
		setIsConversationsLoading(true);
		setHistoryUnavailable(false);

		try {
			const response = await axios.get(`${BACKEND_URL}/api/chat/conversations`, {
				withCredentials: true,
			});
			const conversationItems = response.data?.conversations ?? response.data ?? [];

			setConversations(
				Array.isArray(conversationItems)
					? conversationItems.map(normalizeConversation).filter((item) => item.id)
					: []
			);
		} catch (error) {
			setHistoryUnavailable(true);
			setConversations([]);
		} finally {
			setIsConversationsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (resourceContext?._id) {
			setActiveResourceContext(resourceContext);
			setActiveConversation(null);
			setConversationId(null);
			setConversationStarted(false);
			setMessages(INITIAL_MESSAGES);
			setMessage("");
			setChatView("chat");
		}
	}, [resourceContext]);

	useEffect(() => {
		if (mode !== "closed" && chatView === "conversations") {
			loadConversations();
		}
	}, [chatView, loadConversations, mode]);

	useEffect(() => {
		const container = messagesContainerRef.current;
		if (!container || mode === "closed" || chatView !== "chat") return;

		container.scrollTo({
			top: container.scrollHeight,
			behavior: "smooth",
		});
	}, [chatView, messages, mode]);

	const startNewConversation = () => {
		setActiveConversation(null);
		setConversationId(null);
		setConversationStarted(false);
		setMessages(INITIAL_MESSAGES);
		setMessage("");
		setChatView("chat");
	};

	const openConversation = async (conversation) => {
		const selectedConversation = normalizeConversation(conversation);
		if (!selectedConversation.id) return;

		setActiveConversation(selectedConversation);
		setConversationId(selectedConversation.id);
		setConversationStarted(true);
		setChatView("chat");
		setIsMessagesLoading(true);
		setMessages([]);

		try {
			const response = await axios.get(
				`${BACKEND_URL}/api/chat/conversations/${selectedConversation.id}/messages`,
				{ withCredentials: true }
			);
			const messageItems = response.data?.messages ?? response.data ?? [];
			const nextMessages = Array.isArray(messageItems)
				? messageItems.map(normalizeMessage).filter((item) => item.text)
				: [];

			setMessages(nextMessages.length ? nextMessages : INITIAL_MESSAGES);
		} catch (error) {
			setMessages([
				{
					id: "load-error",
					author: "AI",
					text: "I couldn't load this conversation yet.",
				},
			]);
		} finally {
			setIsMessagesLoading(false);
		}
	};

	const returnToConversations = () => {
		setChatView("conversations");
		loadConversations();
	};

	const handleDeleteConversation = async (conversationToDelete) => {
		const selectedConversation = normalizeConversation(conversationToDelete);
		if (!selectedConversation.id || deletingConversationId) return;

		setDeletingConversationId(selectedConversation.id);

		try {
			await axios.delete(
				`${BACKEND_URL}/api/chat/conversations/${selectedConversation.id}`,
				{ withCredentials: true }
			);

			setConversations((current) =>
				current.filter((conversation) => conversation.id !== selectedConversation.id)
			);

			if (conversationId === selectedConversation.id) {
				startNewConversation();
			}
		} catch (error) {
			console.error("Error deleting conversation:", error);
		} finally {
			setDeletingConversationId(null);
		}
	};

	const handleSendMessage = () => {
		const trimmed = message.trim();
		if (!trimmed || isLoading || isMessagesLoading) return;

		setIsLoading(true);
		const controller = new AbortController();
		setAbortController(controller);

		const userMessage = { id: Date.now(), author: "user", text: trimmed };
		const thinkingMessage = {
			id: Date.now() + 1,
			author: "AI",
			text: "thinking...",
			sources: [],
			isThinking: true,
		};

		setMessages((current) => [...current, userMessage, thinkingMessage]);
		setMessage("");

		const shouldStartNewConversation = !conversationStarted || !conversationId;
		const requestPayload = {
			query: {
				text: trimmed,
				isNewConversation: shouldStartNewConversation,
				conversationId: shouldStartNewConversation ? undefined : conversationId,
				resourceId: activeResourceContext?._id,
			},
		};

		axios
			.post(`${BACKEND_URL}/api/chat`, requestPayload, {
				withCredentials: true,
				signal: controller.signal,
			})
			.then((response) => {
				const responseData = response.data;
				const answerText = responseData?.content ?? responseData;
				const answerSources = Array.isArray(responseData?.sources) ? responseData.sources : [];
				const returnedConversationId = responseData?.conversationId;
				const returnedConversationTitle = responseData?.conversationTitle;
				const nextUpdatedAt = new Date().toISOString();

				if (returnedConversationId) {
					setConversationId(returnedConversationId);
				}
				if (shouldStartNewConversation) {
					setConversationStarted(true);

					if (returnedConversationId) {
						const newConversation = {
							id: returnedConversationId,
							title: returnedConversationTitle || trimmed.slice(0, 54),
							lastMessage: answerText,
							updatedAt: nextUpdatedAt,
						};

						setActiveConversation(newConversation);
						setConversations((current) => [
							newConversation,
							...current.filter((item) => item.id !== returnedConversationId),
						]);
					}
				} else if (conversationId) {
					setActiveConversation((current) =>
						current
							? { ...current, lastMessage: answerText, updatedAt: nextUpdatedAt }
							: current
					);
					setConversations((current) =>
						current.map((item) =>
							item.id === conversationId
								? { ...item, lastMessage: answerText, updatedAt: nextUpdatedAt }
								: item
						)
					);
				}

				setMessages((current) =>
					current.map((msg) =>
						msg.isThinking
							? { ...msg, text: answerText, sources: answerSources, isThinking: false }
							: msg
					)
				);
			})
			.catch((error) => {
				if (axios.isCancel(error)) {
					setMessages((current) => current.filter((msg) => !msg.isThinking));
				} else {
					setMessages((current) =>
						current.map((msg) =>
							msg.isThinking
								? { ...msg, text: "An error occurred", isThinking: false }
								: msg
						)
					);
				}
			})
			.finally(() => {
				setIsLoading(false);
				setAbortController(null);
			});
	};

	const handleInputKeyDown = (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	};

	const handleOpenSource = (source) => {
		if (!source?.resourceId) {
			return;
		}

		onOpenSource?.(source);
	};

	const conversationTitle = activeConversation?.title || "New Chat";

	const windowControls = (
		<div className="flex items-center gap-2">
			{allowDocking && isFloating ? (
				<button
					type="button"
					className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition hover:bg-muted/80"
					onClick={() => setMode("docked")}
					aria-label="Expand chat into page"
				>
					<Expand className="h-4 w-4" />
				</button>
			) : null}
			{isDocked ? (
				<button
					type="button"
					className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition hover:bg-muted/80"
					onClick={() => setMode("floating")}
					aria-label="Shrink chat window"
				>
					<Shrink className="h-4 w-4" />
				</button>
			) : (
				<button
					type="button"
					className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition hover:bg-muted/80"
					onClick={() => setMode("closed")}
					aria-label="Close chat"
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);

	const conversationsView = (
		<div className="flex min-h-0 flex-1 flex-col bg-card/95">
			<div className="flex h-14 items-center justify-between border-b border-border bg-background/90 px-4">
				<div className="min-w-0">
					<p className="text-sm font-semibold text-foreground">Prep-Hub AI</p>
					<p className="text-xs text-foreground/70">Conversations</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<button
						type="button"
						className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground transition hover:bg-primary/90"
						onClick={startNewConversation}
						aria-label="Start new chat"
					>
						<Plus className="h-4 w-4" />
					</button>
					{windowControls}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
				{isConversationsLoading ? (
					<div className="flex h-full items-center justify-center px-6 text-center text-sm text-foreground/65">
						Loading conversations...
					</div>
				) : historyUnavailable ? (
					<div className="flex h-full flex-col items-center justify-center px-8 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<MessageSquare className="h-5 w-5" />
						</div>
						<p className="text-sm font-medium text-foreground">
							Conversation history is not ready yet.
						</p>
						<p className="mt-1 text-xs leading-5 text-foreground/65">
							Start a new chat for now.
						</p>
					</div>
				) : conversations.length ? (
					<div className="space-y-1">
						{conversations.map((conversation) => (
							<div
								key={conversation.id}
								className="cursor-pointer group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-muted/70"
							>
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
									<MessageSquare className="h-5 w-5" />
								</div>
								<button
									type="button"
									className="cursor-pointer flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
									onClick={() => openConversation(conversation)}
								>
									<p className="truncate text-sm font-semibold text-foreground">
											{conversation.title}
									</p>
									<div className="relative h-8 w-8 shrink-0">
										<span className="absolute inset-0 flex items-center justify-center text-[11px] text-foreground/45 transition group-hover:opacity-0">
											{formatConversationTime(conversation.updatedAt)}
										</span>
									</div>
								</button>
								<button
									type="button"
									className="absolute right-3 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-foreground/55 opacity-0 transition hover:bg-background hover:text-destructive group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
									onClick={() => handleDeleteConversation(conversation)}
									aria-label={`Delete ${conversation.title}`}
									disabled={deletingConversationId === conversation.id}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				) : (
					<div className="flex h-full flex-col items-center justify-center px-8 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<MessageSquare className="h-5 w-5" />
						</div>
						<p className="text-sm font-medium text-foreground">No conversations yet.</p>
						<button
							type="button"
							className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
							onClick={startNewConversation}
						>
							<Plus className="h-4 w-4" />
							New chat
						</button>
					</div>
				)}
			</div>
		</div>
	);

	const chatTitle = (
		<div>
			<p className="max-w-[220px] truncate text-sm font-semibold text-foreground">
				{conversationTitle}
			</p>
			<p className="text-xs text-foreground/70">Prep-Hub AI</p>
		</div>
	);

	const messagesView = (
		<div
			ref={messagesContainerRef}
			className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
		>
			{isMessagesLoading ? (
				<div className="flex flex-1 items-center justify-center text-sm text-foreground/65">
					Loading messages...
				</div>
			) : (
				messages.map((messageItem) => (
					<div
						key={messageItem.id}
						className={`flex min-w-0 ${
							messageItem.author === "AI" ? "justify-start" : "justify-end"
						}`}
					>
						<div
							className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
								messageItem.author === "AI"
									? "rounded-tl-none bg-muted text-foreground"
									: "rounded-tr-none bg-primary text-primary-foreground"
							}`}
						>
							{messageItem.author === "AI" ? (
								<div className="space-y-3">
									<div className="prose prose-sm max-w-none text-foreground">
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											rehypePlugins={[rehypeHighlight]}
										>
											{messageItem.text}
										</ReactMarkdown>
									</div>
									{messageItem.sources?.length ? (
										<div className="space-y-2 border-t border-border/60 pt-2">
											<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
												Sources
											</p>
											<div className="flex flex-wrap gap-2">
												{messageItem.sources.map((source, sourceIndex) => (
													<button
														key={source.id ?? `${messageItem.id}-source-${sourceIndex}`}
														type="button"
														onClick={() => handleOpenSource(source)}
														title={source.preview || source.claim || source.label}
														className="group inline-flex max-w-full cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background/85 px-3 py-2 text-left text-xs text-foreground/80 transition hover:border-primary/35 hover:bg-background"
													>
														<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary/15">
															<FileText className="h-3.5 w-3.5" />
														</span>
														<span className="min-w-0">
															<span className="block truncate font-medium text-foreground">
																{source.label}
																{source.page ? ` p.${source.page}` : ""}
															</span>
															{source.claim || source.preview ? (
																<span className="block max-w-[220px] truncate text-[11px] text-foreground/55">
																	{source.claim || source.preview}
																</span>
															) : null}
														</span>
													</button>
												))}
											</div>
										</div>
									) : null}
								</div>
							) : (
								messageItem.text
							)}
						</div>
					</div>
				))
			)}
		</div>
	);

	const composer = (
		<div className="border-t border-border bg-background/90 p-4">
			{activeResourceContext ? (
				<div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/8 px-3 py-2">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-foreground">
							Asking about {activeResourceContext.name}
						</p>
						<p className="text-xs text-foreground/65">
							Your next message will be scoped to this resource.
						</p>
					</div>
					<button
						type="button"
						className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:bg-muted"
						onClick={() => {
							setActiveResourceContext(null);
							clearResourceContext?.();
						}}
						aria-label="Clear resource context"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			) : null}
			<label className="sr-only" htmlFor="chatbot-input">
				Type a message
			</label>
			<div className="flex items-end gap-2">
				<textarea
					id="chatbot-input"
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					onKeyDown={handleInputKeyDown}
					rows={1}
					disabled={isLoading || isMessagesLoading}
					className="min-h-[46px] w-full resize-none rounded-2xl border border-border bg-muted/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
					placeholder="Ask a question or request resources..."
				/>
				<button
					type="button"
					onClick={
						isLoading
							? () => {
									if (abortController) abortController.abort();
								}
							: handleSendMessage
					}
					className="inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
					disabled={isMessagesLoading || (!isLoading && !message.trim())}
				>
					{isLoading ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
				</button>
			</div>
		</div>
	);

	const chatHeader = (
		<div className="flex h-14 items-center justify-between border-b border-border bg-background/85 px-3">
			<div className="flex min-w-0 items-center gap-2">
				<button
					type="button"
					className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-foreground transition hover:bg-muted"
					onClick={returnToConversations}
					aria-label="Back to conversations"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>
				{chatTitle}
			</div>
			{windowControls}
		</div>
	);

	const conversationShell = (
		<>
			{chatHeader}
			{messagesView}
			{composer}
		</>
	);

	if (isDocked) {
		return (
			<aside className="flex min-h-0 w-[min(520px,52vw)] min-w-[380px] shrink-0 flex-col border-l border-border bg-card/70 backdrop-blur-xl">
				{chatView === "conversations" ? conversationsView : conversationShell}
			</aside>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
			{isFloating && (
				<div className="origin-bottom-right w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl">
					<div className="flex h-[min(620px,calc(100vh-7rem))] min-h-[420px] flex-col overflow-hidden rounded-3xl">
						{chatView === "conversations" ? conversationsView : conversationShell}
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => {
					if (isFloating) {
						setMode("closed");
					} else {
						setMode("floating");
						startNewConversation();
					}
				}}
				className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_40px_rgba(59,130,246,0.18)] transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
			>
				{isFloating ? (
					<ChevronDown className="h-5 w-5" />
				) : (
					<MessageSquare className="h-5 w-5" />
				)}
				<span>{isFloating ? "Hide chat" : "Chat"}</span>
			</button>
		</div>
	);
};

export default Chatbot;
