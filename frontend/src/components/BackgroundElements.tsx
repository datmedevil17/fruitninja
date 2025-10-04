import React from 'react';

export default function BackgroundElements() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-10 left-10 w-16 h-16 bg-gray-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-32 right-20 w-12 h-12 bg-gray-400 rounded-full opacity-25 animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-gray-200 rounded-full opacity-35 animate-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-32 right-10 w-14 h-14 bg-gray-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-gray-300 rounded-full opacity-25 animate-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-3/4 right-1/3 w-10 h-10 bg-gray-400 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1.5s'}}></div>
    </div>
  );
}
