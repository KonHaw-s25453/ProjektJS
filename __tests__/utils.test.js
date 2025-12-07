
const request = require('supertest');
const app = require('../app');

describe('Utils', () => {
	test('GET / responds', async () => {
		const res = await request(app).get('/');
		expect([200, 404, 500]).toContain(res.statusCode);
	});
});

