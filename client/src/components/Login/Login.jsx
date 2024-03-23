import React, { useState } from "react";
import "./Login.css";
import { Link } from 'react-router-dom';

const Login = (agrs) => {
	
	const [loginForm, setLoginForm] = useState({
		email: '',
		password: ''
	});

	const handleLoginInputChange = (event) => {
		const { name, value } = event.target;
		setLoginForm(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const handleLoginSubmit = (event) => {
		event.preventDefault();
		console.log('Login Form Submitted', loginForm);
	
	};

	return (
		<div className="container">
			<div className={`login form`}>
				<header>Login</header>

				<form action="#" onSubmit={handleLoginSubmit}>
						<input
							type="text"
							placeholder="Enter your email"
							name="email"
							value={loginForm.email}
							onChange={handleLoginInputChange}
						/>
					<input
						type="password"
						placeholder="Enter your password"
						name="password"
						value={loginForm.password}
						onChange={handleLoginInputChange}
					/>
					<a href="#">Forgot password?</a>
					<input type="submit" className="button" value="Login" />
				</form>
				
				<div className="signup">
					<span className="signup">
						Don't have an account?
						<Link to="/signup">
							<button className="extbutton">Signup</button>
						</Link>
					</span>
				</div>
			</div>
		</div>
	);
};

export default Login;

