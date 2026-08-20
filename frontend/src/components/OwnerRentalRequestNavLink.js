import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getOwnerRentalRequests } from '../services/ownerService';

function OwnerRentalRequestNavLink({ icon }) {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        let active = true;
        const loadPendingCount = () => {
            getOwnerRentalRequests()
                .then((requests) => {
                    if (!active) return;
                    setPendingCount((Array.isArray(requests) ? requests : [])
                        .filter((request) => request.status === 'PENDING').length);
                })
                .catch(() => {
                    // The rental request page will display the API error when opened.
                });
        };
        loadPendingCount();
        window.addEventListener('owner-rental-requests-updated', loadPendingCount);
        return () => {
            active = false;
            window.removeEventListener('owner-rental-requests-updated', loadPendingCount);
        };
    }, []);

    return (
        <NavLink to="/owner/rental-requests">
            {icon}
            <span className="owner-menu-label">Yêu cầu thuê trọ</span>
            {pendingCount > 0 && (
                <b className="owner-pending-request-badge"
                    aria-label={`${pendingCount} yêu cầu chưa xử lý`}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                </b>
            )}
        </NavLink>
    );
}

export default OwnerRentalRequestNavLink;
