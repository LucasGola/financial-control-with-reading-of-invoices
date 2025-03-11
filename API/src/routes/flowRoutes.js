const express = require("express");
const FlowService = require("../services/flowService");

const router = express.Router();
const flowService = new FlowService();

// POST route to insert inFlow data
router.post("/inflow", async (req, res) => {
  try {
    const flowData = req.body;
    if (
      !flowData.datetime ||
      !flowData.item ||
      !flowData.quantity ||
      !flowData.total_value ||
      !flowData.unit_value
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await flowService.insertInFlowData(flowData);
    res.status(201).json({ message: "Data inserted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST route to insert outFlow data
router.post("/outflow", async (req, res) => {
  try {
    const flowData = req.body;
    if (
      !flowData.datetime ||
      !flowData.item ||
      !flowData.quantity ||
      !flowData.total_price ||
      !flowData.unit_price
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await flowService.insertOutFlowData(flowData);
    res.status(201).json({ message: "Data inserted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route for outFlow data
router.get("/outflow-data", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
    }

    const data = await flowService.getOutFlowData(startDate, endDate);
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = data.reduce((sum, item) => sum + item.total_price, 0);
    const avgUnitPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0;

    res.json({
      summary: {
        totalQuantity,
        totalPrice,
        averageUnitPrice: avgUnitPrice,
      },
      details: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route for inFlow data
router.get("/inflow-data", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
    }

    const data = await flowService.getInFlowData(startDate, endDate);
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = data.reduce((sum, item) => sum + item.total_value, 0);
    const avgUnitValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    res.json({
      summary: {
        totalQuantity,
        totalValue,
        averageUnitValue: avgUnitValue,
      },
      details: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route for relationship data
router.get("/relationship-data", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
    }

    const inFlowData = await flowService.getInFlowData(startDate, endDate);
    const outFlowData = await flowService.getOutFlowData(startDate, endDate);

    // Calculate summary metrics
    const totalInFlow = inFlowData.reduce(
      (sum, item) => sum + item.total_value,
      0
    );
    const totalOutFlow = outFlowData.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const totalInQuantity = inFlowData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalOutQuantity = outFlowData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const profit = totalOutFlow - totalInFlow;
    const profitMargin = totalInFlow > 0 ? (profit / totalInFlow) * 100 : 0;

    // Calculate item-wise analysis
    const items = new Set([
      ...inFlowData.map((item) => item.item),
      ...outFlowData.map((item) => item.item),
    ]);

    const itemAnalysis = Array.from(items).map((itemName) => {
      const itemInFlow = inFlowData.filter((flow) => flow.item === itemName);
      const itemOutFlow = outFlowData.filter((flow) => flow.item === itemName);

      const itemInQuantity = itemInFlow.reduce(
        (sum, flow) => sum + flow.quantity,
        0
      );
      const itemOutQuantity = itemOutFlow.reduce(
        (sum, flow) => sum + flow.quantity,
        0
      );
      const itemInValue = itemInFlow.reduce(
        (sum, flow) => sum + flow.total_value,
        0
      );
      const itemOutValue = itemOutFlow.reduce(
        (sum, flow) => sum + flow.total_price,
        0
      );
      const itemProfit = itemOutValue - itemInValue;
      const itemProfitMargin =
        itemInValue > 0 ? (itemProfit / itemInValue) * 100 : 0;

      return {
        item: itemName,
        inFlow: {
          quantity: itemInQuantity,
          value: itemInValue,
        },
        outFlow: {
          quantity: itemOutQuantity,
          value: itemOutValue,
        },
        analysis: {
          currentStock: itemInQuantity - itemOutQuantity,
          profit: itemProfit,
          profitMargin: itemProfitMargin,
          movementRate:
            itemInQuantity > 0 ? (itemOutQuantity / itemInQuantity) * 100 : 0,
        },
      };
    });

    res.json({
      summary: {
        financial: {
          totalInFlow,
          totalOutFlow,
          profit,
          profitMargin,
        },
        inventory: {
          totalInQuantity,
          totalOutQuantity,
          currentStock: totalInQuantity - totalOutQuantity,
          movementRate:
            totalInQuantity > 0
              ? (totalOutQuantity / totalInQuantity) * 100
              : 0,
        },
      },
      inFlowDetails: inFlowData,
      outFlowDetails: outFlowData,
      itemAnalysis,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/outflow-report", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
    }

    const data = await flowService.getOutFlowData(startDate, endDate);
    const pdf = await flowService.generateOutFlowPDF(data, startDate, endDate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=outflow-report.pdf"
    );
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/inflow-report", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
    }

    const data = await flowService.getInFlowData(startDate, endDate);
    const pdf = await flowService.generateInFlowPDF(data, startDate, endDate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=inflow-report.pdf"
    );
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/relationship-report", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
    }

    const inFlowData = await flowService.getInFlowData(startDate, endDate);
    const outFlowData = await flowService.getOutFlowData(startDate, endDate);
    const pdf = await flowService.generateRelationshipPDF(
      inFlowData,
      outFlowData,
      startDate,
      endDate
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=relationship-report.pdf"
    );
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
