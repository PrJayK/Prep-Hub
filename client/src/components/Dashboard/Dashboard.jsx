import React, { useState } from "react";

// import "./Dashboard.css";
import Navbar from "../Navbar/Navbar";
import EnrolledPane from "../EnrolledPane/EnrolledPane";
import MainContent from "../MainContent/MainContent";


const Dashboard = (args) => {

    const [addCoursesButton, setAddCoursesButton] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState("PY1203");
    
    return (
        <>
            <Navbar isLoggedIn={args.isLoggedIn} setIsLoggedIn={args.setIsLoggedIn} setAddCoursesButton={setAddCoursesButton} />
            
            <div className="main-container">
                <EnrolledPane setSelectedCourse={setSelectedCourse} setAddCoursesButton={setAddCoursesButton}/>
                <MainContent addCoursesButton={addCoursesButton} selectedCourse={selectedCourse} />
            </div>
        </>
    );
}

export default Dashboard;
