import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const PendingApprovals = ({ approvals, onApprove, onReject }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All Approvals →
        </a>
      </div>
      
      <div className="space-y-4">
        {approvals.map((approval) => (
          <div key={approval.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{approval.id}</h3>
                <p className="text-sm text-gray-600">{approval.store}</p>
                <p className="text-sm text-gray-600">{approval.manager} • {approval.items} items</p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FaCalendarAlt className="mr-1" />
                {approval.date}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => onApprove(approval.id)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(approval.id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;