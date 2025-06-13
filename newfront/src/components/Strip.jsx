import React, { useState } from 'react';

const PaymentsPage = () => {
  // Sample payment data
  const [payments, setPayments] = useState([
    {
      id: '1',
      amount: 84500.00,
      currency: 'LBP',
      status: 'Succeeded',
      paymentMethod: '•••• 4242',
      paymentId: 'p1_3PvDc1Cb8r6G0KEj11pC12aJ',
      customerId: 'cus_QMKHb9yYk4Cts',
      date: '2025-06-25T15:49:00',
      dispute: false
    },
    {
      id: '2',
      amount: 81500.00,
      currency: 'LBP',
      status: 'Succeeded',
      paymentMethod: '•••• 4242',
      paymentId: 'p1_3PvDc1Cb8r6G0KEj11Tf7fyFjq',
      customerId: 'cus_QMKFX16AyY03e',
      date: '2025-06-25T15:48:00',
      dispute: false
    },
    // Add more payments as needed
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Handle edit start
  const startEdit = (payment) => {
    setEditingId(payment.id);
    setEditForm({ ...payment });
  };

  // Handle edit cancel
  const cancelEdit = () => {
    setEditingId(null);
  };

  // Handle save edit
  const saveEdit = () => {
    setPayments(payments.map(p => p.id === editingId ? editForm : p));
    setEditingId(null);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + 
           ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Filter payments based on search, status and date range
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         payment.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status.toLowerCase() === statusFilter;
    
    const paymentDate = new Date(payment.date);
    const matchesDate = !dateRange.start || !dateRange.end || 
                       (paymentDate >= dateRange.start && paymentDate <= dateRange.end);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="payments-container" style={{marginTop:"80px"}}>
      <h1>Payments</h1>
      <div className="payments-header">
        <h2>All payments</h2>
        <p>All transactions</p>
      </div>

      <div className="filters-container">
        <div className="status-filters">
          <button 
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            All {payments.length}
          </button>
          <button 
            className={statusFilter === 'succeeded' ? 'active' : ''}
            onClick={() => setStatusFilter('succeeded')}
          >
            Succeeded {payments.filter(p => p.status === 'Succeeded').length}
          </button>
          <button 
            className={statusFilter === 'refunded' ? 'active' : ''}
            onClick={() => setStatusFilter('refunded')}
          >
            Refunded {payments.filter(p => p.status === 'Refunded').length}
          </button>
          <button 
            className={statusFilter === 'failed' ? 'active' : ''}
            onClick={() => setStatusFilter('failed')}
          >
            Failed {payments.filter(p => p.status === 'Failed').length}
          </button>
        </div>

        <div className="search-filters">
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="date-range">
            <input
              type="date"
              onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
            />
            <span>to</span>
            <input
              type="date"
              onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="actions-bar">
        <button className="export-btn">Export</button>
        <button className="columns-btn">Edit Columns</button>
      </div>

      <div className="payments-table">
        <div className="table-header">
          <div>Amount</div>
          <div>Currency</div>
          <div>Status</div>
          <div>Payment Method</div>
          <div>Payment ID</div>
          <div>Customer</div>
          <div>Date</div>
          <div>Action</div>
        </div>

        {filteredPayments.map(payment => (
          <div className="table-row" key={payment.id}>
            {editingId === payment.id ? (
              <>
                <div>
                  <input
                    type="number"
                    name="amount"
                    value={editForm.amount}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="currency"
                    value={editForm.currency}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleInputChange}
                  >
                    <option value="Succeeded">Succeeded</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    name="paymentMethod"
                    value={editForm.paymentMethod}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="paymentId"
                    value={editForm.paymentId}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="customerId"
                    value={editForm.customerId}
                    onChange={handleInputChange}
                  />
                </div>
                <div>{formatDate(payment.date)}</div>
                <div className="action-buttons">
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div>${payment.amount.toFixed(2)}</div>
                <div>{payment.currency}</div>
                <div>
                  <span className={`status-badge ${payment.status.toLowerCase()}`}>
                    {payment.status} {payment.status === 'Succeeded' && '✓'}
                  </span>
                </div>
                <div>{payment.paymentMethod}</div>
                <div>{payment.paymentId}</div>
                <div>{payment.customerId}</div>
                <div>{formatDate(payment.date)}</div>
                <div>
                  <button onClick={() => startEdit(payment)}>Edit</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .payments-container {
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .payments-header h2 {
          margin-bottom: 5px;
        }
        
        .payments-header p {
          color: #666;
          margin-top: 0;
        }
        
        .filters-container {
          margin: 20px 0;
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
        }
        
        .status-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .status-filters button {
          padding: 5px 10px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .status-filters button.active {
          background: #1890ff;
          color: white;
          border-color: #1890ff;
        }
        
        .search-filters {
          display: flex;
          gap: 15px;
        }
        
        .search-filters input[type="text"] {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          flex-grow: 1;
          max-width: 300px;
        }
        
        .date-range {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .date-range input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .actions-bar button {
          padding: 8px 15px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .payments-table {
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          background: #f5f5f5;
          padding: 10px 15px;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
        }
        
        .table-row {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          padding: 10px 15px;
          border-bottom: 1px solid #eee;
        }
        
        .table-row:last-child {
          border-bottom: none;
        }
        
        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.85em;
        }
        
        .status-badge.succeeded {
          background: #e6f7ff;
          color: #1890ff;
        }
        
        .status-badge.refunded {
          background: #fff7e6;
          color: #fa8c16;
        }
        
        .status-badge.failed {
          background: #fff1f0;
          color: #f5222d;
        }
        
        .action-buttons {
          display: flex;
          gap: 5px;
        }
        
        .action-buttons button {
          padding: 3px 8px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 3px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default PaymentsPage;
