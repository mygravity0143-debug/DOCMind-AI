import React from 'react';
import { PdfViewer } from '../components/pdf/PdfViewer';

interface PdfViewerPageProps {
  documentId?: string;
  pageNumber?: number;
  highlightText?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const PdfViewerPage: React.FC<PdfViewerPageProps> = ({
  documentId,
  pageNumber = 1,
  highlightText,
  onNavigate,
}) => {
  return (
    <div className="h-[calc(100vh-4rem)] p-4 sm:p-6 flex flex-col">
      <PdfViewer
        documentId={documentId}
        initialPage={pageNumber}
        highlightText={highlightText}
        onSelectDocument={(id) => {
          // preserve active document selection
        }}
      />
    </div>
  );
};
