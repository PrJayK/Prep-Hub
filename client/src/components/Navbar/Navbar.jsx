import React, { useState } from "react";
import logo from "../../assets/logo.jpg";
import add from "../../assets/add.svg";

import "./Navbar.css";

const Navbar = (args) => {

    const handleAddCoursesButtonOnClick = (event) => {
        args.setAddCoursesButton(true);
    }
    
    return (
        <>
            <div className="navbar">
                <div className="nav-left">
                    <div className="logo nav-item-left">
                        <img className="logo" src={logo} alt="" />
                    </div>
                    <div className="logo-text nav-item-left">
                        <div>
                            Prep-Hub
                        </div>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="add-courses nav-item-right" onClick={handleAddCoursesButtonOnClick}>
                        <img src={add} alt="" />
                    </div>
                    <div className="nav-item-right">
                        <button className="login-btn">{args.isLoggedIn ? "Logout" : "Logout" }</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Navbar;

