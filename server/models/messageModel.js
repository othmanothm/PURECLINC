const { getDb } = require('../config/db');

async function createMessage({ senderId, receiverId, message }) {
  const db = getDb();
  const [result] = await db.query(
    `INSERT INTO Messages (sender_id, receiver_id, message)
     VALUES (?, ?, ?)`,
    [senderId, receiverId, message]
  );
  return { id: result.insertId, sender_id: senderId, receiver_id: receiverId };
}

async function getConversation(userId1, userId2) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT m.*, 
     u_s.name as sender_name,
     u_r.name as receiver_name
     FROM Messages m
     JOIN Users u_s ON m.sender_id = u_s.id
     JOIN Users u_r ON m.receiver_id = u_r.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [userId1, userId2, userId2, userId1]
  );
  return rows;
}

async function getConversationsForUser(userId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT DISTINCT
     CASE 
       WHEN m.sender_id = ? THEN m.receiver_id
       ELSE m.sender_id
     END as other_user_id,
     CASE 
       WHEN m.sender_id = ? THEN u_r.name
       ELSE u_s.name
     END as other_user_name,
     CASE 
       WHEN m.sender_id = ? THEN u_r.role
       ELSE u_s.role
     END as other_user_role,
     m.message as last_message,
     m.created_at as last_message_time
     FROM Messages m
     JOIN Users u_s ON m.sender_id = u_s.id
     JOIN Users u_r ON m.receiver_id = u_r.id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId, userId, userId, userId]
  );
  
  // Group by other_user_id and get the most recent message
  const conversations = {};
  for (const row of rows) {
    const key = row.other_user_id;
    if (!conversations[key] || new Date(row.last_message_time) > new Date(conversations[key].last_message_time)) {
      conversations[key] = row;
    }
  }
  
  return Object.values(conversations);
}

module.exports = {
  createMessage,
  getConversation,
  getConversationsForUser,
};

