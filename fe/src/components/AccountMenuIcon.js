import React from 'react';

const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    requests: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 11h6M9 15h4" /></>,
    contract: <><path d="M6 3h12v18H6Z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    chat: <><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-4A9 9 0 1 1 21 12Z" /><path d="M8 10h8M8 14h5" /></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    properties: <><path d="M4 21V7l8-4 8 4v14" /><path d="M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01" /></>,
    add: <><path d="M12 5v14M5 12h14" /><circle cx="12" cy="12" r="10" /></>,
};

function AccountMenuIcon({ name }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            {paths[name]}
        </svg>
    );
}

export default AccountMenuIcon;
