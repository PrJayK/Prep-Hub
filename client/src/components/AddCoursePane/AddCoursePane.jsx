import React, { useEffect, useState } from "react";
import axios from "axios";

import "./AddCoursePane.css";

import lib_books from "../../assets/lib-books.svg"
import add from "../../assets/add.svg";
import { BACKEND_URL } from "../../backend_url";

const AddCoursePane = (args) => {

    const [queriedCourses, setQueriedCourses] = useState([]);
    const [courseQuery, setCourseQuery] = useState({
        course_query: "",
        branch: "",
        semester: ""
    });
    const [courseQueryTimeoutId, setcourseQueryTimeoutId] = useState(null);
    
    useEffect(() => {
        axios.post(`http://${BACKEND_URL}:3000/api/queryCourses`, {
            course_query: courseQuery.course_query,
            branch: courseQuery.branch,
            semester: courseQuery.semester
        }, { withCredentials: true })
        .then((res) => {
            setQueriedCourses(res.data);
        })
        .catch((err) => {
            alert("An error occured. Couldn't query for courses.");
        });
    }, [courseQuery]);

    const handleAddCourseButtonOnClick = (_id) => {
        axios.post(`http://${BACKEND_URL}:3000/api/addToEnrolledCourses`, {
            _id: _id
        },{
            withCredentials: true
        })
        .then((res) => {
            if(res.data.message) {
                alert("Course is already enrolled in.");
            } else {
                args.setEnrolledCourses([...args.enrolledCourses, res.data]);
                alert("Course added!");
            }
        })
        .catch((err) => {
            console.log(err);
            alert("An error occured. Couldn't complete request.");
        });
    }

    function handleSemesterChange(event) {
        setCourseQuery({
            ...courseQuery,
            semester: event.target.value
        });
    }

    function handleBranchChange(event) {
        setCourseQuery({
            ...courseQuery,
            branch: event.target.value
        });
    }

    function handleCourseQueryChange(event) {
        debounceCourseQuery(() => {
            setCourseQuery({
                ...courseQuery,
                course_query: event.target.value
            });
        }, 700);
    }

    const debounceCourseQuery = (func, delay) => {
        clearTimeout(courseQueryTimeoutId);
        const id = setTimeout(func, delay);
        setcourseQueryTimeoutId(id);
    };
    
    return (
        <>
            <div className="add-course">
                <div className="inputs">
                    <input className="course-name" type="text" name="course-query" id="course-query" placeholder="Search for a course" onChange={handleCourseQueryChange}/>
                    <div className="filters">
                        <div>
                            Filters:
                        </div>
                        <select className="semester" id="semester" name="semester" onChange={handleSemesterChange}>
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
                        <select className="branch" id="branch" name="branch" onChange={handleBranchChange}>
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
                    {queriedCourses.map((course) => {
                        return (
                            <div className="queried-course">
                                <div className="course-info-header">
                                    <div className="course-info-header-details">
                                        <img className="lib-books-logo" src={lib_books} alt="" />
                                        <div className="course-code">
                                            {course.id}
                                        </div>
                                    </div>
                                    <div className="add-course-btn" onClick={() => handleAddCourseButtonOnClick(course._id)}>
                                        <img src={add} alt="" />
                                    </div>
                                </div>
                                <div className="course-info-footer">
                                    <div>
                                        Topic: {course.name}
                                    </div>
                                    <div>
                                        Branch: {course.branch}
                                    </div>
                                    <div>
                                        Semester: {course.semester}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default AddCoursePane;

