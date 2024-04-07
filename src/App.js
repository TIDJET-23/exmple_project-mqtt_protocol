import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Card, CardContent, CardHeader, Typography, Grid, TextField, Button } from '@mui/material';
import './App.css'

const App = () => {
  const [sensorData, setSensorData] = useState({});
  const [mqttUrl, setMqttUrl] = useState('localhost:8080');
  const [connected, setConnected] = useState(false);

  const connectToMqtt = () => {
    const client = mqtt.connect('ws://'+mqttUrl);

    client.on('connect', () => {
      setConnected(true);
      console.log('Connected to MQTT server');
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
        [data.name]: data.value,
      }));
    });

    return () => {
      client.end();
    };
  };

  useEffect(() => {
    if (connected) {
      return connectToMqtt();
    }
  }, [connected, mqttUrl]);

  return (
    <>
      <div className='title' ><b>connect To Mqtt</b></div>
      <Grid spacing={2} className='container-app'>
        <Grid item xs={12}>
          <TextField
            label="MQTT URL"
            value={mqttUrl}
            onChange={(e) => setMqttUrl(e.target.value)}
            fullWidth
          />
          <Button onClick={() => setConnected(true)} variant="contained" color="primary" style={{ marginTop: '1rem' }}>
            Connect
          </Button>
        </Grid>

        {Object.entries(sensorData).map(([name, value], index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className='card-app'>
              <CardHeader title={name} className='card-title-app'/>
              <CardContent>
                <Typography variant="h6">Value:</Typography>
                <Typography variant="body1">{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default App;
