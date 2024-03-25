import React, { useEffect, useState } from "react";
import axios from "axios";

import "./EnrolledPane.css";

import school from "../../assets/school.svg"
import lib_books from "../../assets/lib-books.svg"


const EnrolledPane = (args) => {

    const handleCourseOnClick = (courseId) => {
        
        const selectedCourse = args.enrolledCourses.find((course) => course.id === courseId);

        args.setSelectedCourse(selectedCourse);
        args.setAddCoursesButton(false);
    }
    
    return (
        <>
            <div className="enrolled">
                <div className="enrolled-text">
                    <img className="school-hat" src={school} alt="" />
                    <div>Enrolled Courses</div>
                </div>
                <ul className="enrolled-list">
                    {args.enrolledCourses.map((course) => {
                        return (
                        <li className="enrolled-list-item" onClick={() => handleCourseOnClick(course.id)}>
                            <img className="lib-books-logo" src={lib_books} alt="" />
                            <div>
                                {course.id}
                            </div>
                        </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
}

export default EnrolledPane;

