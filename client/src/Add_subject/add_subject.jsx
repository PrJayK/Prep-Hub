import React from "react";
import "./adminpage.css";
import data from "./data.js";
function Items({ course }) {
 
  const { img, coursename, courseid } = course;

  return (
    <div className="itembox zoom">
      <div className="image">
        <img src={img} alt={`course image of ${coursename}`} />
      </div>
      <div className="course-info">
        <h2>{coursename}</h2>
        <p>ID: {courseid}</p>
      </div>
      <button className="subutton">Add Subject</button>
    </div>
  );
}
function alldata(values){
  const course={
    img:values.image,
    coursename:values.name,
    
    courseid:values.id
  };
  return(
    <>
      <Items key={values.id} course={course}/>
    </>
  )
}

export default function adminpage() {
  return (
    <div>
      <h1>Admin Portal</h1>
      <div className="items-container">
       {data.map(alldata)}
      </div>
    </div>
  );
}

