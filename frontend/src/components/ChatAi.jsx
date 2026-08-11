import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function ChatAi({problem}) {
    const [messages, setMessages] = useState([
        { role: 'model', parts:[{text: "Hello! I am your AI coding assistant. How can I help you with this problem today?"}]}
    ]);

    const { register, handleSubmit, reset,formState: {errors} } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSubmit = async (data) => {
        
        const newUserMessage = { role: 'user', parts:[{text: data.message}] };
        setMessages(prev => [...prev, newUserMessage]);
        reset();

        try {
            
            const response = await axiosClient.post("/ai/chat", {
                messages: [...messages, newUserMessage],
                title:problem.title,
                description:problem.description,
                testCases: problem.visibleTestCases,
                startCode:problem.startCode
            });

           
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts:[{text: response.data.message}] 
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts:[{text: "Error from AI Chatbot"}]
            }]);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className="chat-bubble bg-base-200 text-base-content overflow-hidden">
                            <div className="prose prose-sm max-w-none prose-p:leading-snug prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-li:my-0 prose-headings:my-2">
                                <ReactMarkdown>
                                    {msg.parts[0].text
                                        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
                                        .replace(/\$\s*(?:\\mathcal\{O\}|\\mathcal O|O)\(([^)]+)\)\s*\$/g, 'O($1)') // Fix $\mathcal{O}(1)$
                                        .replace(/\$O\(([^)]+)\)\$/g, 'O($1)')}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="sticky bottom-0 p-4 bg-base-100 border-t"
            >
                <div className="flex items-center">
                    <input 
                        placeholder="Ask me anything" 
                        className="input input-bordered flex-1" 
                        {...register("message", { required: true, minLength: 2 })}
                    />
                    <button 
                        type="submit" 
                        className="btn btn-ghost ml-2"
                        disabled={errors.message}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;