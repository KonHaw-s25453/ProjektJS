const { loadMock, saveMock } = require('./mockDb');

function getPatchById(id) {
  const state = loadMock();
  return state.patches.find(p => String(p.id) === String(id)) || null;
}

function addPatch({ user_name, category_id, file_path, description }) {
  const state = loadMock();
  const id = state.patches.length ? Math.max(...state.patches.map(p => p.id)) + 1 : 1;
  const uploaded_at = new Date().toISOString();
  const patch = { id, user_name, category_id: category_id || null, file_path, description, uploaded_at };
  state.patches.push(patch);
  saveMock(state);
  return patch;
}

module.exports = {
  getPatchById,
  addPatch
};
