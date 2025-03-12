import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type RelationshipData = {
  summary: {
    financial: {
      totalInFlow: number;
      totalOutFlow: number;
      profit: number;
      profitMargin: number;
    };
    inventory: {
      totalInQuantity: number;
      totalOutQuantity: number;
      currentStock: number;
      movementRate: number;
    };
  };
  inFlowDetails: Array<{
    total_value: number;
    datetime: { _seconds: number; _nanoseconds: number };
    item: string;
    quantity: number;
    description: string;
    unit_value: number;
  }>;
  outFlowDetails: Array<{
    datetime: { _seconds: number; _nanoseconds: number };
    item: string;
    quantity: number;
    total_price: number;
    description: string;
    unit_price: number;
  }>;
  itemAnalysis: Array<{
    item: string;
    inFlow: { quantity: number; value: number };
    outFlow: { quantity: number; value: number };
    analysis: {
      currentStock: number;
      profit: number;
      profitMargin: number;
      movementRate: number;
    };
  }>;
};

export default function RelationshipScreen() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<RelationshipData | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_HOST}/relationship-data?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_HOST}/relationship-report?startDate=${startDate}&endDate=${endDate}`
      );
      const blob = await response.blob();

      const fileUri = FileSystem.documentDirectory + "relationship-report.pdf";
      const buffer = await blob.arrayBuffer();
      await FileSystem.writeAsStringAsync(fileUri, buffer.toString(), {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.dateInputs}>
        <TextInput
          label="Start Date"
          value={startDate}
          onChangeText={setStartDate}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          label="End Date"
          value={endDate}
          onChangeText={setEndDate}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.buttons}>
        <Button mode="contained" onPress={fetchData} style={styles.button}>
          Fetch Data
        </Button>
        <Button mode="outlined" onPress={downloadReport} style={styles.button}>
          Download Report
        </Button>
      </View>

      {data && (
        <View style={styles.dataContainer}>
          <Card style={styles.summaryCard}>
            <Card.Title title="Financial Summary" />
            <Card.Content>
              <Text>Total Inflow: ${data.summary.financial.totalInFlow}</Text>
              <Text>Total Outflow: ${data.summary.financial.totalOutFlow}</Text>
              <Text>Profit: ${data.summary.financial.profit}</Text>
              <Text>Profit Margin: {data.summary.financial.profitMargin}%</Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Title title="Inventory Summary" />
            <Card.Content>
              <Text>
                Total In Quantity: {data.summary.inventory.totalInQuantity}
              </Text>
              <Text>
                Total Out Quantity: {data.summary.inventory.totalOutQuantity}
              </Text>
              <Text>Current Stock: {data.summary.inventory.currentStock}</Text>
              <Text>Movement Rate: {data.summary.inventory.movementRate}%</Text>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>Item Analysis</Text>
          {data.itemAnalysis.map((item, index) => (
            <Card key={index} style={styles.detailCard}>
              <Card.Title title={item.item} />
              <Card.Content>
                <Text style={styles.subheader}>Inflow</Text>
                <Text>Quantity: {item.inFlow.quantity}</Text>
                <Text>Value: ${item.inFlow.value}</Text>

                <Text style={styles.subheader}>Outflow</Text>
                <Text>Quantity: {item.outFlow.quantity}</Text>
                <Text>Value: ${item.outFlow.value}</Text>

                <Text style={styles.subheader}>Analysis</Text>
                <Text>Current Stock: {item.analysis.currentStock}</Text>
                <Text>Profit: ${item.analysis.profit}</Text>
                <Text>Profit Margin: {item.analysis.profitMargin}%</Text>
                <Text>Movement Rate: {item.analysis.movementRate}%</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dateInputs: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  dataContainer: {
    marginTop: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailCard: {
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
});
