import React from 'react';

export const UserAvatar = ({ url, name, size = "w-9 h-9" }) => {
  if (url) {
    return (
      <img
        src={url}
        alt={typeof name === 'string' ? name : ''}
        className={`${size} rounded-full object-cover flex-shrink-0 border border-[#3f4147]`}
      />
    );
  }

  const safeName = typeof name === 'string' ? name : String(name || '');

  return (
    <div className={`${size} rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {safeName ? safeName.substring(0, 2).toUpperCase() : '?'}
    </div>
  );
};
