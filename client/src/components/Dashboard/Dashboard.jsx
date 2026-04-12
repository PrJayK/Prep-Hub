import { useState, useEffect } from "react";
import axios from "axios";

import Navbar from "../Navbar/Navbar";
import EnrolledPane from "../EnrolledPane/EnrolledPane";
import MainContent from "../MainContent/MainContent";
import Chatbot from "../Chatbot/Chatbot";
import { BACKEND_URL } from "@/config/env";


const Dashboard = (args) => {

    const [addCoursesButton, setAddCoursesButton] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [chatbotMode, setChatbotMode] = useState("closed");

    const [enrolledCourses, setEnrolledCourses] = useState([]);

    useEffect(() => {
        axios
        .get(
            `${BACKEND_URL}/api/getEnrolledCourses`,
            { withCredentials: true }
        )
        .then((res) => {
            setEnrolledCourses(res.data);
        })
        .catch(() => {
            alert("An error occured. Couldn't query for enrolled courses.");
        });
    }, []);

    useEffect(() => {
        setSelectedCourse(enrolledCourses[0]);
    }, [enrolledCourses]);

    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden font-sans bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
            <Navbar isLoggedIn={args.isLoggedIn} setIsLoggedIn={args.setIsLoggedIn} setAddCoursesButton={setAddCoursesButton} />
            <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
                <EnrolledPane selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} setAddCoursesButton={setAddCoursesButton} enrolledCourses={enrolledCourses}/>
                <MainContent addCoursesButton={addCoursesButton} selectedCourse={selectedCourse} enrolledCourses={enrolledCourses} setEnrolledCourses={setEnrolledCourses} />
                <Chatbot mode={chatbotMode} setMode={setChatbotMode} />
            </div>
        </div>
    );
}

export default Dashboard;
