const { db } = require("../config/firebase");
const PDFDocument = require("pdfkit");
const { format } = require("date-fns");

class FlowService {
  constructor() {
    this.movementCollection = db.collection("movement");
  }

  async insertInFlowData(data) {
    const docRef = this.movementCollection.doc("inFlow");
    const timestamp = new Date().getTime().toString();

    await docRef.set(
      {
        [timestamp]: {
          datetime: new Date(data.datetime),
          description: data.description || "",
          item: data.item,
          quantity: data.quantity,
          total_value: data.total_value,
          unit_value: data.unit_value,
        },
      },
      { merge: true }
    );
  }

  async insertOutFlowData(data) {
    const docRef = this.movementCollection.doc("outFlow");
    const timestamp = new Date().getTime().toString();

    await docRef.set(
      {
        [timestamp]: {
          datetime: new Date(data.datetime),
          description: data.description || "",
          item: data.item,
          quantity: data.quantity,
          total_price: data.total_price,
          unit_price: data.unit_price,
        },
      },
      { merge: true }
    );
  }

  async getInFlowData(startDate, endDate) {
    const snapshot = await this.movementCollection.doc("inFlow").get();

    const data = snapshot.data();
    return Object.entries(data)
      .filter(([key, value]) => {
        const timestamp = value.datetime.toDate();
        return (
          timestamp >= new Date(startDate) && timestamp <= new Date(endDate)
        );
      })
      .map(([key, value]) => value);
  }

  async getOutFlowData(startDate, endDate) {
    const snapshot = await this.movementCollection.doc("outFlow").get();

    const data = snapshot.data();
    return Object.entries(data)
      .filter(([key, value]) => {
        const timestamp = value.datetime.toDate();
        return (
          timestamp >= new Date(startDate) && timestamp <= new Date(endDate)
        );
      })
      .map(([key, value]) => value);
  }

  _setupDocument(doc, title, startDate, endDate) {
    // Add company logo placeholder
    doc.fontSize(10).text("INVENTORY FLOW SYSTEM", { align: "right" });
    doc.moveDown(0.5);

    // Add report title and date range
    doc.fontSize(24).text(title, { align: "center" });
    doc
      .fontSize(12)
      .text(
        `Report Period: ${format(new Date(startDate), "PPP")} - ${format(
          new Date(endDate),
          "PPP"
        )}`,
        { align: "center" }
      );
    doc.moveDown();

    // Add generation timestamp
    doc
      .fontSize(10)
      .text(`Generated on: ${format(new Date(), "PPP p")}`, { align: "right" });
    doc.moveDown();

    return doc;
  }

  _drawTableHeader(doc, headers, yPosition) {
    // Draw header background
    doc.rect(50, yPosition - 5, 500, 20).fill("#f3f4f6");

    // Draw header text
    doc.fillColor("#000000");
    headers.forEach(([text, x]) => {
      doc.fontSize(10).text(text, x, yPosition, { width: 100 });
    });

    // Draw separator line
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    return yPosition + 10;
  }

  _formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  generateInFlowPDF(data, startDate, endDate) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      this._setupDocument(doc, "Input Flow Report", startDate, endDate);

      // Summary section
      doc.fontSize(14).text("Summary", { underline: true });
      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = data.reduce((sum, item) => sum + item.total_value, 0);
      const avgUnitValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      doc.fontSize(12);
      doc.text(`Total Items Received: ${totalQuantity.toLocaleString()}`);
      doc.text(`Total Value: ${this._formatCurrency(totalValue)}`);
      doc.text(`Average Unit Value: ${this._formatCurrency(avgUnitValue)}`);
      doc.moveDown(2);

      // Detailed records
      doc.fontSize(14).text("Detailed Records", { underline: true });
      doc.moveDown();

      let yPosition = doc.y;
      const headers = [
        ["Date", 50],
        ["Item", 150],
        ["Description", 250],
        ["Quantity", 350],
        ["Unit Value", 420],
        ["Total Value", 490],
      ];

      yPosition = this._drawTableHeader(doc, headers, yPosition);

      // Table content
      data.forEach((item, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
          yPosition = this._drawTableHeader(doc, headers, yPosition);
        }

        const rowColor = index % 2 === 0 ? "#ffffff" : "#f9fafb";
        doc.rect(50, yPosition - 5, 500, 20).fill(rowColor);
        doc.fillColor("#000000");

        doc.fontSize(10);
        doc.text(format(item.datetime.toDate(), "PP"), 50, yPosition);
        doc.text(item.item, 150, yPosition);
        doc.text(item.description || "-", 250, yPosition);
        doc.text(item.quantity.toLocaleString(), 350, yPosition);
        doc.text(this._formatCurrency(item.unit_value), 420, yPosition);
        doc.text(this._formatCurrency(item.total_value), 490, yPosition);

        yPosition += 20;
      });

      // Footer
      doc.fontSize(8);
      doc.text("Page 1", 50, 750, { align: "center" });

      doc.end();
    });
  }

  generateOutFlowPDF(data, startDate, endDate) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      this._setupDocument(doc, "Output Flow Report", startDate, endDate);

      // Summary section
      doc.fontSize(14).text("Summary", { underline: true });
      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = data.reduce((sum, item) => sum + item.total_price, 0);
      const avgUnitPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0;

      doc.fontSize(12);
      doc.text(`Total Items Dispatched: ${totalQuantity.toLocaleString()}`);
      doc.text(`Total Revenue: ${this._formatCurrency(totalPrice)}`);
      doc.text(`Average Unit Price: ${this._formatCurrency(avgUnitPrice)}`);
      doc.moveDown(2);

      // Detailed records
      doc.fontSize(14).text("Detailed Records", { underline: true });
      doc.moveDown();

      let yPosition = doc.y;
      const headers = [
        ["Date", 50],
        ["Item", 150],
        ["Description", 250],
        ["Quantity", 350],
        ["Unit Price", 420],
        ["Total Price", 490],
      ];

      yPosition = this._drawTableHeader(doc, headers, yPosition);

      // Table content
      data.forEach((item, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
          yPosition = this._drawTableHeader(doc, headers, yPosition);
        }

        const rowColor = index % 2 === 0 ? "#ffffff" : "#f9fafb";
        doc.rect(50, yPosition - 5, 500, 20).fill(rowColor);
        doc.fillColor("#000000");

        doc.fontSize(10);
        doc.text(format(item.datetime.toDate(), "PP"), 50, yPosition);
        doc.text(item.item, 150, yPosition);
        doc.text(item.description || "-", 250, yPosition);
        doc.text(item.quantity.toLocaleString(), 350, yPosition);
        doc.text(this._formatCurrency(item.unit_price), 420, yPosition);
        doc.text(this._formatCurrency(item.total_price), 490, yPosition);

        yPosition += 20;
      });

      // Footer
      doc.fontSize(8);
      doc.text("Page 1", 50, 750, { align: "center" });

      doc.end();
    });
  }

  generateRelationshipPDF(inFlowData, outFlowData, startDate, endDate) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      this._setupDocument(doc, "Flow Relationship Report", startDate, endDate);

      // Overall Summary
      doc.fontSize(14).text("Overall Summary", { underline: true });
      const totalInFlow = inFlowData.reduce(
        (sum, item) => sum + item.total_value,
        0
      );
      const totalOutFlow = outFlowData.reduce(
        (sum, item) => sum + item.total_price,
        0
      );
      const balance = totalInFlow - totalOutFlow;
      const profitMargin =
        totalInFlow > 0
          ? ((totalOutFlow - totalInFlow) / totalInFlow) * 100
          : 0;

      doc.fontSize(12);
      doc.text("Financial Overview:", { underline: true });
      doc.text(`Total Input Value: ${this._formatCurrency(totalInFlow)}`);
      doc.text(`Total Output Value: ${this._formatCurrency(totalOutFlow)}`);
      doc.text(`Balance: ${this._formatCurrency(balance)}`);
      doc.text(`Profit Margin: ${profitMargin.toFixed(2)}%`);
      doc.moveDown();

      doc.text("Quantity Overview:", { underline: true });
      const totalInQuantity = inFlowData.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalOutQuantity = outFlowData.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      doc.text(`Total Items Received: ${totalInQuantity.toLocaleString()}`);
      doc.text(`Total Items Dispatched: ${totalOutQuantity.toLocaleString()}`);
      doc.text(
        `Remaining Items: ${(
          totalInQuantity - totalOutQuantity
        ).toLocaleString()}`
      );
      doc.moveDown(2);

      // Item-wise Analysis
      doc.fontSize(14).text("Item-wise Analysis", { underline: true });
      doc.moveDown();

      const items = new Set([
        ...inFlowData.map((item) => item.item),
        ...outFlowData.map((item) => item.item),
      ]);

      let yPosition = doc.y;
      items.forEach((itemName) => {
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }

        const itemInFlow = inFlowData.filter((flow) => flow.item === itemName);
        const itemOutFlow = outFlowData.filter(
          (flow) => flow.item === itemName
        );

        const totalInQuantity = itemInFlow.reduce(
          (sum, flow) => sum + flow.quantity,
          0
        );
        const totalOutQuantity = itemOutFlow.reduce(
          (sum, flow) => sum + flow.quantity,
          0
        );
        const totalInValue = itemInFlow.reduce(
          (sum, flow) => sum + flow.total_value,
          0
        );
        const totalOutValue = itemOutFlow.reduce(
          (sum, flow) => sum + flow.total_price,
          0
        );
        const itemProfit = totalOutValue - totalInValue;
        const itemProfitMargin =
          totalInValue > 0
            ? ((totalOutValue - totalInValue) / totalInValue) * 100
            : 0;

        doc.fontSize(12).text(itemName, { underline: true });
        doc.fontSize(10);

        // Create a table-like structure
        const grid = [
          ["Quantity Analysis", "Value Analysis"],
          [
            `Input: ${totalInQuantity.toLocaleString()}`,
            `Input Value: ${this._formatCurrency(totalInValue)}`,
          ],
          [
            `Output: ${totalOutQuantity.toLocaleString()}`,
            `Output Value: ${this._formatCurrency(totalOutValue)}`,
          ],
          [
            `Remaining: ${(
              totalInQuantity - totalOutQuantity
            ).toLocaleString()}`,
            `Profit/Loss: ${this._formatCurrency(itemProfit)}`,
          ],
          ["", `Margin: ${itemProfitMargin.toFixed(2)}%`],
        ];

        let localY = yPosition + 20;
        grid.forEach((row, index) => {
          const [left, right] = row;
          if (index === 0) {
            doc.font("Helvetica-Bold");
          } else {
            doc.font("Helvetica");
          }
          doc.text(left, 50, localY);
          doc.text(right, 300, localY);
          localY += 20;
        });

        yPosition = localY + 20;
        doc.moveDown();
      });

      // Footer
      doc.fontSize(8);
      doc.text("Page 1", 50, 750, { align: "center" });

      doc.end();
    });
  }
}

module.exports = FlowService;
