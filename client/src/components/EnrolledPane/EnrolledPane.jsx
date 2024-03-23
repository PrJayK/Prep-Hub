import React, { useState } from "react";

import "./EnrolledPane.css";

import school from "../../assets/school.svg"
import lib_books from "../../assets/lib-books.svg"


const EnrolledPane = (args) => {

    const handleCourseOnClick = (courseId) => {
        args.setSelectedCourse(courseId);
        args.setAddCoursesButton(false);
    }
    
    return (
        <>
            <div className="enrolled">
                <div className="enrolled-text">
                    <img className="school-hat" src={school} alt="" />
                    <div>Enrolled Courses</div>
                </div>
                <ul className="enrolled-list" id="PY1203">
                    <li className="enrolled-list-item" onClick={() => handleCourseOnClick("PY1203")}>
                        <img className="lib-books-logo" src={lib_books} alt="" />
                        <div>
                            PY1203
                        </div>
                    </li>
                    <li className="enrolled-list-item" id="MA1509" onClick={() => handleCourseOnClick("MA1509")}>
                        <img className="lib-books-logo" src={lib_books} alt="" />
                        <div>
                            MA1509
                        </div>
                    </li>
                    <li className="enrolled-list-item" id="CS1302" onClick={() => handleCourseOnClick("CS1302")}>
                        <img className="lib-books-logo" src={lib_books} alt="" />
                        <div>
                            CS1302
                        </div>
                    </li>
                </ul>
            </div>
        </>
    );
}

export default EnrolledPane;

