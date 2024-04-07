import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Card, CardContent, CardHeader, Typography, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,} from 'chart.js';

ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,Title,Tooltip,Legend);

const App = () => {
  const [sensorData, setSensorData] = useState({});

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:8080');

    client.on('connect', () => {
      client.subscribe('value/#', (err) => {
        if (!err) {
          console.log('Subscribed to sensor values');
        }
      });
    });

    client.on('message', (topic, message) => {
      const data = JSON.parse(message.toString());
      setSensorData((prevData) => ({
        ...prevData,
        [data.name]: {
          ...prevData[data.name],
          values: [...(prevData[data.name]?.values || []), data.value],
          types: [...(prevData[data.name]?.types || []), data.type],
        },
      }));
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <Grid container spacing={2}>
      {Object.entries(sensorData).map(([name, data], index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardHeader title={name} />
            <CardContent>
              <Typography variant="h6">Values:</Typography>
              <Line
                data={{
                  labels: data.types,
                  datasets: [
                    {
                      label: 'Sensor Value',
                      data: data.values,
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    x: {
                      type: 'category',
                    },
                    y: {
                      type: 'linear',
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Sensor Data',
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default App;
