import React, { useState } from "react";

import "./AddCoursePane.css";

import lib_books from "../../assets/lib-books.svg"
import add from "../../assets/add.svg";

const Dashboard = (args) => {

    const handleAddCourseButtonOnClick = (courseId) => {
        //make the backend call to add the course
    }

    function handleInputChange() {

    }

    function handleCourseNameInputChange() {

    }
    
    return (
        <>
            <div className="add-course">
                <div className="inputs">
                    <input className="course-name" type="text" name="course-name" id="course-name" placeholder="Search for a course" onChange={handleCourseNameInputChange}/>
                    <div className="filters">
                        <div>
                            Filters:
                        </div>
                        <select className="semester" id="semester" name="semester" onChange={handleInputChange}>
                            <option value="semester">Semester</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                        </select>
                        <select className="branch" id="branch" name="branch" onChange={handleInputChange}>
                            <option value="branch">Branch</option>
                            <option value="CSE">Computer Science and Engineering</option>
                            <option value="DS">Computer Science Data Science</option>
                            <option value="ECE">Electronics and Communications Engineering</option>
                            <option value="EE">Electrical Engineering</option>
                            <option value="ME">Mechanical Engineering</option>
                            <option value="CE">Civil Engineering</option>
                            <option value="PIE">Production Engineering</option>
                            <option value="META">Metallurgical Engineering</option>
                            <option value="AERO">Aerospace Engineering</option>
                        </select>
                    </div>
                </div>
                <div className="course-queries">
                    <div className="queried-course">
                        <div className="course-info-header">
                            <div className="course-info-header-details">
                                <img className="lib-books-logo" src={lib_books} alt="" />
                                <div className="course-code">
                                    PY1203
                                </div>
                            </div>
                            <div className="add-course-btn" onClick={() => handleAddCourseButtonOnClick("PY1203")}>
                                <img src={add} alt="" />
                            </div>
                        </div>
                        <div className="course-info-footer">
                            <div>
                                Topic: Electromagnetics
                            </div>
                            <div>
                                Branch: All
                            </div>
                            <div>
                                Semester: 2
                            </div>
                        </div>
                    </div>
                    <div className="queried-course">
                        <div className="course-info-header">
                            <div className="course-info-header-details">
                                <img className="lib-books-logo" src={lib_books} alt="" />
                                <div className="course-code">
                                    PY1203
                                </div>
                            </div>
                            <div className="add-course-btn" onClick={() => handleAddCourseButtonOnClick("PY1203")}>
                                <img src={add} alt="" />
                            </div>
                        </div>
                        <div className="course-info-footer">
                            <div>
                                Topic: Electromagnetics
                            </div>
                            <div>
                                Branch: All
                            </div>
                            <div>
                                Semester: 2
                            </div>
                        </div>
                    </div>
                    <div className="queried-course">
                        <div className="course-info-header">
                            <div className="course-info-header-details">
                                <img className="lib-books-logo" src={lib_books} alt="" />
                                <div className="course-code">
                                    PY1203
                                </div>
                            </div>
                            <div className="add-course-btn" onClick={() => handleAddCourseButtonOnClick("PY1203")}>
                                <img src={add} alt="" />
                            </div>
                        </div>
                        <div className="course-info-footer">
                            <div>
                                Topic: Electromagnetics
                            </div>
                            <div>
                                Branch: All
                            </div>
                            <div>
                                Semester: 2
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;

