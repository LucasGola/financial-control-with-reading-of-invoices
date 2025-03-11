const FlowService = require("../services/flowService");
const { db } = require("../config/firebase");
const PDFDocument = require("pdfkit");

jest.mock("../config/firebase", () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe("FlowService", () => {
  let flowService;
  let mockGet;
  let mockSet;

  beforeEach(() => {
    mockGet = jest.fn();
    mockSet = jest.fn();
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: mockGet,
        set: mockSet,
      }),
    });
    flowService = new FlowService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("insertInFlowData", () => {
    it("should insert inFlow data correctly", async () => {
      const testData = {
        datetime: "2023-11-15T10:00:00Z",
        item: "Test Item",
        description: "Test Description",
        quantity: 10,
        total_value: 1000,
        unit_value: 100,
      };

      const mockTimestamp = "1234567890";
      jest.spyOn(Date.prototype, "getTime").mockReturnValue(mockTimestamp);

      mockSet.mockResolvedValue();
      await flowService.insertInFlowData(testData);

      expect(mockSet).toHaveBeenCalledWith(
        {
          [mockTimestamp]: {
            datetime: new Date(testData.datetime),
            description: testData.description,
            item: testData.item,
            quantity: testData.quantity,
            total_value: testData.total_value,
            unit_value: testData.unit_value,
          },
        },
        { merge: true }
      );
    });
  });

  describe("insertOutFlowData", () => {
    it("should insert outFlow data correctly", async () => {
      const testData = {
        datetime: "2023-11-15T10:00:00Z",
        item: "Test Item",
        description: "Test Description",
        quantity: 5,
        total_price: 600,
        unit_price: 120,
      };

      const mockTimestamp = "1234567890";
      jest.spyOn(Date.prototype, "getTime").mockReturnValue(mockTimestamp);

      mockSet.mockResolvedValue();
      await flowService.insertOutFlowData(testData);

      expect(mockSet).toHaveBeenCalledWith(
        {
          [mockTimestamp]: {
            datetime: new Date(testData.datetime),
            description: testData.description,
            item: testData.item,
            quantity: testData.quantity,
            total_price: testData.total_price,
            unit_price: testData.unit_price,
          },
        },
        { merge: true }
      );
    });
  });

  describe("getInFlowData", () => {
    it("should fetch and filter inFlow data by date range", async () => {
      const mockData = {
        entry1: {
          datetime: { toDate: () => new Date("2023-01-15") },
          item: "Item 1",
          description: "Test description",
          quantity: 5,
          total_value: 100,
          unit_value: 20,
        },
      };

      mockGet.mockResolvedValue({
        data: () => mockData,
      });

      const result = await flowService.getInFlowData(
        "2023-01-01",
        "2023-01-31"
      );
      expect(result).toHaveLength(1);
      expect(result[0].item).toBe("Item 1");
    });
  });

  describe("getOutFlowData", () => {
    it("should fetch and filter outFlow data by date range", async () => {
      const mockData = {
        entry1: {
          datetime: { toDate: () => new Date("2023-01-15") },
          item: "Item 1",
          description: "Test description",
          quantity: 3,
          total_price: 150,
          unit_price: 50,
        },
      };

      mockGet.mockResolvedValue({
        data: () => mockData,
      });

      const result = await flowService.getOutFlowData(
        "2023-01-01",
        "2023-01-31"
      );
      expect(result).toHaveLength(1);
      expect(result[0].item).toBe("Item 1");
    });
  });

  describe("PDF Generation", () => {
    const mockInFlowData = [
      {
        datetime: { toDate: () => new Date() },
        item: "Test Item",
        description: "Test Description",
        quantity: 5,
        total_value: 100,
        unit_value: 20,
      },
    ];

    const mockOutFlowData = [
      {
        datetime: { toDate: () => new Date() },
        item: "Test Item",
        description: "Test Description",
        quantity: 3,
        total_price: 150,
        unit_price: 50,
      },
    ];

    let pdfDoc;

    beforeEach(() => {
      pdfDoc = new PDFDocument();
      jest.spyOn(PDFDocument.prototype, "end").mockImplementation(function () {
        this.emit("end");
      });
    });

    afterEach(() => {
      if (pdfDoc) {
        pdfDoc.end();
      }
    });

    it("should generate inFlow PDF", async () => {
      const pdf = await flowService.generateInFlowPDF(mockInFlowData);
      expect(pdf).toBeInstanceOf(Buffer);
    });

    it("should generate outFlow PDF", async () => {
      const pdf = await flowService.generateOutFlowPDF(mockOutFlowData);
      expect(pdf).toBeInstanceOf(Buffer);
    });

    it("should generate relationship PDF", async () => {
      const pdf = await flowService.generateRelationshipPDF(
        mockInFlowData,
        mockOutFlowData
      );
      expect(pdf).toBeInstanceOf(Buffer);
    });
  });
});
