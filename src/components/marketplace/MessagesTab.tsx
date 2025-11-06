import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';

export const MessagesTab: React.FC = () => {
  return (
    <div className="h-full">
      <UniversalChatInterface
        contextType="marketplace"
        isFloating={false}
        hideHeader={false}
      />
    </div>
  );
};
