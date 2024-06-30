import axios from "axios"

import logo from "../../assets/logo.jpg";
import add from "../../assets/add.svg";

import "./Navbar.css";
import { Link } from "react-router-dom";

const Navbar = (args) => {

    const handleAddCoursesButtonOnClick = () => {
        args.setAddCoursesButton(true);
    }

    
    const handleLogout = async () => {
        window.location.href = '/logout'
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
                    <div className="add-courses nav-item-right" onClick={handleAddCoursesButtonOnClick}>
                        <img src={add} alt="" />
                    </div>
                    <div className="nav-item-right">
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Navbar;

