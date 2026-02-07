import React from 'react';
import './DocumentViewer.css';

function DocumentViewer({ documentUrl, onClose }) {
    if (!documentUrl) return null;

    // Determine file type from URL
    const getFileType = (url) => {
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        if (['pdf'].includes(extension)) return 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
        if (['doc', 'docx'].includes(extension)) return 'word';
        if (['txt'].includes(extension)) return 'text';
        return 'other';
    };

    const fileType = getFileType(documentUrl);

    // Debug: Log the document URL
    console.log('DocumentViewer - Document URL:', documentUrl);
    console.log('DocumentViewer - File Type:', fileType);

    // Render content based on file type
    const renderContent = () => {
        if (fileType === 'image') {
            // Images can be displayed directly
            return <img src={documentUrl} alt="Document" className="document-image" />;
        } else if (fileType === 'pdf') {
            // For PDFs, use iframe
            return (
                <iframe
                    src={documentUrl}
                    title="PDF Viewer"
                    className="document-iframe"
                    frameBorder="0"
                />
            );
        } else if (fileType === 'word') {
            // For Word documents, use Google Docs Viewer
            const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;
            return (
                <iframe
                    src={viewerUrl}
                    title="Document Viewer"
                    className="document-iframe"
                    frameBorder="0"
                />
            );
        } else {
            // For other file types, try Google Docs Viewer
            const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;
            return (
                <iframe
                    src={viewerUrl}
                    title="Document Viewer"
                    className="document-iframe"
                    frameBorder="0"
                />
            );
        }
    };

    return (
        <div className="document-viewer-overlay" onClick={onClose}>
            <div className="document-viewer-container" onClick={(e) => e.stopPropagation()}>
                <div className="document-viewer-header">
                    <h3>Document Viewer</h3>
                    <div className="document-viewer-actions">
                        <a
                            href={documentUrl}
                            download
                            className="btn-download"
                            title="Download Document"
                        >
                            Download
                        </a>
                        <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-open-new"
                            title="Open in New Tab"
                        >
                            Open in New Tab
                        </a>
                        <button
                            className="btn-close"
                            onClick={onClose}
                            title="Close Viewer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                <div className="document-viewer-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default DocumentViewer;
