const request = require('supertest');
const app = require('../index');
const FlowService = require('../services/flowService');

jest.mock('../services/flowService');

describe('Flow Routes', () => {
  beforeEach(() => {
    FlowService.mockClear();
  });

  describe('POST /api/inflow', () => {
    const validInFlowData = {
      datetime: '2023-11-15T10:00:00Z',
      item: 'Test Item',
      description: 'Test Description',
      quantity: 10,
      total_value: 1000,
      unit_value: 100
    };

    it('should create new inflow entry', async () => {
      FlowService.prototype.insertInFlowData.mockResolvedValue();

      const response = await request(app)
        .post('/api/inflow')
        .send(validInFlowData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Data inserted successfully');
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidData = { ...validInFlowData };
      delete invalidData.quantity;

      const response = await request(app)
        .post('/api/inflow')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /api/outflow', () => {
    const validOutFlowData = {
      datetime: '2023-11-15T10:00:00Z',
      item: 'Test Item',
      description: 'Test Description',
      quantity: 5,
      total_price: 600,
      unit_price: 120
    };

    it('should create new outflow entry', async () => {
      FlowService.prototype.insertOutFlowData.mockResolvedValue();

      const response = await request(app)
        .post('/api/outflow')
        .send(validOutFlowData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Data inserted successfully');
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidData = { ...validOutFlowData };
      delete invalidData.quantity;

      const response = await request(app)
        .post('/api/outflow')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/inflow-report', () => {
    it('should return 400 if dates are missing', async () => {
      const response = await request(app)
        .get('/api/inflow-report');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start and end dates are required');
    });

    it('should return PDF for valid date range', async () => {
      const mockPdf = Buffer.from('mock pdf content');
      FlowService.prototype.getInFlowData.mockResolvedValue([]);
      FlowService.prototype.generateInFlowPDF.mockResolvedValue(mockPdf);

      const response = await request(app)
        .get('/api/inflow-report')
        .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/outflow-report', () => {
    it('should return 400 if dates are missing', async () => {
      const response = await request(app)
        .get('/api/outflow-report');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start and end dates are required');
    });

    it('should return PDF for valid date range', async () => {
      const mockPdf = Buffer.from('mock pdf content');
      FlowService.prototype.getOutFlowData.mockResolvedValue([]);
      FlowService.prototype.generateOutFlowPDF.mockResolvedValue(mockPdf);

      const response = await request(app)
        .get('/api/outflow-report')
        .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/relationship-report', () => {
    it('should return 400 if dates are missing', async () => {
      const response = await request(app)
        .get('/api/relationship-report');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start and end dates are required');
    });

    it('should return PDF for valid date range', async () => {
      const mockPdf = Buffer.from('mock pdf content');
      FlowService.prototype.getInFlowData.mockResolvedValue([]);
      FlowService.prototype.getOutFlowData.mockResolvedValue([]);
      FlowService.prototype.generateRelationshipPDF.mockResolvedValue(mockPdf);

      const response = await request(app)
        .get('/api/relationship-report')
        .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });
});