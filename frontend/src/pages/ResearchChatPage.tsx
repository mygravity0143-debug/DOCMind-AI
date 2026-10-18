import React from 'react';
import { ResearchChat } from '../components/chat/ResearchChat';

interface ResearchChatPageProps {
  initialSessionId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ResearchChatPage: React.FC<ResearchChatPageProps> = ({
  initialSessionId,
  onNavigate,
}) => {
  return (
    <div className="h-[calc(100vh-4rem)] p-4 sm:p-6 flex flex-col">
      <ResearchChat
        initialSessionId={initialSessionId}
        onNavigateToPdf={(docId, pageNumber, snippet) => {
          onNavigate('pdf-viewer', { documentId: docId, pageNumber, highlightText: snippet });
        }}
      />
    </div>
  );
};
