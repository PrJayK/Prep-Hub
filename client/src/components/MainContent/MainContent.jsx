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
    
    return (
        <>
        {args.addCoursesButton ?
            <>
                <AddCoursePane />
            </>
            :
            <>
                <div className="enrolled-content">
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
                                {args.selectedCourse}
                            </div>
                        </div>
                        {content === 'pyqs' && 
                            <div className="pyqs-container" id="pyqs-container">
                                <div className="aside"></div><div className="pyqs">
                                    <div className="document">
                                        <div className="document-icon">
                                            <img className="document-logo" src={document} alt="" />
                                        </div>
                                        <div>
                                            PYQ2023
                                        </div>
                                    </div>
                                    <div className="document">
                                        <div className="document-icon">
                                            <img className="document-logo" src={document} alt="" />
                                        </div>
                                        <div>
                                            PYQ2022
                                        </div>
                                    </div>
                                    <div className="document">
                                        <div className="document-icon">
                                            <img className="document-logo" src={document} alt="" />
                                        </div>
                                        <div>
                                            PYQ2021
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        {content === 'resources' &&
                            <div className="resources-container" id="resources-container">
                                <div className="aside"></div><div className="resources">
                                    <div className="resource-text">
                                        <div className="text-header">
                                            <div className="text-icon">
                                                <img className="text-logo" src={text} alt="" />
                                            </div>
                                            <div className="text-heading">
                                                Electromagnetic Theory
                                            </div>
                                        </div>
                                        <div className="text-content">
                                            <p className="text">
                                                Refer to the following video for the Electromagnetic Theory:

                                                <a href="https://www.youtube.com/watch?somevideo">www.youtube.com/watch?somevideo</a>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="resource-document">
                                        <div className="document">
                                            <div className="document-icon">
                                                <img className="document-logo" src={document} alt="" />
                                            </div>
                                            <div>
                                                Electromagnetic Theory.pptx
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </>
            }
        </>
    );
}

export default MainContent;

