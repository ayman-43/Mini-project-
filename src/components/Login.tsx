import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

// Add type definition for the custom element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { url: string }, HTMLElement>;
        }
    }
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [isFlipped, setIsFlipped] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [loginOutput, setLoginOutput] = useState('');
    const [signupOutput, setSignupOutput] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setLoginOutput("⚠ Please fill both fields.");
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setLoginOutput("❌ " + error.message);
        } else {
            setLoginOutput("✅ Logged in! Redirecting...");
            setTimeout(() => navigate('/'), 1200);
        }
    };

    const handleSignup = async () => {
        if (!signupEmail || !signupPassword) {
            setSignupOutput("⚠ Please fill both fields.");
            return;
        }

        const { error } = await supabase.auth.signUp({
            email: signupEmail,
            password: signupPassword
        });

        if (error) {
            setSignupOutput("❌ " + error.message);
        } else {
            setSignupOutput("✅ Signup successful! Verify your email.");
            setTimeout(() => setIsFlipped(false), 1500);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + "/" }
        });

        if (error) console.log(error);
    };

    return (
        <div className="login-body">
            {/* 3D Robot */}
            <spline-viewer url="https://prod.spline.design/FQwKaGRElAQqSbhj/scene.splinecode"></spline-viewer>

            <div className="speech-bubble">
                💬 Hey!! I am your compounder allow me to take you to the Doctor 😈💉
            </div>

            {/* Login/Signup Container */}
            <div className="panel-container">
                <div className={`panel-inner ${isFlipped ? 'flipped' : ''}`} id="flipCard">

                    {/* Login Panel */}
                    <div className="login-panel">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="login-btn" onClick={handleLogin}>Login</button>
                        <button className="google-btn" onClick={handleGoogleLogin}>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" /> Login with Google
                        </button>
                        <p className="switch-link" onClick={() => setIsFlipped(true)}>Don't have an account? Sign Up</p>
                        <p className="output-msg">{loginOutput}</p>
                    </div>

                    {/* Signup Panel */}
                    <div className="signup-panel">
                        <input
                            type="email"
                            placeholder="Email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                        />
                        <button className="signup-btn" onClick={handleSignup}>Sign Up</button>
                        <p className="switch-link" onClick={() => setIsFlipped(false)}>Already have an account? Login</p>
                        <p className="output-msg">{signupOutput}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
