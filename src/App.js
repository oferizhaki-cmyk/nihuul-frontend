import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function LoginPage({ onSwitchToSignUp }) {
  cconst [email, setEmail] = useState('')
const [password, setPassword] = useState('')
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בהתחברות');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload();
    } catch (err) {
      setError('שגיאת חיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>התחברות</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>אימייל:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" required />
          </div>
          <div className="form-group">
            <label>סיסמה:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="הכנס סיסמה" required />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'טוען...' : 'התחבר'}</button>
        </form>
        <p className="switch-link">אין לך חשבון? <a onClick={onSwitchToSignUp}>הרשם כאן</a></p>
      </div>
    </div>
  );
}

function SignUpPage({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', apartment: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בהרשמה');
        return;
      }

      setSuccess('הרשמה בוצעה בהצלחה! ממתין לאישור ראש הועד.');
      setFormData({ email: '', password: '', full_name: '', apartment: '', phone: '' });

      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
    } catch (err) {
      setError('שגיאת חיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>הרשמה לדייר חדש</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם מלא:</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="שם מלא" required />
          </div>
          <div className="form-group">
            <label>אימייל:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@example.com" required />
          </div>
          <div className="form-group">
            <label>סיסמה:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="סיסמה" required />
          </div>
          <div className="form-group">
            <label>דירה:</label>
            <input type="text" name="apartment" value={formData.apartment} onChange={handleChange} placeholder="דירה" required />
          </div>
          <div className="form-group">
            <label>טלפון:</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="טלפון" />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'רשומה...' : 'הרשם'}</button>
        </form>
        <p className="switch-link">יש לך חשבון? <a onClick={onSwitchToLogin}>התחבר</a></p>
      </div>
    </div>
  );
}

function ResidentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('maintenance');
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [allVotes, setAllVotes] = useState([]);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({ category: 'צנרת דולפת', description: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [voteOptions, setVoteOptions] = useState({});
  const [selectedVoteOption, setSelectedVoteOption] = useState({});
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', content: '' });
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMaintenanceRequests(token);
      fetchPayments(token);
      fetchAnnouncements();
      fetchAllVotes();
    }
  }, []);

  const fetchMaintenanceRequests = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMaintenanceRequests(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchPayments = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPayments(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/api/announcements`, { headers });
      const data = await response.json();
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAllVotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/votes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const votes = await response.json();
      setAllVotes(votes || []);

      for (const vote of votes) {
        const optionsResponse = await fetch(`${API_BASE_URL}/api/votes/${vote.id}/options`);
        const options = await optionsResponse.json();
        setVoteOptions((prev) => ({ ...prev, [vote.id]: options }));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSubmitNewRequest = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRequest),
      });

      if (response.ok) {
        setNewRequest({ category: 'צנרת דולפת', description: '' });
        setShowNewRequestForm(false);
        fetchMaintenanceRequests(token);
        alert('בקשה הוגשה בהצלחה!');
      } else {
        alert('שגיאה בהגשת בקשה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('בחר קובץ');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('notes', uploadNotes);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/payments/${selectedPaymentId}/upload-proof`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        alert('הוכחה הועלתה בהצלחה!');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadNotes('');
        setSelectedPaymentId(null);
        fetchPayments(token);
      } else {
        alert('שגיאה בהעלאת הוכחה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmitVote = async (voteId, optionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/votes/${voteId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ option_id: optionId }),
      });

      if (response.ok) {
        alert('ההצבעה שלך נרשמה בהצלחה!');
        setSelectedVoteOption({ ...selectedVoteOption, [voteId]: optionId });
      } else {
        alert('שגיאה בהצבעה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.subject.trim() || !messageForm.content.trim()) {
      alert('מלא את כל השדות');
      return;
    }

    setMessageLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageForm),
      });

      if (response.ok) {
        alert('הודעה נשלחה בהצלחה לראש הועד!');
        setMessageForm({ subject: '', content: '' });
        setShowMessageModal(false);
      } else {
        alert('שגיאה בשליחת הודעה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setMessageLoading(false);
    }
  };

  const categories = ['צנרת דולפת', 'חשמל / תאורה', 'דלת / חלון', 'קירות / צביעה', 'מיזוג אוויר', 'גג / טיפול', 'אחר'];

  return (
    <div className="resident-dashboard">
      <div className="resident-header">
        <div className="header-left">
          <h1>ברוך הבא {user.full_name} - דירה {user.apartment}</h1>
        </div>
        <div className="header-right">
          <button onClick={() => setShowMessageModal(true)} className="contact-btn">💬 הודעה לראש הועד</button>
          <button onClick={onLogout} className="logout-btn">התנתק</button>
        </div>
      </div>

      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="proof-header">
              <h3>שלח הודעה לראש הועד</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}>×</button>
            </div>

            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>נושא:</label>
                <input 
                  type="text" 
                  value={messageForm.subject} 
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} 
                  placeholder="נושא ההודעה" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>תוכן ההודעה:</label>
                <textarea 
                  value={messageForm.content} 
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })} 
                  placeholder="כתוב את הודעתך..." 
                  rows="5" 
                  required 
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={messageLoading}>{messageLoading ? 'שולח...' : '📤 שלח הודעה'}</button>
                <button type="button" onClick={() => setShowMessageModal(false)} className="cancel-btn">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>🔧 בקשות תחזוקה</button>
          <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>💳 התשלומים שלי</button>
          <button className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>📢 הודעות</button>
          <button className={`tab-btn ${activeTab === 'votes' ? 'active' : ''}`} onClick={() => setActiveTab('votes')}>🗳️ הצבעות</button>
        </div>

        <div className="tab-content">
          {activeTab === 'maintenance' && (
            <div className="tab-pane">
              <div className="tab-header">
                <h2>🔧 בקשות תחזוקה</h2>
                <button className="primary-btn" onClick={() => setShowNewRequestForm(!showNewRequestForm)}>+ הגש בקשה חדשה</button>
              </div>

              {showNewRequestForm && (
                <div className="new-request-form">
                  <h3>הגשת בקשה חדשה</h3>
                  <form onSubmit={handleSubmitNewRequest}>
                    <div className="form-group">
                      <label>קטגוריה:</label>
                      <select value={newRequest.category} onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}>
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>תיאור הבעיה:</label>
                      <textarea value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} placeholder="תאר בפירוט את הבעיה..." rows="4" required />
                    </div>
                    <div className="form-actions">
                      <button type="submit" disabled={submitLoading}>{submitLoading ? 'שולח...' : 'שלח בקשה'}</button>
                      <button type="button" onClick={() => setShowNewRequestForm(false)} className="cancel-btn">ביטול</button>
                    </div>
                  </form>
                </div>
              )}

              {maintenanceRequests.length === 0 ? (
                <p className="empty-state">אין בקשות תחזוקה כרגע</p>
              ) : (
                <div className="requests-list">
                  {maintenanceRequests.map((req) => (
                    <div key={req.id} className="request-card">
                      <div className="request-header">
                        <h3>{req.category}</h3>
                        <span className="status-badge">{req.status === 'new' && '🔴 חדשה'}{req.status === 'in_progress' && '🟡 בעבודה'}{req.status === 'completed' && '✅ הושלמה'}</span>
                      </div>
                      <p className="request-desc">{req.description}</p>
                      <div className="request-meta">
                        <span>👤 {req.full_name}</span>
                        <span>🏠 דירה {req.apartment}</span>
                        <span>📅 {new Date(req.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="tab-pane">
              <h2>💳 התשלומים שלי</h2>

              {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>העלאת הוכחה</h3>
                    <form onSubmit={handleUploadProof}>
                      <div className="form-group">
                        <label>בחר קובץ (JPG, PNG, PDF):</label>
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setUploadFile(e.target.files[0])} required />
                      </div>
                      <div className="form-group">
                        <label>הערה (אופציונלית):</label>
                        <textarea value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} placeholder="הערה על ההוכחה..." rows="3" />
                      </div>
                      <div className="form-actions">
                        <button type="submit" disabled={uploadLoading}>{uploadLoading ? 'מעלה...' : '💾 שלח הוכחה'}</button>
                        <button type="button" onClick={() => setShowUploadModal(false)} className="cancel-btn">ביטול</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {payments.length === 0 ? (
                <p className="empty-state">אין תשלומים</p>
              ) : (
                <div className="payments-list">
                  {payments.map((payment) => (
                    <div key={payment.id} className="payment-card">
                      <div className="payment-summary" onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}>
                        <div className="payment-month">
                          <span className="month-label">{payment.month}</span>
                          <span className="month-amount">₪{payment.amount}</span>
                        </div>
                        <div className="payment-status">
                          {payment.status === 'paid' ? '✅ שולם' : payment.status === 'proof_submitted' ? '⏳ בהמתנה לאישור' : '⏳ ממתין'}
                        </div>
                        <span className="expand-icon">{expandedPayment === payment.id ? '▼' : '▶'}</span>
                      </div>

                      {expandedPayment === payment.id && (
                        <div className="payment-details">
                          <table className="details-table">
                            <tbody>
                              {payment.details && Object.entries(payment.details).map(([key, value]) => (
                                <tr key={key}>
                                  <td>{key}</td>
                                  <td>₪{value}</td>
                                </tr>
                              ))}
                              <tr className="total-row">
                                <td>סה"כ</td>
                                <td>₪{payment.amount}</td>
                              </tr>
                            </tbody>
                          </table>

                          {payment.status === 'pending' && (
                            <button onClick={() => { setSelectedPaymentId(payment.id); setShowUploadModal(true); }} className="upload-proof-btn">📎 העלה הוכחה</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="tab-pane">
              <h2>📢 הודעות</h2>
              {announcements.length === 0 ? (
                <p className="empty-state">אין הודעות כרגע</p>
              ) : (
                <div className="announcements-list">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="announcement-card">
                      <h3>{ann.title}</h3>
                      <p>{ann.content}</p>
                      <div className="announcement-meta">
                        <span>👤 {ann.full_name}</span>
                        <span>📅 {new Date(ann.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'votes' && (
            <div className="tab-pane">
              <h2>🗳️ הצבעות</h2>
              {allVotes.length === 0 ? (
                <p className="empty-state">אין הצבעות פתוחות כרגע</p>
              ) : (
                <div className="votes-list">
                  {allVotes.map((vote) => (
                    vote.status === 'open' && (
                      <div key={vote.id} className="vote-card">
                        <h3>{vote.question}</h3>
                        <div className="vote-options">
                          {voteOptions[vote.id] && voteOptions[vote.id].map((option) => (
                            <div key={option.id} className="vote-option">
                              <button
                                onClick={() => handleSubmitVote(vote.id, option.id)}
                                className={selectedVoteOption[vote.id] === option.id ? 'vote-btn selected' : 'vote-btn'}
                                disabled={selectedVoteOption[vote.id] !== undefined}
                              >
                                {selectedVoteOption[vote.id] === option.id && '✓ '}
                                {option.option_text}
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="vote-status">📅 {new Date(vote.created_at).toLocaleDateString('he-IL')} • {vote.vote_count} הצביעו</p>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [activeAdminTab, setActiveAdminTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingProofs, setPendingProofs] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [allResidents, setAllResidents] = useState([]);
  const [adminVotes, setAdminVotes] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [token, setToken] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [maintenanceStatusLoading, setMaintenanceStatusLoading] = useState(null);
  const [editingStatus, setEditingStatus] = useState({});
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showNewVoteForm, setShowNewVoteForm] = useState(false);
  const [newVote, setNewVote] = useState({ question: '', options: ['', ''] });
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteOptions, setVoteOptions] = useState({});
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [summaryReport, setSummaryReport] = useState(null);
  const [expensesReport, setExpensesReport] = useState(null);
  const [residentsReport, setResidentsReport] = useState([]);
  const [yearlyReport, setYearlyReport] = useState([]);
  const [activeReportTab, setActiveReportTab] = useState('summary');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchPendingUsers(storedToken);
      fetchPendingProofs(storedToken);
      fetchMaintenanceRequests(storedToken);
      fetchAdminAnnouncements(storedToken);
      fetchAllResidents(storedToken);
      fetchAdminVotes(storedToken);
      fetchAdminMessages(storedToken);
      fetchSummaryReport(storedToken);
      fetchExpensesReport(storedToken);
      fetchResidentsReport(storedToken);
      fetchYearlyReport(storedToken);
    }
  }, []);

  const fetchSummaryReport = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/summary`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setSummaryReport(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchExpensesReport = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/expenses`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setExpensesReport(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchResidentsReport = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/residents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setResidentsReport(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchYearlyReport = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/yearly`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setYearlyReport(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const exportToExcel = (data, fileName) => {
    if (!window.XLSX) {
      alert('ספריית Excel עדיין נטוענת, אנא נסה שוב בעוד שניה');
      return;
    }
    
    try {
      const ws = window.XLSX.utils.json_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'דוח');
      window.XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('שגיאה בייצוא ל-Excel');
    }
  };

  const exportFullExcelReport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/excel-export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        alert('שגיאה בהורדת נתונים');
        setExportLoading(false);
        return;
      }

      const data = await response.json();
      const { residents, months, expenses } = data;

      if (!window.XLSX) {
        alert('ספריית Excel עדיין נטוענת, אנא נסה שוב בעוד שניה');
        setExportLoading(false);
        return;
      }

      const wb = window.XLSX.utils.book_new();

      // Sheet 1 - Residents with payments
      const residentsForExcel = residents.map((resident) => {
        const row = {
          'שם': resident.full_name,
          'דוא"ל': resident.email,
          'טלפון': resident.phone || '',
          'דירה': resident.apartment,
        };
        months.forEach((month) => {
          row[month] = resident[month] || 0;
        });
        return row;
      });

      const ws1 = window.XLSX.utils.json_to_sheet(residentsForExcel);
      window.XLSX.utils.book_append_sheet(wb, ws1, 'דיירים ותשלומים');

      // Sheet 2 - Expenses
      const expensesForExcel = [
        { 'קטגוריה': 'שמאל', 'סכום': expenses.שמאל },
        { 'קטגוריה': 'חשמל', 'סכום': expenses.חשמל },
        { 'קטגוריה': 'ביקון', 'סכום': expenses.ביקון },
        { 'קטגוריה': 'גינון', 'סכום': expenses.גינון },
        { 'קטגוריה': 'סה"כ', 'סכום': expenses.total },
      ];

      const ws2 = window.XLSX.utils.json_to_sheet(expensesForExcel);
      window.XLSX.utils.book_append_sheet(wb, ws2, 'הוצאות');

      window.XLSX.writeFile(wb, 'דוח_מצפה_47.xlsx');
      alert('דוח הורד בהצלחה!');
    } catch (err) {
      console.error('Export error:', err);
      alert('שגיאה בייצוא לExcel');
    } finally {
      setExportLoading(false);
    }
  };

  const exportSummaryReport = () => {
    if (!summaryReport) return;
    const data = [{
      'סה"כ שולם': `₪${summaryReport.total_paid}`,
      'סה"כ בהמתנה': `₪${summaryReport.total_pending}`,
      'סה"כ חוב': `₪${summaryReport.total_unpaid}`,
      'דיירים ששילמו': `${summaryReport.paid_residents}/${summaryReport.total_residents}`,
      'אחוז': `${summaryReport.percentage}%`,
    }];
    exportToExcel(data, 'דוח_סיכום_חודשי');
  };

  const exportExpensesReport = () => {
    if (!expensesReport) return;
    const data = [{
      'שמאל': `₪${expensesReport.שמאל}`,
      'חשמל': `₪${expensesReport.חשמל}`,
      'ביקון': `₪${expensesReport.ביקון}`,
      'גינון': `₪${expensesReport.גינון}`,
      'סה"כ': `₪${expensesReport.total}`,
    }];
    exportToExcel(data, 'דוח_הוצאות');
  };

  const exportResidentsReport = () => {
    if (!residentsReport.length) return;
    const data = residentsReport.map(r => ({
      'שם': r.full_name,
      'דירה': r.apartment,
      'שולם': `₪${r.total_paid || 0}`,
      'חוב': `₪${r.total_unpaid || 0}`,
      'בהמתנה': `₪${r.total_pending || 0}`,
    }));
    exportToExcel(data, 'דוח_דיירים');
  };

  const exportYearlyReport = () => {
    if (!yearlyReport.length) return;
    const data = yearlyReport.map(r => ({
      'חודש': r.month,
      'שולם': `₪${r.total_paid}`,
      'אחוז': `${r.percentage}%`,
      'דיירים ששילמו': `${r.paid_residents}/${r.total_residents}`,
    }));
    exportToExcel(data, 'דוח_צמודיון');
  };

  const fetchPendingUsers = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pending-users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setPendingUsers(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchPendingProofs = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pending-proofs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setPendingProofs(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchMaintenanceRequests = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setMaintenanceRequests(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAdminAnnouncements = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setAdminAnnouncements(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAllResidents = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/all-residents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setAllResidents(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAdminVotes = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/votes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const votes = await response.json();
      setAdminVotes(votes);

      for (const vote of votes) {
        const optionsResponse = await fetch(`${API_BASE_URL}/api/votes/${vote.id}/options`);
        const options = await optionsResponse.json();
        setVoteOptions((prev) => ({ ...prev, [vote.id]: options }));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAdminMessages = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setAdminMessages(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAdminMessages(token);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const approveUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
        fetchAllResidents(token);
        alert('דייר אושר בהצלחה!');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const rejectUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
        alert('דייר נדחה.');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleApproveProof = async (proofId) => {
    setApproveLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/proofs/${proofId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPendingProofs(pendingProofs.filter((p) => p.id !== proofId));
        setShowProofModal(false);
        alert('הוכחה אושרה בהצלחה! תשלום מסומן כשולם.');
      } else {
        alert('שגיאה באישור הוכחה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectProof = async (proofId) => {
    if (!rejectReason.trim()) {
      alert('כתוב סיבה לדחייה');
      return;
    }

    setApproveLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/proofs/${proofId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        setPendingProofs(pendingProofs.filter((p) => p.id !== proofId));
        setShowProofModal(false);
        setRejectReason('');
        setShowRejectForm(false);
        alert('הוכחה נדחתה. דייר יכול להעלות הוכחה חדשה.');
      } else {
        alert('שגיאה בדחייה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleUpdateMaintenanceStatus = async (requestId, newStatus) => {
    setMaintenanceStatusLoading(requestId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/maintenance/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMaintenanceRequests(maintenanceRequests.map((req) => req.id === requestId ? { ...req, status: newStatus } : req));
        setEditingStatus({ ...editingStatus, [requestId]: false });
        alert('סטטוס עודכן בהצלחה!');
      } else {
        alert('שגיאה בעדכון סטטוס');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setMaintenanceStatusLoading(null);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAnnouncement),
      });

      if (response.ok) {
        setNewAnnouncement({ title: '', content: '' });
        setShowAnnouncementForm(false);
        fetchAdminAnnouncements(token);
        alert('הודעה נשלחה בהצלחה לכל הדיירים!');
      } else {
        alert('שגיאה בשליחת הודעה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('האם אתה בטוח שאתה רוצה למחוק הודעה זו?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAdminAnnouncements(token);
        alert('הודעה נמחקה בהצלחה');
      } else {
        alert('שגיאה במחיקת הודעה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    }
  };

  const openEditModal = (resident) => {
    setEditingResident(resident);
    setEditForm({ ...resident });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const saveEditedResident = () => {
    alert('שינויים נשמרו בהצלחה!');
    setShowEditModal(false);
    fetchAllResidents(token);
  };

  const handleCreateVote = async (e) => {
    e.preventDefault();
    if (!newVote.question.trim()) {
      alert('כתוב שאלה');
      return;
    }

    const validOptions = newVote.options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert('צריך לפחות 2 אפציות');
      return;
    }

    setVoteLoading(true);

    try {
      const voteResponse = await fetch(`${API_BASE_URL}/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: newVote.question }),
      });

      const voteData = await voteResponse.json();
      const voteId = voteData.id;

      for (const option of validOptions) {
        await fetch(`${API_BASE_URL}/api/votes/${voteId}/options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ option_text: option }),
        });
      }

      setNewVote({ question: '', options: ['', ''] });
      setShowNewVoteForm(false);
      fetchAdminVotes(token);
      alert('הצבעה חדשה נוצרה בהצלחה!');
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleCloseVote = async (voteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/votes/${voteId}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAdminVotes(token);
        alert('הצבעה סגורה בהצלחה');
      } else {
        alert('שגיאה בסגירת הצבעה');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('שגיאת חיבור');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return '🔴 חדשה';
      case 'in_progress':
        return '🟡 בעבודה';
      case 'completed':
        return '✅ הושלמה';
      default:
        return status;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👨‍💼 דשבורד ראש הועד</h1>
        <div className="user-info">
          <span>{user.full_name}</span>
          <button onClick={onLogout} className="logout-btn">התנתק</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeAdminTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveAdminTab('reports')}>📊 דוחות כספיים</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveAdminTab('messages')}>💬 הודעות דיירים</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveAdminTab('pending')}>🔔 דיירים ממתינים</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveAdminTab('payments')}>💳 אישור תשלומים</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveAdminTab('maintenance')}>🔧 בקשות תחזוקה</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveAdminTab('announcements')}>📢 שליחת הודעות</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveAdminTab('residents')}>👥 ניהול דיירים</button>
        <button className={`admin-tab-btn ${activeAdminTab === 'votes' ? 'active' : ''}`} onClick={() => setActiveAdminTab('votes')}>🗳️ הצבעות</button>
      </div>

      {showMessageModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="proof-header">
              <h3>הודעה מ-{selectedMessage.full_name}</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}>×</button>
            </div>

            <div className="message-details">
              <p><strong>דירה:</strong> {selectedMessage.apartment}</p>
              <p><strong>נושא:</strong> {selectedMessage.subject}</p>
              <p><strong>תאריך:</strong> {new Date(selectedMessage.created_at).toLocaleDateString('he-IL')}</p>
              <hr style={{ margin: '15px 0' }} />
              <p><strong>תוכן:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{selectedMessage.content}</p>
            </div>

            <div className="form-actions">
              <button onClick={() => { markMessageAsRead(selectedMessage.id); setShowMessageModal(false); }} className="approve-btn">✅ סימן כנקרא</button>
              <button onClick={() => setShowMessageModal(false)} className="cancel-btn">סגור</button>
            </div>
          </div>
        </div>
      )}

      {showProofModal && selectedProof && (
        <div className="modal-overlay" onClick={() => setShowProofModal(false)}>
          <div className="modal-content proof-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proof-header">
              <h3>{selectedProof.full_name} - {selectedProof.month}</h3>
              <button className="modal-close" onClick={() => setShowProofModal(false)}>×</button>
            </div>

            <div className="proof-details">
              <p><strong>דירה:</strong> {selectedProof.apartment}</p>
              <p><strong>סכום:</strong> ₪{selectedProof.amount}</p>
              {selectedProof.notes && (<p><strong>הערת דייר:</strong> {selectedProof.notes}</p>)}
            </div>

            <div className="proof-image">
              <img src={`${API_BASE_URL}${selectedProof.file_path}`} alt="proof" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '6px' }} />
            </div>

            {!showRejectForm ? (
              <div className="proof-actions">
                <button onClick={() => handleApproveProof(selectedProof.id)} className="approve-btn" disabled={approveLoading}>{approveLoading ? 'מעדכן...' : '✅ אשר תשלום'}</button>
                <button onClick={() => setShowRejectForm(true)} className="reject-btn" disabled={approveLoading}>❌ דחה הוכחה</button>
              </div>
            ) : (
              <div className="reject-form">
                <h4>סיבת דחייה:</h4>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="כתוב סיבה לדחייה..." rows="3" />
                <div className="form-actions">
                  <button onClick={() => handleRejectProof(selectedProof.id)} className="reject-btn" disabled={approveLoading}>{approveLoading ? 'שולח...' : 'שלח דחייה'}</button>
                  <button onClick={() => { setShowRejectForm(false); setRejectReason(''); }} className="cancel-btn" disabled={approveLoading}>ביטול</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && editingResident && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="proof-header">
              <h3>עריכת דייר: {editingResident.full_name}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label>שם מלא:</label>
              <input type="text" value={editForm.full_name || ''} onChange={(e) => handleEditChange('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>אימייל:</label>
              <input type="email" value={editForm.email || ''} onChange={(e) => handleEditChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>טלפון:</label>
              <input type="tel" value={editForm.phone || ''} onChange={(e) => handleEditChange('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>דירה:</label>
              <input type="text" value={editForm.apartment || ''} onChange={(e) => handleEditChange('apartment', e.target.value)} />
            </div>

            <div className="form-actions">
              <button onClick={saveEditedResident} className="approve-btn">💾 שמור שינויים</button>
              <button onClick={() => setShowEditModal(false)} className="cancel-btn">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'reports' && (
        <div className="admin-section">
          <h2>📊 דוחות כספיים</h2>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '6px', border: '2px solid #4a90e2' }}>
            <button onClick={exportFullExcelReport} className="primary-btn" disabled={exportLoading}>
              📥 {exportLoading ? 'מוריד...' : 'הורד דוח מלא (דיירים + תשלומים)'}
            </button>
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#555' }}>🔔 הדוח יכלול: שמות דיירים, דואים, טלפונים, דירות, ותשלומים לכל 12 החודשים</p>
          </div>

          <div className="reports-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button 
              className={`admin-tab-btn ${activeReportTab === 'summary' ? 'active' : ''}`} 
              onClick={() => setActiveReportTab('summary')}
              style={{ flex: '1', minWidth: '150px' }}
            >
              📋 סיכום
            </button>
            <button 
              className={`admin-tab-btn ${activeReportTab === 'expenses' ? 'active' : ''}`} 
              onClick={() => setActiveReportTab('expenses')}
              style={{ flex: '1', minWidth: '150px' }}
            >
              💰 הוצאות
            </button>
            <button 
              className={`admin-tab-btn ${activeReportTab === 'residents' ? 'active' : ''}`} 
              onClick={() => setActiveReportTab('residents')}
              style={{ flex: '1', minWidth: '150px' }}
            >
              👥 לפי דייר
            </button>
            <button 
              className={`admin-tab-btn ${activeReportTab === 'yearly' ? 'active' : ''}`} 
              onClick={() => setActiveReportTab('yearly')}
              style={{ flex: '1', minWidth: '150px' }}
            >
              📈 צמודיון
            </button>
          </div>

          {activeReportTab === 'summary' && summaryReport && (
            <div className="report-content">
              <h3>📋 דוח סיכום חודשי</h3>
              <div className="report-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>סה"כ שולם</h4>
                  <p style={{ fontSize: '24px', color: 'green', margin: '10px 0' }}>₪{summaryReport.total_paid}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>סה"כ בהמתנה</h4>
                  <p style={{ fontSize: '24px', color: 'orange', margin: '10px 0' }}>₪{summaryReport.total_pending}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>סה"כ חוב</h4>
                  <p style={{ fontSize: '24px', color: 'red', margin: '10px 0' }}>₪{summaryReport.total_unpaid}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>אחוז תשלום</h4>
                  <p style={{ fontSize: '24px', color: 'blue', margin: '10px 0' }}>{summaryReport.percentage}%</p>
                </div>
              </div>
              <p style={{ marginBottom: '15px' }}>דיירים ששילמו: {summaryReport.paid_residents} מתוך {summaryReport.total_residents}</p>
              <button onClick={exportSummaryReport} className="primary-btn">📥 הורד כ-Excel</button>
            </div>
          )}

          {activeReportTab === 'expenses' && expensesReport && (
            <div className="report-content">
              <h3>💰 דוח הוצאות</h3>
              <div className="report-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>שמאל</h4>
                  <p style={{ fontSize: '20px', margin: '10px 0' }}>₪{expensesReport.שמאל}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>חשמל</h4>
                  <p style={{ fontSize: '20px', margin: '10px 0' }}>₪{expensesReport.חשמל}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>ביקון</h4>
                  <p style={{ fontSize: '20px', margin: '10px 0' }}>₪{expensesReport.ביקון}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>גינון</h4>
                  <p style={{ fontSize: '20px', margin: '10px 0' }}>₪{expensesReport.גינון}</p>
                </div>
                <div className="report-card" style={{ padding: '15px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#f0f0f0' }}>
                  <h4><strong>סה"כ</strong></h4>
                  <p style={{ fontSize: '20px', margin: '10px 0', fontWeight: 'bold' }}>₪{expensesReport.total}</p>
                </div>
              </div>
              <button onClick={exportExpensesReport} className="primary-btn">📥 הורד כ-Excel</button>
            </div>
          )}

          {activeReportTab === 'residents' && residentsReport.length > 0 && (
            <div className="report-content">
              <h3>👥 דוח לפי דייר</h3>
              <div className="report-table" style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #333' }}>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>שם</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>דירה</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>שולם</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>חוב</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>בהמתנה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residentsReport.map((resident, idx) => (
                      <tr key={resident.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{resident.full_name}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{resident.apartment}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'green' }}>₪{resident.total_paid || 0}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'red' }}>₪{resident.total_unpaid || 0}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'orange' }}>₪{resident.total_pending || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={exportResidentsReport} className="primary-btn">📥 הורד כ-Excel</button>
            </div>
          )}

          {activeReportTab === 'yearly' && yearlyReport.length > 0 && (
            <div className="report-content">
              <h3>📈 דוח צמודיון</h3>
              <div className="report-table" style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #333' }}>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>חודש</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>סה"כ שולם</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>דיירים ששילמו</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>אחוז</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyReport.map((year, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{year.month}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>₪{year.total_paid}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{year.paid_residents}/{year.total_residents}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{year.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={exportYearlyReport} className="primary-btn">📥 הורד כ-Excel</button>
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'messages' && (
        <div className="admin-section">
          <h2>💬 הודעות מדיירים</h2>
          {adminMessages.length === 0 ? (
            <p>אין הודעות</p>
          ) : (
            <div className="messages-list">
              {adminMessages.map((msg) => (
                <div key={msg.id} className={`message-item ${msg.status === 'unread' ? 'unread' : ''}`}>
                  <div className="message-info">
                    <h3>{msg.full_name} - דירה {msg.apartment}</h3>
                    <p className="message-subject">📌 {msg.subject}</p>
                    <p className="message-preview">{msg.content.substring(0, 100)}...</p>
                    <p className="message-date">📅 {new Date(msg.created_at).toLocaleDateString('he-IL')}</p>
                    {msg.status === 'unread' && <span className="unread-badge">🔴 חדשה</span>}
                  </div>
                  <button onClick={() => { setSelectedMessage(msg); setShowMessageModal(true); }} className="view-msg-btn">👁️ צפה</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'pending' && (
        <div className="admin-section">
          <h2>🔔 דיירים ממתינים לאישור</h2>
          {pendingUsers.length === 0 ? (
            <p>אין דיירים ממתינים</p>
          ) : (
            <div className="pending-users-list">
              {pendingUsers.map((u) => (
                <div key={u.id} className="pending-user-item">
                  <div className="user-details">
                    <h3>{u.full_name}</h3>
                    <p>📧 {u.email}</p>
                    <p>🏠 דירה {u.apartment}</p>
                    {u.phone && <p>📱 {u.phone}</p>}
                  </div>
                  <div className="user-actions">
                    <button onClick={() => approveUser(u.id)} className="approve-btn">✓ אשר</button>
                    <button onClick={() => rejectUser(u.id)} className="reject-btn">✗ דחה</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'payments' && (
        <div className="admin-section">
          <h2>💳 אישור תשלומים</h2>
          {pendingProofs.length === 0 ? (
            <p>אין הוכחות ממתינות</p>
          ) : (
            <div className="proofs-list">
              {pendingProofs.map((proof) => (
                <div key={proof.id} className="proof-item">
                  <div className="proof-info">
                    <h3>{proof.full_name}</h3>
                    <p>🏠 דירה {proof.apartment}</p>
                    <p>📅 {proof.month}</p>
                    <p>💰 ₪{proof.amount}</p>
                    {proof.notes && (<p className="proof-notes">📝 {proof.notes}</p>)}
                  </div>
                  <button onClick={() => { setSelectedProof(proof); setShowProofModal(true); }} className="view-proof-btn">📎 צפה בהוכחה</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'maintenance' && (
        <div className="admin-section">
          <h2>🔧 בקשות תחזוקה</h2>
          {maintenanceRequests.length === 0 ? (
            <p>אין בקשות תחזוקה</p>
          ) : (
            <div className="maintenance-list">
              {maintenanceRequests.map((req) => (
                <div key={req.id} className="maintenance-card">
                  <div className="maintenance-header">
                    <div className="maintenance-info">
                      <h3>{req.category}</h3>
                      <p className="tenant-name">👤 {req.full_name} | 🏠 דירה {req.apartment}</p>
                      <p className="description">{req.description}</p>
                      <p className="date">📅 {new Date(req.created_at).toLocaleDateString('he-IL')}</p>
                    </div>

                    <div className="maintenance-actions">
                      {editingStatus[req.id] ? (
                        <div className="status-edit">
                          <select value={req.status} onChange={(e) => { setMaintenanceRequests(maintenanceRequests.map((r) => r.id === req.id ? { ...r, status: e.target.value } : r)); }} className="status-select">
                            <option value="new">🔴 חדשה</option>
                            <option value="in_progress">🟡 בעבודה</option>
                            <option value="completed">✅ הושלמה</option>
                          </select>
                          <button onClick={() => handleUpdateMaintenanceStatus(req.id, req.status)} className="save-btn" disabled={maintenanceStatusLoading === req.id}>{maintenanceStatusLoading === req.id ? '...' : '💾'}</button>
                          <button onClick={() => setEditingStatus({ ...editingStatus, [req.id]: false })} className="cancel-btn">✕</button>
                        </div>
                      ) : (
                        <div className="status-display">
                          <span className="status-badge">{getStatusBadge(req.status)}</span>
                          <button onClick={() => setEditingStatus({ ...editingStatus, [req.id]: true })} className="edit-btn">✏️ עדכן</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'announcements' && (
        <div className="admin-section">
          <h2>📢 שליחת הודעות לדיירים</h2>

          {showAnnouncementForm ? (
            <div className="new-announcement-form">
              <h3>הוספת הודעה חדשה</h3>
              <form onSubmit={handleCreateAnnouncement}>
                <div className="form-group">
                  <label>כותרת:</label>
                  <input type="text" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} placeholder="הכנס כותרת הודעה" required />
                </div>
                <div className="form-group">
                  <label>תוכן ההודעה:</label>
                  <textarea value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} placeholder="כתוב את הודעתך כאן..." rows="6" required />
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={announcementLoading}>{announcementLoading ? 'שולח...' : '📤 שלח הודעה'}</button>
                  <button type="button" onClick={() => setShowAnnouncementForm(false)} className="cancel-btn">ביטול</button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <button onClick={() => setShowAnnouncementForm(true)} className="primary-btn">+ הוסף הודעה חדשה</button>
            </div>
          )}

          <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>הודעות שנשלחו:</h3>

          {adminAnnouncements.length === 0 ? (
            <p className="empty-state">אין הודעות עדיין</p>
          ) : (
            <div className="announcements-admin-list">
              {adminAnnouncements.map((ann) => (
                <div key={ann.id} className="announcement-admin-card">
                  <div className="announcement-header-admin">
                    <div>
                      <h4>{ann.title}</h4>
                      <p className="announcement-date">📅 {new Date(ann.created_at).toLocaleDateString('he-IL')}</p>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="delete-btn" title="מחק הודעה">🗑️</button>
                  </div>
                  <p className="announcement-content">{ann.content}</p>
                  <p className="announcement-status">✅ נשלחה לכל הדיירים</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'residents' && (
        <div className="admin-section">
          <h2>👥 ניהול דיירים</h2>
          {allResidents.length === 0 ? (
            <p>אין דיירים</p>
          ) : (
            <div className="residents-list">
              {allResidents.map((resident) => (
                <div key={resident.id} className="resident-card">
                  <div className="resident-info">
                    <h3>{resident.full_name}</h3>
                    <p>📧 {resident.email}</p>
                    <p>🏠 דירה {resident.apartment}</p>
                    {resident.phone && <p>📱 {resident.phone}</p>}
                    <p className="resident-status">{resident.is_approved ? '✅ אושר' : '⏳ ממתין'}</p>
                  </div>
                  <button onClick={() => openEditModal(resident)} className="edit-btn">✏️ עריכה</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'votes' && (
        <div className="admin-section">
          <h2>🗳️ ניהול הצבעות</h2>

          {showNewVoteForm ? (
            <div className="new-vote-form">
              <h3>יצירת הצבעה חדשה</h3>
              <form onSubmit={handleCreateVote}>
                <div className="form-group">
                  <label>שאלה:</label>
                  <input type="text" value={newVote.question} onChange={(e) => setNewVote({ ...newVote, question: e.target.value })} placeholder="הכנס את השאלה להצבעה" required />
                </div>
                <div className="form-group">
                  <label>אפציות:</label>
                  {newVote.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newVote.options];
                        newOptions[index] = e.target.value;
                        setNewVote({ ...newVote, options: newOptions });
                      }}
                      placeholder={`אפציה ${index + 1}`}
                      style={{ marginBottom: '10px', display: 'block' }}
                    />
                  ))}
                  <button type="button" onClick={() => setNewVote({ ...newVote, options: [...newVote.options, ''] })} className="small-btn">+ הוסף אפציה</button>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={voteLoading}>{voteLoading ? 'יוצר...' : '✅ צור הצבעה'}</button>
                  <button type="button" onClick={() => setShowNewVoteForm(false)} className="cancel-btn">ביטול</button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <button onClick={() => setShowNewVoteForm(true)} className="primary-btn">+ צור הצבעה חדשה</button>
            </div>
          )}

          <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>הצבעות פעילות:</h3>

          {adminVotes.filter((v) => v.status === 'open').length === 0 ? (
            <p className="empty-state">אין הצבעות פתוחות</p>
          ) : (
            <div className="votes-admin-list">
              {adminVotes.filter((v) => v.status === 'open').map((vote) => (
                <div key={vote.id} className="vote-admin-card">
                  <div className="vote-header-admin">
                    <div>
                      <h4>{vote.question}</h4>
                      <p className="vote-info">📅 {new Date(vote.created_at).toLocaleDateString('he-IL')} • {vote.vote_count} הצביעו</p>
                    </div>
                    <button onClick={() => handleCloseVote(vote.id)} className="close-vote-btn">🔒 סגור הצבעה</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminVotes.filter((v) => v.status === 'closed').length > 0 && (
            <>
              <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>הצבעות סגורות:</h3>
              <div className="votes-admin-list">
                {adminVotes.filter((v) => v.status === 'closed').map((vote) => (
                  <div key={vote.id} className="vote-admin-card closed">
                    <div className="vote-header-admin">
                      <div>
                        <h4>{vote.question}</h4>
                        <p className="vote-info">🔒 סגורה • {vote.vote_count} הצביעו</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return isSignUpMode ? <SignUpPage onSwitchToLogin={() => setIsSignUpMode(false)} /> : <LoginPage onSwitchToSignUp={() => setIsSignUpMode(true)} />;
  }

  if (user.user_type === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return <ResidentDashboard user={user} onLogout={handleLogout} />;
}

export default App;