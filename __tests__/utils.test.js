console.log("UTILS TEST FILE VERSION: 2025-12-14");
const request = require('supertest');
const app = require('../app');

describe('Utils', () => {
	test('GET / responds', async () => {
		const res = await request(app).get('/');
		expect([200]).toContain(res.statusCode);
	});
});

