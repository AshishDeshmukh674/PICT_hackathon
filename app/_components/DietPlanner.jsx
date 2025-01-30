"use client"
import { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';

const DietPlanner = () => {
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [formData, setFormData] = useState(null);
    const [iframeHeight, setIframeHeight] = useState("800px");

    useEffect(() => {
        // Function to handle JotForm messages
        const handleMessage = (event) => {
            // Only accept messages from JotForm domain
            if (!event.origin.includes('jotform.com')) return;
            
            console.log("Received message:", event.data);

            // Parse the message if it's a string
            let data = event.data;
            if (typeof event.data === 'string') {
                const parts = event.data.split(':');
                if (parts[0] === 'setHeight') {
                    setIframeHeight(`${parseInt(parts[1]) + 30}px`);
                }
            }

            // Check for form submission
            if (
                (typeof event.data === 'object' && event.data.action === "submission-completed") ||
                (typeof event.data === 'string' && event.data.includes('submission-completed'))
            ) {
                console.log("Form submission detected");

                // Get the form data from the submission
                let submittedData = {};
                try {
                    // For demonstration, create some sample data
                    // In production, you should get this from the actual form submission
                    submittedData = {
                        timestamp: new Date().toISOString(),
                        formId: "250282260962455",
                        // Add any other relevant data you want to pass to the chat interface
                    };
                    
                    console.log("Form data:", submittedData);
                    
                    // Switch to chat interface after a short delay
                    setTimeout(() => {
                        setFormData(submittedData);
                        setIsFormSubmitted(true);
                        console.log("Switching to chat interface");
                    }, 2000); // 2 second delay to show the thank you message
                } catch (error) {
                    console.error("Error handling form submission:", error);
                }
            }
        };

        // Add JotForm script
        const addJotFormScript = () => {
            const script = document.createElement('script');
            script.src = "https://cdn.jotfor.ms/js/vendor/imageinfo.js";
            script.async = true;
            document.body.appendChild(script);
        };

        // Add event listeners
        window.addEventListener('message', handleMessage);
        addJotFormScript();

        // Cleanup
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    {isFormSubmitted ? 'Your AI Diet Assistant' : 'Diet Planner'}
                </h1>
                
                {!isFormSubmitted ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <iframe
                            id="JotFormIFrame-250282260962455"
                            title="Diet Consultation Form"
                            allowtransparency="true"
                            allow="geolocation; microphone; camera; fullscreen"
                            src="https://form.jotform.com/250282260962455"
                            frameBorder="0"
                            scrolling="yes"
                            style={{
                                width: "100%",
                                height: iframeHeight,
                                border: "none",
                                margin: 0,
                                padding: 0,
                                overflow: "visible",
                                background: "#fff"
                            }}
                        />
                    </div>
                ) : (
                    <div>
                        <p className="text-center text-gray-600 mb-4">
                            Form submitted successfully! Starting your AI diet consultation...
                        </p>
                        <ChatInterface formData={formData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DietPlanner;
