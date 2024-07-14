import React, { useState, useEffect } from "react";
import axios from "axios";

import "./MainContent.css";

import document from "../../assets/document.svg"
import text from "../../assets/text.svg"

import AddCoursePane from "../AddCoursePane/AddCoursePane"
import { BACKEND_URL } from "../../backend_url";

const MainContent = (args) => {

    const [content, setContent] = useState('pyqs');
    const [bannerUrl, setBannerUrl] = useState();

    function handlePYQSOnClick(event) {
        setContent('pyqs')
    }

    function handleResourcesOnClick(event) {
        setContent('resources')
    }

    useEffect(() => {
        args.selectedCourse ?
        axios.post(`/api/aws/getObjectUrl`, {
            key: args.selectedCourse.bannerKey
        }, { withCredentials: true })
        .then(res => setBannerUrl(res.data.url)) : null ;
    }, [args.selectedCourse]);

    function handleDocumentOnClick(key) {
        axios.post(`/api/aws/getObjectUrl`, {
            key: key
        }, { withCredentials: true })
        .then((res) => {
            window.open(res.data.url, '_blank');
        })
        .catch((err) => {
            console.log(err);
            alert("An error occured. Couldn't fetch object url.");
        });
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
                            <div className={content === 'pyqs' ? 'active' : ''} id="PYQS-controller" onClick={handlePYQSOnClick} >
                                PYQs
                            </div>
                            <div className={content === 'resources' ? 'active' : ''} id="Resources-controller" onClick={handleResourcesOnClick} >
                                Resources
                            </div>
                        </div>
                        <div className="content">
                            {/* <div className="banner" style={{backgroundImage: `url(${bannerUrl})`}}>
                                <div className="banner-text">
                                    {args.selectedCourse.id}
                                </div>
                            </div> */}
                            {content === 'pyqs' && 
                                <div className="pyqs-container" id="pyqs-container">
                                    <div className="aside"></div><div className="pyqs">
                                        {args.selectedCourse.PYQs.map((pyq) => {
                                            return (
                                                <div className="document"  onClick={() => handleDocumentOnClick(pyq.key)}>
                                                    <img className="document-logo" src={document} alt="" />
                                                    <div>
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
                                            args.selectedCourse.resources.map((resource) => {
                                                return(
                                                    <>
                                                        {resource.dataType == 'text' ? 
                                                            <div className="resource-text">
                                                                <div className="text-header">
                                                                    <img className="text-logo" src={text} alt="" />
                                                                    <div className="text-heading">
                                                                        {resource.name}
                                                                    </div>
                                                                </div>
                                                                <div className="text-content">
                                                                    <p className="text">
                                                                        <pre>
                                                                            {resource.content}
                                                                        </pre>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        : <></>}
                                                        {resource.dataType == 'document' ? 
                                                            <div className="resource-document">
                                                                <div className="document" onClick={() => handleDocumentOnClick(resource.key)}>
                                                                    <img className="document-logo" src={document} alt="" />
                                                                    <div>
                                                                        {resource.name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        : <></>}
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

