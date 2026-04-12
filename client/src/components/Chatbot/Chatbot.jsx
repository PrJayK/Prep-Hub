import { useEffect, useRef, useState } from "react";
import {
	ChevronDown,
	Expand,
	MessageSquare,
	Send,
	Shrink,
	StopCircle,
	X,
} from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/config/env";

// eslint-disable-next-line react/prop-types
const Chatbot = ({ mode = "closed", setMode }) => {
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState([
		{
			id: 1,
			author: "AI",
			text: "Hi there! I'm your study assistant. Ask me anything about your courses.",
		},
	]);
	const [isLoading, setIsLoading] = useState(false);
	const [abortController, setAbortController] = useState(null);
	const messagesContainerRef = useRef(null);

	const isFloating = mode === "floating";
	const isDocked = mode === "docked";

	useEffect(() => {
		const container = messagesContainerRef.current;
		if (!container || mode === "closed") return;

		container.scrollTo({
			top: container.scrollHeight,
			behavior: "smooth",
		});
	}, [messages, mode]);

	const handleSendMessage = () => {
		const trimmed = message.trim();
		if (!trimmed || isLoading) return;

		setIsLoading(true);
		const controller = new AbortController();
		setAbortController(controller);

		const userMessage = { id: Date.now(), author: "user", text: trimmed };
		const thinkingMessage = { id: Date.now() + 1, author: "AI", text: "thinking...", isThinking: true };

		setMessages((current) => [...current, userMessage, thinkingMessage]);
		setMessage("");

		axios
			.post(`${BACKEND_URL}/api/chat`, { query: trimmed }, { signal: controller.signal })
			.then((response) => {
				setMessages((current) =>
					current.map((msg) =>
						msg.isThinking ? { ...msg, text: response.data, isThinking: false } : msg
					)
				);
			})
			.catch((error) => {
				if (axios.isCancel(error)) {
					setMessages((current) => current.filter((msg) => !msg.isThinking));
				} else {
					setMessages((current) =>
						current.map((msg) =>
							msg.isThinking ? { ...msg, text: "An error occurred", isThinking: false } : msg
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

	const title = (
		<div>
			<p className="text-sm font-semibold text-foreground">Prep Hub AI</p>
			<p className="text-xs text-foreground/70">Your on-demand study coach.</p>
		</div>
	);

	const messagesView = (
		<div
			ref={messagesContainerRef}
			className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
		>
			{messages.map((messageItem) => (
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
						{messageItem.text}
					</div>
				</div>
			))}
		</div>
	);

	const composer = (
		<div className="border-t border-border bg-background/90 p-4">
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
					disabled={isLoading}
					className="min-h-[46px] w-full resize-none rounded-2xl border border-border bg-muted/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
					placeholder="Ask a question or request resources..."
				/>
				<button
					type="button"
					onClick={isLoading ? () => { if (abortController) abortController.abort(); } : handleSendMessage}
					className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
					disabled={!isLoading && !message.trim()}
				>
					{isLoading ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
				</button>
			</div>
		</div>
	);

	if (isDocked) {
		return (
			<aside className="flex min-h-0 w-[min(380px,36vw)] min-w-[300px] shrink-0 flex-col border-l border-border bg-card/70 backdrop-blur-xl">
				<div className="flex h-14 items-center justify-between border-b border-border bg-background/85 px-4">
					{title}
					<button
						type="button"
						className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition hover:bg-muted/80"
						onClick={() => setMode("floating")}
						aria-label="Shrink chat window"
					>
						<Shrink className="h-4 w-4" />
					</button>
				</div>
				{messagesView}
				{composer}
			</aside>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
			{isFloating && (
				<div className="origin-bottom-right w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl">
					<div className="flex items-center justify-between rounded-t-3xl border-b border-border bg-background/90 px-4 py-3">
						{title}
						<div className="flex items-center gap-2">
							<button
								type="button"
								className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition hover:bg-muted/80"
								onClick={() => setMode("docked")}
								aria-label="Expand chat into page"
							>
								<Expand className="h-4 w-4" />
							</button>
							<button
								type="button"
								className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition hover:bg-muted/80"
								onClick={() => setMode("closed")}
								aria-label="Close chat"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					</div>

					<div className="flex h-[calc(60vh-124px)] max-h-[420px] min-h-[320px] flex-col">
						{messagesView}
					</div>
					{composer}
				</div>
			)}

			<button
				type="button"
				onClick={() => setMode(isFloating ? "closed" : "floating")}
				className="inline-flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_40px_rgba(59,130,246,0.18)] transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
