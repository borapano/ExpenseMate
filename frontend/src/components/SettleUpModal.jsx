import React, { useState } from 'react';

const SettleUpModal = ({ isOpen, onClose, onConfirm, receiverName, amount }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-xl font-bold mb-4">Konfirmo Pagesën</h3>
                <p className="text-gray-600 mb-6">
                    A jeni i sigurt që dëshironi të shënoni një pagesë prej
                    <span className="font-bold text-green-600"> {amount}€ </span>
                    për <span className="font-bold">{receiverName}</span>?
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anulo
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Duke dërguar...
                            </>
                        ) : 'Konfirmo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettleUpModal;