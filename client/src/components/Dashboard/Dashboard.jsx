import React, { useState, useEffect } from "react";
import axios from "axios";

// import "./Dashboard.css";
import Navbar from "../Navbar/Navbar";
import EnrolledPane from "../EnrolledPane/EnrolledPane";
import MainContent from "../MainContent/MainContent";


const Dashboard = (args) => {

    const [addCoursesButton, setAddCoursesButton] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const [enrolledCourses, setEnrolledCourses] = useState([]);
    
    useEffect(() => {
        async function fetchData() {
            await axios.get('http://localhost:3000/api/getEnrolledCourses')
            .then(async (res) => {
                console.log(enrolledCourses);
                setEnrolledCourses(res.data);
            })
            .catch((err) => {
                alert("An error occured. Couldn't fetch enrolled courses.");
            });
        }
        fetchData();
    }, []);

    useEffect(() => {
        console.log("enrolled courses:");
        console.log(enrolledCourses);
        setSelectedCourse(enrolledCourses[0]);
    }, [enrolledCourses]);

    useEffect(() => {
        console.log("selected course pyqs:");
        selectedCourse ? 
        console.log(typeof selectedCourse.PYQs) : null ;
    }, [selectedCourse]);

    
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
