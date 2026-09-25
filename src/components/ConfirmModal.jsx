import React from 'react';

export const ConfirmModal = ({ isOpen, title, description, onConfirm, onCancel, confirmText = "Confirmar", confirmBg = "bg-[#da373c] hover:bg-[#a1282b]" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#313338] border border-[#2b2d31] p-6 rounded-lg max-w-sm w-full space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-300 text-xs">{description}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-xs font-medium cursor-pointer">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded text-xs font-medium cursor-pointer ${confirmBg}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
