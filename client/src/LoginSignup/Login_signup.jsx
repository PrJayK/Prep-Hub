import React, { useState } from "react";
import "./Login_signup.css";
// import user_icon from "../assets/person.png";
// import email_icon from "../assets/email.png";
// import password_icon from "../assets/password.png";

const Login_signup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    createPassword: '',
    confirmPassword: ''
  });

  const handleLoginInputChange = (event) => {
    const { name, value } = event.target;
    setLoginForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSignupInputChange = (event) => {
    const { name, value } = event.target;
    setSignupForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    console.log('Login Form Submitted', loginForm);
  
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();
    console.log('Signup Form Submitted', signupForm);
  };

  return (
    <div className="container">
      {isLogin ? (
        // Login Form
        <div className={`login form ${isLogin ? "show" : "hide"}`}>
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
              <button className="extbutton" onClick={() => setIsLogin(false)}>Signup</button>
            </span>
          </div>
        </div>
      ) : (
        // Registration Form
        <div className={`registration form ${!isLogin ? "show" : "hide"}`}>
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
              <button className="extbutton" onClick={() => setIsLogin(true)}>Login</button>
            </span>
          </div>
          <div onClick={()=>{}} className="google">
            <h4>
              <span className="Gofgoogle">G</span>Continue with Google
            </h4>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login_signup;
