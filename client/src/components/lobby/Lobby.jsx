import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logo from '/logo.svg';

export default function Lobby() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interests, setInterests] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL);
    setSocket(newSocket);
    newSocket.on('online', (count) => setOnlineUsers(count));
    return () => newSocket.disconnect();
  }, []);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscriptRef.current + interim);
      };

      recognitionRef.current.onend = () => {
        if (finalTranscriptRef.current.trim()) {
          analyzeInterests(finalTranscriptRef.current);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Start/stop recognition
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterests('');
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    } else {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const analyzeInterests = async (text) => {
    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Extract the main interests from this text. Return only a comma-separated list of keywords: ${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setInterests(response.text());
    } catch (error) {
      console.error('Analysis error:', error);
      setInterests('Error detecting interests');
    }
    setIsProcessing(false);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="SoulMegle Logo" className="h-12 w-12" />
          <span className="text-3xl font-bold text-white">SoulMegle</span>
        </div>
        <div className="text-lg md:text-xl bg-gray-800 px-4 py-2 rounded-lg shadow-md">
          {onlineUsers} users online
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col flex-grow justify-center items-center px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
          SoulMegle - Talk to Strangers
        </h2>

        {/* 🎤 Speech Recognition Section */}
        <div className="flex flex-col items-center mt-6">
          <button
            onClick={toggleListening}
            className={`px-6 py-3 font-bold rounded-lg shadow-lg transition duration-300 ease-in-out 
              ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>

          {/* 📝 Transcription Display */}
          <div className="mt-4 w-80 bg-gray-800 p-4 rounded-lg shadow-md text-white text-left">
            <p className="text-lg">{transcript || 'Say something...'}</p>
          </div>

          {/* 🎯 Interests Display */}
          <div className="mt-4 w-80 bg-gray-800 p-4 rounded-lg shadow-md text-white text-left">
            <p className="text-lg font-semibold mb-2">Detected Interests:</p>
            <p className="text-md text-purple-300">
              {isProcessing
                ? 'Analyzing...'
                : interests || 'Speak to see your interests'}
            </p>
          </div>
        </div>

        {/* 🔗 Connect Button */}
        <button
          onClick={() => navigate('/home')}
          className="px-8 py-4 mt-6 bg-purple-600 text-white font-bold rounded-xl shadow-lg 
                 hover:bg-purple-700 transition transform duration-300 ease-in-out 
                 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 
                 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Connect
        </button>
      </div>
    </div>
  );
}
