import React, { useState } from "react";

import "./MainContent.css";

import document from "../../assets/document.svg"
import text from "../../assets/text.svg"

import AddCoursePane from "../AddCoursePane/AddCoursePane"

const MainContent = (args) => {

    const [content, setContent] = useState('pyqs');

    function handlePYQSOnClick(event) {
        setContent('pyqs')
    }

    function handleResourcesOnClick(event) {
        setContent('resources')
    }

    function handlePYQOnClick(event) {

    }
    
    return (
        <>
        {args.addCoursesButton ?
            <>
                <AddCoursePane setEnrolledCourses={args.setEnrolledCourses} enrolledCourses={args.enrolledCourses} />
            </>
            :
            <>
                <div className="enrolled-content">
                    {args.enrolledCourses.length == 0 ? 
                    <>
                        {
                            <div className="noEnrolledCourses">
                                <div className="header-text">
                                    You have not enrolled in any course
                                </div>
                                <div className="footer-text">
                                    Enroll in a course now to access resources
                                </div>
                            </div>
                        }
                    </> : <></>}
                    {args.selectedCourse ?
                    <>
                        <div className="content-controller">    
                            <div id="PYQS-controller" onClick={handlePYQSOnClick}>
                                PYQs
                            </div>
                            <div id="Resources-controller" onClick={handleResourcesOnClick}>
                                Resources
                            </div>
                        </div>
                        <div className="content">
                            <div className="banner">
                                <div className="banner-text">
                                    {args.selectedCourse.id}
                                </div>
                            </div>
                            {content === 'pyqs' && 
                                <div className="pyqs-container" id="pyqs-container">
                                    <div className="aside"></div><div className="pyqs">
                                        {args.selectedCourse.PYQs.map((pyq) => {
                                            return (
                                                <div className="document">
                                                    <img className="document-logo" src={document} alt="" />
                                                    <div onClick={() => handlePYQOnClick(pyq.linkToAWS)}>
                                                        {pyq.name}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            }
                            {content === 'resources' &&
                                <div className="resources-container" id="resources-container">
                                    <div className="aside"></div><div className="resources">
                                        {
                                            // console.log(typeof args.selectedCourse.PYQs)
                                            args.selectedCourse.resources.map((resource) => {
                                                return(
                                                    <>
                                                        {
                                                            resource.dataType == 'text' ? 
                                                                <div className="resource-text">
                                                                    <div className="text-header">
                                                                        <img className="text-logo" src={text} alt="" />
                                                                        <div className="text-heading">
                                                                            {resource.name}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-content">
                                                                        <p className="text">
                                                                            Refer to the following video for the Electromagnetic Theory:
                                                                            <br></br>
                                                                            <a href="https://www.youtube.com/watch?somevideo">www.youtube.com/watch?somevideo</a>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            : <></>
                                                        }
                                                        {
                                                            resource.dataType == 'document' ? 
                                                                <div className="resource-document">
                                                                    <div className="document">
                                                                        <img className="document-logo" src={document} alt="" />
                                                                        <div>
                                                                            {resource.name}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            : <></>
                                                        }
                                                    </>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </>
                    : <>
                    </>}
                </div>
            </>
            }
        </>
    );
}

export default MainContent;

