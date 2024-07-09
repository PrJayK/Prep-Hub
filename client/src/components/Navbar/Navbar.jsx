import axios from "axios"

import logo from "../../assets/logo.jpg";
import add from "../../assets/add.svg";

import "./Navbar.css";
import { Link } from "react-router-dom";

const Navbar = (args) => {

    const handleAddCoursesButtonOnClick = () => {
        args.setAddCoursesButton(true);
    }

    const handleContributeButtonOnClick = () => {
        window.location.href = '/upload';
    }

    
    const handleLogout = async () => {
        window.location.href = '/logout';
    }

    return (
        <>
            <div className="navbar">
                <div className="nav-left">
                    <div className="logo nav-item-left">
                        <img className="logo" src={logo} alt="" />
                    </div>
                    <div className="logo-text nav-item-left" onClick>
                        <div>
                            Prep-Hub
                        </div>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="nav-item-right">
                        <button class="button-54" onClick={handleContributeButtonOnClick}>Contribute!</button>
                    </div>
                    <div className="nav-item-right">
                        <button className="button-54" onClick={handleAddCoursesButtonOnClick}>Add courses</button>
                    </div>
                    <div className="nav-item-right">
                        <button className="button-54" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Navbar;

