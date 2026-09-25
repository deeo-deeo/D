import React from 'react';
import { UserAvatar } from './UserAvatar';

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const ChatPanel = ({ messages, currentUser, onDeleteMessage, onEditMessage, profilesMap }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateFormatted} às ${timeFormatted}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
          <p>Nenhuma mensagem por aqui ainda.</p>
          <p className="text-xs text-gray-600 mt-1">Seja o primeiro a enviar uma mensagem!</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isOwner = msg.user_id ? true : msg.author === currentUser || msg.sender === currentUser;
          const authorName = msg.author || msg.sender;
          const avatar = msg.avatar_url || profilesMap?.[authorName];

          return (
            <div
              key={msg.id}
              className="flex items-start space-x-2 sm:space-x-3 group hover:bg-[#2e3035] p-2 rounded transition-colors"
            >
              <UserAvatar url={avatar} name={authorName} size="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />

              <div className="flex-1 overflow-hidden min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{authorName}</span>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(msg.created_at)}
                  </span>
                  {msg.updated_at && msg.updated_at !== msg.created_at && (
                    <span className="text-[9px] text-gray-500 font-medium">(editado)</span>
                  )}
                </div>
                <p className="text-gray-300 text-sm break-words whitespace-pre-wrap mt-0.5">
                  {msg.content}
                </p>
              </div>

              {isOwner && (
                <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center space-x-1 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => onEditMessage(msg)}
                    className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-[#35373c]"
                    title="Editar mensagem"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-[#35373c]"
                    title="Excluir mensagem"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
