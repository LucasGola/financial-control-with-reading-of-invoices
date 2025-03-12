import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type Summary = {
  totalQuantity: number;
  totalValue: number;
  averageUnitValue: number;
};

type Detail = {
  total_value: number;
  datetime: {
    _seconds: number;
    _nanoseconds: number;
  };
  item: string;
  quantity: number;
  description: string;
  unit_value: number;
};

type InflowData = {
  summary: Summary;
  details: Detail[];
};

export default function InflowScreen() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<InflowData | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_HOST}/inflow-data?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_HOST}/inflow-report?startDate=${startDate}&endDate=${endDate}`
      );
      const blob = await response.blob();

      const fileUri = FileSystem.documentDirectory + 'inflow-report.pdf';
      const buffer = await blob.arrayBuffer();
      await FileSystem.writeAsStringAsync(fileUri, buffer.toString(), {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error downloading report:', error);
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
            <Card.Title title="Summary" />
            <Card.Content>
              <Text>Total Quantity: {data.summary.totalQuantity}</Text>
              <Text>Total Value: ${data.summary.totalValue}</Text>
              <Text>Average Unit Value: ${data.summary.averageUnitValue}</Text>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>Details</Text>
          {data.details.map((detail, index) => (
            <Card key={index} style={styles.detailCard}>
              <Card.Content>
                <Text>Item: {detail.item}</Text>
                <Text>Quantity: {detail.quantity}</Text>
                <Text>Unit Value: ${detail.unit_value}</Text>
                <Text>Total Value: ${detail.total_value}</Text>
                <Text>Description: {detail.description}</Text>
                <Text>
                  Date:{' '}
                  {new Date(
                    detail.datetime._seconds * 1000
                  ).toLocaleDateString()}
                </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailCard: {
    marginBottom: 8,
  },
});
