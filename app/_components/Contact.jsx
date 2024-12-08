"use client";

import { useState, useRef } from "react";
import axios from 'axios'; // ES6 Modules

export default function Contact() {
    const form = useRef(); // Add a form reference
    const [formData, setFormData] = useState({
        user_name: "",
        user_email: "",
        user_phone: "",
        message: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    const negativeWords = [ 'terrible', 'awful', 'horrible', 'negative', 'madarchod', 'bhenchod', 'dirty', 'mc', 'bc', 'mkc', 'fuck', 'slut', 'randi'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = async () => {
        let messages = [];
    
        if (formData.user_name.length <= 4) {
            messages.push('Name must be greater than 4 characters');
        }
    
        if (/^\d/.test(formData.user_name)) {
            messages.push('Name must not start with a number');
        }
    
        if (!/\S+@\S+\.\S+/.test(formData.user_email)) {
            messages.push('Email is invalid');
        }
    
        const hasNegativeWords = negativeWords.some(word => 
            new RegExp(`\\b${word}\\b`, 'i').test(formData.message)
        );

        if (hasNegativeWords) {
            messages.push('Message contains negative statements. Please provide positive feedback.');
        }
    
        return messages.length > 0 ? messages.join('/') : '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage("");

        const validationMessage = await validate();
        if (validationMessage) {
          setError(validationMessage);
        } else {
          setError('');
          await sendMessage(formData);
        }
    };

    const sendMessage = async (formData) => {
        const phoneNumbers = [
            "+918149623527",
        ];
    
        try {
            const promises = phoneNumbers.map(async (number) => {
                const response = await axios.post(
                    `https://graph.facebook.com/v16.0/405802159279444/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: number,  // Iterating over the array of phone numbers
                        type: "template",
                        template: {
                            name: "contact_details",  // Template name
                            language: { code: "en" },  // Language code
                            components: [
                                {
                                    type: "body",
                                    parameters: [
                                        { type: "text", text: formData.user_name },  // {{1}}
                                        { type: "text", text: formData.user_email },  // {{2}}
                                        { type: "text", text: formData.user_phone },  // {{3}}
                                        { type: "text", text: formData.message }  // {{4}}
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        headers: {
                            "Authorization": `Bearer EAAE2eCrRWPkBO5IJD2ZCjepnBu16tfITg1aSWXeVuoqMEXWLE0ME2JZAKRNQUeE5T19rKzPltkk5PNuxSfwqnxzRWJtJuoCAqBTJxTANQW7hRnlHvYokTVPVjPccghhJVCBCiKZBlUKAUvnzJmuftZCOesX5uNVIJ94YvaZBBEwKWfFt9BQ1qDjlfZAQ4C7uPZBDQZDZD`,  // Replace with your access token
                            "Content-Type": "application/json"
                        }
                    }
                );
    
                if (response.status !== 200) {
                    throw new Error(`Failed to send message to ${number}: ${response.data.error.message}`);
                }
            });
    
            await Promise.all(promises);  // Wait for all messages to be sent
    
            setSuccessMessage("Your message has been sent successfully to all recipients.");
            setFormData({
                user_name: '',
                user_email: '',
                user_phone: '',
                message: ''
            });
        } catch (error) {
            setError(`Failed to send message: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };    

    return (
        <form className="mt-10 space-y-6" ref={form} onSubmit={handleSubmit}>
            <div id="Contact-us" className="flex flex-col gap-9">
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                    <div className="flex-1 border-b-2 border-silver-400 focus-within:border-blue-500">
                        <input
                            type="text"
                            name="user_name"
                            placeholder="Your Name"
                            value={formData.user_name}
                            onChange={handleChange}
                            className="w-full p-2 bg-transparent focus:outline-none overflow-hidden text-ellipsis caret-blue-800"
                            required
                        />
                    </div>
                    <div className="flex-1 border-b-2 border-silver-400 focus-within:border-blue-500">
                        <input
                            type="email"
                            name="user_email"
                            placeholder="Email"
                            value={formData.user_email}
                            onChange={handleChange}
                            className="w-full p-2 bg-transparent focus:outline-none overflow-hidden text-ellipsis caret-blue-800"
                            required
                        />
                    </div>
                </div>
                <div className="border-b-2 border-silver-400 focus-within:border-blue-500">
                    <input
                        type="tel"
                        name="user_phone"
                        placeholder="Phone"
                        value={formData.user_phone}
                        onChange={handleChange}
                        className="w-full p-2 bg-transparent focus:outline-none overflow-hidden text-ellipsis caret-blue-800"
                        required
                    />
                </div>
                <div className="mt-2 border-b-2 border-silver-400 focus-within:border-blue-500">
                    <textarea
                        name="message"
                        placeholder="Type your message here..."
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full h-[5.4rem] p-2 bg-transparent focus:outline-none overflow-hidden text-ellipsis caret-blue-800"
                        required
                    ></textarea>
                </div>
            </div>
            <div className="flex justify-center mt-6">
                <button
                    type="submit"
                    className="p-2 bg-blue-800 text-white rounded-full w-44 font-light"
                   
                >
                    {loading ? "Error..." : "Submit"}
                </button>
            </div>
            <div className="mt-6">
                {error && <div className="text-red-500 text-sm">* {error}</div>}
                {successMessage && (
                    <div className="text-green-500 text-sm">* {successMessage}</div>
                )}
            </div>
        </form>
    );
}
