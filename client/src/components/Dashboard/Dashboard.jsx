import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../Navbar/Navbar";
import EnrolledPane from "../EnrolledPane/EnrolledPane";
import MainContent from "../MainContent/MainContent";
import Chatbot from "../Chatbot/Chatbot";
import { BACKEND_URL } from "@/config/env";
import { useToast } from "@/components/ui/toast-provider";


const Dashboard = (args) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [user, setUser] = useState(null);
    const [addCoursesButton, setAddCoursesButton] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [chatbotMode, setChatbotMode] = useState("closed");
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [chatResourceContext, setChatResourceContext] = useState(null);
    const [chatSourceRequest, setChatSourceRequest] = useState(null);

    const [enrolledCourses, setEnrolledCourses] = useState([]);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/api/me`, { withCredentials: true })
            .then((res) => setUser(res.data))
            .catch(() => {
                navigate("/", { replace: true });
            });
    }, [navigate]);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/api/getEnrolledCourses`, { withCredentials: true })
            .then((res) => {
                setEnrolledCourses(res.data);
            })
            .catch((error) => {
                if (error.response?.status === 401) {
                    navigate("/", { replace: true });
                    return;
                }
                toast({
                    title: "Couldn't load enrolled courses",
                    description: "We couldn't query your enrolled courses right now.",
                });
            });
    }, [navigate, toast]);

    useEffect(() => {
        setSelectedCourse(enrolledCourses[0]);
    }, [enrolledCourses]);

    useEffect(() => {
        if (isViewerOpen && chatbotMode === "docked") {
            setChatbotMode("floating");
        }
    }, [isViewerOpen, chatbotMode]);

    function handleAskAboutResource(resource) {
        setChatResourceContext(resource);
        setChatbotMode("floating");
    }

    function handleOpenChatSource(source) {
        setChatSourceRequest({
            ...source,
            requestId: `${source.resourceId}-${source.page ?? "none"}-${Date.now()}`
        });
    }

    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden font-sans bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
            <Navbar user={user} isLoggedIn={args.isLoggedIn} setIsLoggedIn={args.setIsLoggedIn} setAddCoursesButton={setAddCoursesButton} />
            <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
                <EnrolledPane selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} setAddCoursesButton={setAddCoursesButton} enrolledCourses={enrolledCourses}/>
                <MainContent
                    addCoursesButton={addCoursesButton}
                    selectedCourse={selectedCourse}
                    setSelectedCourse={setSelectedCourse}
                    enrolledCourses={enrolledCourses}
                    setEnrolledCourses={setEnrolledCourses}
                    onViewerOpenChange={setIsViewerOpen}
                    onAskAboutResource={handleAskAboutResource}
                    sourceRequest={chatSourceRequest}
                />
                <Chatbot
                    mode={chatbotMode}
                    setMode={setChatbotMode}
                    allowDocking={!isViewerOpen}
                    resourceContext={chatResourceContext}
                    clearResourceContext={() => setChatResourceContext(null)}
                    onOpenSource={handleOpenChatSource}
                />
            </div>
        </div>
    );
}

export default Dashboard;
