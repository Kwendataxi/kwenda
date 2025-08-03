import React, { useState } from 'react';
import { ModernChatInterface } from './ModernChatInterface';

export const FloatingChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <ModernChatInterface
          isFloating={true}
          onClose={() => setIsOpen(false)}
        />
      )}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primary text-primary-foreground rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
          >
            💬
          </button>
        </div>
      )}
    </>
  );
};