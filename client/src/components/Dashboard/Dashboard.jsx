import React, { useState, useEffect } from "react";
import axios from "axios";

// import "./Dashboard.css";
import Navbar from "../Navbar/Navbar";
import EnrolledPane from "../EnrolledPane/EnrolledPane";
import MainContent from "../MainContent/MainContent";
import { BACKEND_URL } from "../../backend_url";


const Dashboard = (args) => {

    const [addCoursesButton, setAddCoursesButton] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const [enrolledCourses, setEnrolledCourses] = useState([]);
    
    useEffect(async () => {
        await axios.get(`http://${BACKEND_URL}:3000/api/getEnrolledCourses`)
        .then(async (res) => {
            setEnrolledCourses(res.data);
        })
        .catch((err) => {
            alert("An error occured. Couldn't fetch enrolled courses.");
        });
    }, []);

    useEffect(() => {
        setSelectedCourse(enrolledCourses[0]);
    }, [enrolledCourses]);

    // useEffect(() => {
    // }, [selectedCourse]);

    
    return (
        <>
            <Navbar isLoggedIn={args.isLoggedIn} setIsLoggedIn={args.setIsLoggedIn} setAddCoursesButton={setAddCoursesButton} />
            
            <div className="main-container">
                <EnrolledPane selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} setAddCoursesButton={setAddCoursesButton} enrolledCourses={enrolledCourses}/>
                <MainContent addCoursesButton={addCoursesButton} selectedCourse={selectedCourse} enrolledCourses={enrolledCourses} setEnrolledCourses={setEnrolledCourses} />
            </div>
        </>
    );
}

export default Dashboard;
