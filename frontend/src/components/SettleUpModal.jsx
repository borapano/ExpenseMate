import React from 'react';

const SettleUpModal = ({ isOpen, onClose, onConfirm, receiverName, amount }) => {
    if (!isOpen) return null;

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
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
                    >
                        Anulo
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Konfirmo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettleUpModal;