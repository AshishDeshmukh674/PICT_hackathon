"use client"
import { useState, useEffect, useRef } from 'react';

const ChatInterface = ({ formData }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Automatically generate initial diet plan
    useEffect(() => {
        generateDietPlan();
    }, []);

    const generateDietPlan = async () => {
        try {
            const response = await fetch('/api/diet-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Generate a diet plan with exactly this format:

Daily Meal Breakdown
1. Breakfast: 350-500 calories
2. Morning Snack: 150-200 calories
3. Lunch: 500-700 calories
4. Afternoon Snack: 150-200 calories
5. Dinner: 500-700 calories
6. Evening Snack (optional): 0-150 calories

Portion Sizes
1. Fruits: 1/2 cup to 1 cup per serving
2. Vegetables: 1/2 cup to 1 cup per serving
3. Grains (preferably whole grains): 1/2 cup to 1 cup per serving
4. Protein (meat, fish, eggs, dairy, legumes): 3-4 ounces per serving
5. Healthy Fats (nuts, seeds, avocado, olive oil): 1 tablespoon to 1/4 cup per serving

Caloric Content
Aim for a total of 2,000 calories per day, adjusting based on your specific needs.

Nutritional Values
• Carbohydrates: 225-325 grams per day
• Protein: 50-175 grams per day
• Fat: 44-77 grams per day
• Fiber: 25-38 grams per day

Recommended Supplements
1. Multivitamin
2. Omega-3 fatty acids
3. Vitamin D
4. Calcium and magnesium

Please provide the response in exactly this format, maintaining the same structure and numbering.`,
                    formData: formData,
                    chatHistory: messages
                }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error generating your diet plan. Please try asking a specific question."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = {
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/diet-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    formData: formData,
                    chatHistory: messages
                }),
            });

            const data = await response.json();
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response + "\n\nIs there anything else you'd like to know?"
            }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages }),
            });

            if (!response.ok) throw new Error('PDF generation failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diet-plan.pdf';
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="flex flex-col h-[80vh] max-w-3xl mx-auto bg-white rounded-lg shadow-md">
            <div className="flex-1 overflow-y-auto p-6">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-4 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                    >
                        <div
                            className={`inline-block p-4 rounded-lg ${
                                message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {(isLoading || isGeneratingPDF) && (
                    <div className="text-left mb-4">
                        <div className="inline-block p-4 rounded-lg bg-gray-100">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF || messages.length <= 1}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300 mr-4"
                    >
                        {isGeneratingPDF ? 'Generating PDF...' : 'Download Diet Plan (PDF)'}
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex space-x-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your diet plan..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface; 