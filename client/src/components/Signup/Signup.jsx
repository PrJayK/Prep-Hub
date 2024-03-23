import React, { useState } from "react";
import { Link } from 'react-router-dom';
import "./Signup.css";

const Signup = (args) => {
    
	const [signupForm, setSignupForm] = useState({
		email: '',
		createPassword: '',
		confirmPassword: ''
	});

	const handleSignupInputChange = (event) => {
		const { name, value } = event.target;
		setSignupForm(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const handleSignupSubmit = (event) => {
		event.preventDefault();
		console.log('Signup Form Submitted', signupForm);
	};

    return (
        <div className="container">
            <div className={"registration form"}>
                <header>Signup</header>

                <form action="#" onSubmit={handleSignupSubmit}>
                    <input
                        type="text"
                        placeholder="Enter your email"
                        name="email"
                        value={signupForm.email}
                        onChange={handleSignupInputChange}
                    />
                    <input
                        type="password"
                        placeholder="Create a password"
                        name="createPassword"
                        value={signupForm.createPassword}
                        onChange={handleSignupInputChange}
                    />
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        name="confirmPassword"
                        value={signupForm.confirmPassword}
                        onChange={handleSignupInputChange}
                    />
                    <input type="submit" className="button" value="Signup" />
                </form>
                <div className="signup">
                    <span className="signup">
                        Already have an account?
						<Link to="/login">
							<button className="extbutton">Login</button>
						</Link>
                    </span>
                </div>
                <div onClick={()=>{}} className="google">
                    <h4>
                        <span className="Gofgoogle">G</span>
                        Continue with Google
                    </h4>
                </div>
            </div>
        </div>
    );
}

export default Signup;

