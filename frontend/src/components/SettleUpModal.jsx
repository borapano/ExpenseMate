import React, { useState } from 'react';

const SettleUpModal = ({ isOpen, onClose, onConfirm, receiverName, amount }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            //onConfirm duhet të kthejë një premtim (promise)
            await onConfirm();
            // Nëse suksesshëm, modali mbyllet nga prindi (DebtList)
        } catch (err) {
            // Kapim mesazhin nga Backend (p.sh. ALREADY_PENDING)
            if (err.response?.data?.detail === "ALREADY_PENDING") {
                setError("Kjo kërkesë është dërguar një herë dhe është në pritje.");
            } else {
                setError("Ndodhi një gabim. Ju lutem provoni përsëri.");
            }
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (!isProcessing) {
            setError(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 border border-gray-100">
                <h3 className="text-xl font-bold mb-2 text-gray-800">Konfirmo Pagesën</h3>

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                        Pasi të konfirmoni, marrësi duhet të pranojë pagesën për të mbyllur borxhin.
                    </p>
                </div>

                <p className="text-gray-600 mb-6">
                    A jeni i sigurt që dëshironi të dërgoni kërkesën për
                    <span className="font-bold text-green-600 text-lg"> {amount}€ </span>
                    tek <span className="font-bold text-gray-800">{receiverName}</span>?
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Anulo
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Duke u procesuar...
                            </>
                        ) : 'Konfirmo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettleUpModal;