
// Async: pobierz patch po ID z MySQL
async function getPatchById(db, id) {
  if (!db) return null;
  const [[row]] = await db.execute('SELECT * FROM patches WHERE id = ? LIMIT 1', [id]);
  return row || null;
}

// Async: dodaj patch do MySQL
async function addPatch(db, { user_name, category_id, file_path, description }) {
  if (!db) throw new Error('Brak połączenia z bazą');
  const [result] = await db.execute(
    'INSERT INTO patches (user_name, category_id, file_path, description, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
    [user_name, category_id, file_path, description]
  );
  const id = result.insertId;
  const [[patch]] = await db.execute('SELECT * FROM patches WHERE id = ? LIMIT 1', [id]);
  return patch;
}


module.exports = {
  getPatchById,
  addPatch
};
