import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.jsx'
import {BrowserRouter} from "react-router";
import React from "react";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
        }}>
            <App/>
        </BrowserRouter>
    </StrictMode>
)
