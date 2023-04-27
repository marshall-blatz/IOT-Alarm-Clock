const mqtt = require('mqtt');


// MQTT topics to subscribe to
const topic1 = 'iowa-iot-project/sleep-data';
const topic2 = 'iowa-iot-project/alarm/on';
const topic3 = 'iowa-iot-project/alarm/off';

// Create MQTT client instance
const client = mqtt.connect('mqtt://broker.mqttdashboard.com');

// Lightbulb credentials
const apiToken = 'c23482144a0c07eefdd1d025d1691679b5a42297bf91743341e839e7939cdd40';
const selector = 'label%3ARalph';

let startTime = null
let endTime = null
let restingHr = null

// MQTT connect event
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  // Subscribe to the three topics
  client.subscribe(topic1);
  client.subscribe(topic2);
  client.subscribe(topic3);
});

// MQTT message event
client.on('message', (topic, message) => {
    // Alarm is toggled on or off
    if(topic === topic2 || topic === topic3){
        alarm = JSON.parse(message)
        console.log(alarm)
        startTime = alarm.startTime === null ? null : alarm.startTime.seconds - 18000 //set forward 5 hours
        endTime = alarm.endTime === null ? null : alarm.endTime.seconds - 18000 //set forward 5 hours
        restingHr = alarm.restingHr
        console.log(alarm.restingHr)
    }
    // Heart rate data is received
    if(topic === topic1){
        let heartRate = parseInt(message.toString())
        console.log("Heart Rate: ", heartRate)
        console.log("Threshold: ", restingHr * 0.8)
        console.log()
        if(startTime && endTime && restingHr){
            if(isTimeBetween(startTime, endTime) && heartRate <= restingHr*0.8) changeLightbulbState('on', 'white', 10);
            if(isPastAlarm(endTime)){
                console.log("play alarm")
                client.publish("iowa-iot-project/alarm-trigger", "beep")
            }
        }

    }

});

function isTimeBetween(start, end) {
    const now = new Date(); // Get current time
    const startSeconds = start % (24 * 60 * 60); // Normalize start time to seconds since midnight
    //console.log("start seconds: ", startSeconds)
    const endSeconds = end % (24 * 60 * 60); // Normalize end time to seconds since midnight
    //console.log("end seconds: ", endSeconds)
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(); // Get current time in seconds since midnight
    //console.log("now seconds: ", nowSeconds)
    //console.log("")
    return startSeconds <= nowSeconds && nowSeconds <= endSeconds; // Check if current time is between start and end times
  }

function isPastAlarm(end){
    const now = new Date()
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(); // Get current time in seconds since midnight
    const endSeconds = end % (24 * 60 * 60); // Normalize end time to seconds since midnight
    return nowSeconds > endSeconds
}


// Function to turn the lightbulb on
async function changeLightbulbState(power, color, duration) {
    try {
        const response = await fetch(`https://api.lifx.com/v1/lights/${selector}/state`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            power: power,
            color: color,
            duration: duration
        })
        });
        if (response.ok) {
        console.log('Lightbulb updated successfully!');
        } else {
        console.error('Failed to update lightbulb:', response.statusText);
        }
    } catch (error) {
        console.error('Error updating lightbulb:', error);
    }
}



